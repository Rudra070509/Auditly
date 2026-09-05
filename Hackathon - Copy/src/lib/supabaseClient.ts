import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction } from './types';
import { RAW_SAMPLE_TRANSACTIONS, SAMPLE_CLIENTS } from './sampleData';
import { processTransactionsWithAnomalies } from './anomalyEngine';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// IndexedDB Helper
const DB_NAME = 'AuditPulseDB';
const STORE_NAME = 'transactions';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getLocalTransactions(): Promise<Transaction[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Transaction[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function saveLocalTransactions(transactions: Transaction[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // Process in batches for performance
      transactions.forEach(t => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('IndexedDB save failed:', e);
  }
}

async function clearLocalTransactions(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('IndexedDB clear failed:', e);
  }
}


/**
 * Loads transactions from Supabase (or IndexedDB fallback)
 */
export async function fetchAuditTransactions(clientName?: string, auditYear?: string): Promise<Transaction[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('audit_transactions').select('*');
      if (clientName) query = query.eq('client_name', clientName);
      if (auditYear) query = query.eq('audit_year', auditYear);

      // Add a limit for enormous DB queries if necessary, but assume it returns a reasonable size.
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return processTransactionsWithAnomalies(data as Transaction[]);
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local fallback store:', err);
    }
  }

  // IndexedDB Fallback
  let records = await getLocalTransactions();
  
  if (!records || records.length === 0) {
    records = RAW_SAMPLE_TRANSACTIONS;
    // Seed initial dataset
    await saveLocalTransactions(processTransactionsWithAnomalies(records));
  } else {
    // If local store has records but lacks records for this client/year, seed them from sample data
    const hasClientData = records.some(r => 
      (!clientName || r.client_name === clientName) && 
      (!auditYear || r.audit_year === auditYear)
    );
    if (!hasClientData) {
      const clientSamples = RAW_SAMPLE_TRANSACTIONS.filter(r => 
        (!clientName || r.client_name === clientName) && 
        (!auditYear || r.audit_year === auditYear)
      );
      if (clientSamples.length > 0) {
        await saveLocalTransactions(processTransactionsWithAnomalies(clientSamples));
        records = [...records, ...clientSamples];
      }
    }
  }

  // Filter if needed
  if (clientName) {
    records = records.filter(r => !r.client_name || r.client_name === clientName);
  }
  if (auditYear) {
    records = records.filter(r => !r.audit_year || r.audit_year === auditYear);
  }

  // They are already processed if we fetched from IDB properly, but to ensure rules are consistent:
  return processTransactionsWithAnomalies(records);
}

/**
 * Inserts parsed Excel records into Supabase & IndexedDB
 */
export async function saveTransactionsToDatabase(newTransactions: Partial<Transaction>[]): Promise<{ success: boolean; count: number; error?: string }> {
  // Ensure required fields
  const processed = processTransactionsWithAnomalies(newTransactions.map((tx, idx) => ({
    id: tx.id || `TXN-PARSED-${Date.now()}-${idx}`,
    transaction_id: tx.transaction_id || `VOUCH-${1000 + idx}`,
    client_name: tx.client_name || 'Apex Infra Tech Pvt Ltd',
    audit_year: tx.audit_year || 'FY 2023-24',
    date: tx.date || new Date().toISOString().split('T')[0],
    posting_date: tx.posting_date || tx.date || new Date().toISOString().split('T')[0],
    account_head: tx.account_head || 'General Expenses',
    description: tx.description || 'Uploaded Invoice',
    debit: Number(tx.debit || 0),
    credit: Number(tx.credit || 0),
    amount: Number(tx.amount || Math.max(Number(tx.debit || 0), Number(tx.credit || 0))),
    gst_number: tx.gst_number || '',
    gst_amount: Number(tx.gst_amount || 0),
    user_id: tx.user_id || 'USR-AUDITOR',
    audit_status: 'Pending',
    risk_score: 0,
    risk_level: 'Low',
    anomalies: []
  })));

  // Try Supabase insert (in batches if very large)
  if (isSupabaseConfigured && supabase) {
    try {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < processed.length; i += BATCH_SIZE) {
        const batch = processed.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('audit_transactions').upsert(batch, { onConflict: 'transaction_id' });
        if (error) console.warn(`Supabase save warning (batch ${i}):`, error);
      }
    } catch (e) {
      console.warn('Supabase connection offline or unconfigured, persisting to local store:', e);
    }
  }

  // Save to IndexedDB
  await saveLocalTransactions(processed);

  return { success: true, count: processed.length };
}

/**
 * Updates audit review status (Approve / Flag / Dismiss / Remediated) with auditor notes and remediation notes
 */
export async function updateAuditStatusInDB(
  id: string, 
  status: 'Pending' | 'Approved' | 'Flagged' | 'Dismissed' | 'Remediated', 
  notes?: string,
  remediationNotes?: string
): Promise<boolean> {
  // IndexedDB update
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      
      getReq.onsuccess = () => {
        const target = getReq.result;
        if (target) {
          target.audit_status = status;
          if (notes !== undefined) target.auditor_notes = notes;
          if (remediationNotes !== undefined) {
            target.remediation_notes = remediationNotes;
            target.remediated_at = new Date().toISOString();
          }
          target.reviewed_at = new Date().toISOString();
          target.reviewed_by = 'CA Partner';
          store.put(target);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("Error updating local db:", e);
  }

  // Supabase update
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: Record<string, any> = {
        audit_status: status,
        auditor_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'CA Partner'
      };
      if (remediationNotes !== undefined) {
        payload.remediation_notes = remediationNotes;
        payload.remediated_at = new Date().toISOString();
      }
      await supabase.from('audit_transactions').update(payload).eq('id', id);
    } catch (e) {
      console.warn('Supabase status update fallback:', e);
    }
  }

  return true;
}

/**
 * Deletes all transactions for a specific client from local IndexedDB and Supabase
 */
export async function deleteClientTransactions(clientName: string): Promise<boolean> {
  try {
    const db = await getDB();
    const all = await getLocalTransactions();
    const remaining = all.filter(t => t.client_name !== clientName);
    
    // Clear and restore remaining transactions
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      remaining.forEach(t => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to delete client transactions from local DB:', e);
  }

  // Supabase delete if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_transactions').delete().eq('client_name', clientName);
    } catch (e) {
      console.warn('Supabase client deletion fallback:', e);
    }
  }

  return true;
}

const CLIENTS_STORAGE_KEY = 'auditpulse_clients_list';

export function getSavedClients(): string[] {
  try {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading clients from storage:', e);
  }
  return SAMPLE_CLIENTS;
}

export function saveClientsList(clients: string[]): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients list:', e);
  }
}

export async function clearLocalData(): Promise<void> {
  await clearLocalTransactions();
  await saveLocalTransactions(processTransactionsWithAnomalies(RAW_SAMPLE_TRANSACTIONS));
}
