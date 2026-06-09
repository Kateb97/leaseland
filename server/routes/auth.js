const express = require('express');
const bcrypt = require('bcryptjs');
const { client } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, state } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()]
    });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userState = state || 'NSW';
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    let referredBy = null;
    if (req.body.referralCode) {
      const referrer = await client.execute({
        sql: 'SELECT id FROM users WHERE referral_code = ?',
        args: [req.body.referralCode.toUpperCase()]
      });
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id;
      }
    }

    await client.execute({
      sql: 'INSERT INTO users (email, password, name, state, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)',
      args: [email.toLowerCase().trim(), passwordHash, name || null, userState, referralCode, referredBy]
    });

    const userResult = await client.execute({
      sql: 'SELECT id, email, name, state, subscription_status, free_questions_used, referral_code FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()]
    });
    const user = userResult.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error creating account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        state: user.state,
        subscription_status: user.subscription_status,
        free_questions_used: user.free_questions_used,
        referral_code: user.referral_code,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/state
router.put('/state', requireAuth, async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    await client.execute({
      sql: 'UPDATE users SET state = ? WHERE id = ?',
      args: [state, req.user.id]
    });

    req.user.state = state;
    res.json({ user: req.user });
  } catch (err) {
    console.error('State update error:', err);
    res.status(500).json({ error: 'Error updating state' });
  }
});

// GET /api/auth/states
router.get('/states', (req, res) => {
  const states = [
    { code: 'NSW', name: 'New South Wales' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'QLD', name: 'Queensland' },
    { code: 'WA', name: 'Western Australia' },
    { code: 'SA', name: 'South Australia' },
    { code: 'ACT', name: 'Australian Capital Territory' },
  ];
  res.json({ states });
});

module.exports = router;
