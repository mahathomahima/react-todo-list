// Backend: Node.js + Express.js with SQL (PostgreSQL)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key';

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'social_media_dashboard',
  password: 'your_password',
  port: 5432,
});

// User Registration
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    res.json({ userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Social Media Accounts
app.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_accounts');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Social Media Post
app.post('/posts', async (req, res) => {
  const { user_id, platform, content, scheduled_time, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, platform, content, scheduled_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, platform, content, scheduled_time, status]
    );
    res.json({ postId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Analytics
app.get('/analytics', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
