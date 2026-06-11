const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { client } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email');

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

    // Fire-and-forget: signup must succeed even if the email provider is down
    sendWelcomeEmail(user.email, user.name).catch(err =>
      console.error('Welcome email failed:', err.message)
    );

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
        free_questions_remaining: Math.max(0, 1 - Number(user.free_questions_used || 0)),
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()]
    });

    // Always return success to avoid leaking whether an email exists
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await client.execute({
      sql: 'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      args: [userId, token, expiresAt]
    });

    const baseUrl = process.env.APP_URL || 'https://leaseland.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(email.toLowerCase().trim(), resetUrl);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await client.execute({
      sql: 'SELECT * FROM password_resets WHERE token = ? AND used = 0',
      args: [token]
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const reset = result.rows[0];

    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    await client.execute({
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      args: [passwordHash, reset.user_id]
    });

    await client.execute({
      sql: 'UPDATE password_resets SET used = 1 WHERE id = ?',
      args: [reset.id]
    });

    res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

module.exports = router;
