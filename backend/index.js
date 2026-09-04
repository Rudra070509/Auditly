require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auditly Backend is running!' });
});

// Create tables if they don't exist
const initDB = async () => {
  try {
    if (!process.env.DATABASE_URL.includes('your_neon_db_connection_string_here')) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          picture TEXT,
          google_id VARCHAR(255) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Add password column if it doesn't exist (for traditional auth)
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);`);
      console.log('Database tables initialized.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDB();

// ---------------------------
// Standard Email/Password Auth
// ---------------------------

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user; // { userId, email, iat, exp }
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, email.split('@')[0]]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'User created successfully', token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    if (!user.password) return res.status(401).json({ error: 'Account created with Google. Please use Google Sign In.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    // Fetch user info using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const payload = await userInfoResponse.json();
    const { email, name, picture, sub: google_id } = payload;

    // Check if user exists, if not create them
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      const insertResult = await db.query(
        'INSERT INTO users (email, name, picture, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, name, picture, google_id]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Generate our own JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

app.post('/api/scan', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${req.file.filename}_report.json`);

  const pythonProcess = spawn('python', [
    'analyzer.py',
    '--input', inputPath,
    '--output', outputPath
  ]);

  pythonProcess.stderr.on('data', (data) => console.error(`Python Error: ${data}`));

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Anomaly engine failed to process file.' });
    }

    fs.readFile(outputPath, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to read results' });
      
      // Cleanup temp files
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});

      res.json(JSON.parse(data));
    });
  });
});

// GEMINI CHAT ENDPOINT
const { GoogleGenerativeAI } = require('@google/generative-ai');
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { prompt, reportData, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured in backend/.env" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemContext = `
You are an expert AI financial auditor and forensic accountant. 
The user is viewing an AI-generated audit report. Here is the anomaly data from their ledger:
${JSON.stringify(reportData)}

Answer the user's questions clearly, professionally, and concisely based ONLY on this data. Explain the anomalies and suggest remedies.
    `.trim();

    const fullPrompt = `${systemContext}\n\nUser Question: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: `AI Error: ${error.message}` });
    }
  });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
