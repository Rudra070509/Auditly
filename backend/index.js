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
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
