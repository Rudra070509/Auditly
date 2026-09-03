import React from 'react';

export default function CompanyProfile() {
  return (
    <div className="bg-slate-50 flex-grow flex flex-col justify-center px-8 py-4">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight text-center">Company Profile</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-slate-700 grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3 space-y-4">
            <p className="text-base leading-relaxed">
              Auditly is at the forefront of financial technology, designed specifically for Chartered Accountants and SME auditing firms. Founded by a team of finance experts and AI engineers, our mission is to eliminate manual ledger scrubbing and make financial audits faster, smarter, and infinitely more accurate.
            </p>
            <p className="text-base leading-relaxed">
              With over thousands of transactions processed daily, our intelligent anomaly detection engine ensures that no suspicious pattern, duplicate entry, or compliance issue goes unnoticed.
            </p>
          </div>
          <div className="md:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Our Values</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span><strong>Integrity:</strong> Uncompromising accuracy in reporting.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span><strong>Innovation:</strong> Constantly evolving AI detection.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span><strong>Security:</strong> Absolute client data confidentiality.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
