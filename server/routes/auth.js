// LeaseLand - Auth Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { SQL } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, country, state } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await SQL.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const userState = state || 'nsw';
    const userCountry = country || 'australia';
    const referralCode = uuidv4().split('-').slice(0, 2).join('').substring(0, 8).toUpperCase();

    let referredBy = null;
    const referralParam = req.body.referralCode;
    if (referralParam) {
      const referrer = await SQL.get('SELECT id FROM users WHERE referral_code = ?', [referralParam.toUpperCase()]);
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    await SQL.run(
      'INSERT INTO users (id, email, password_hash, name, country, state, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email.toLowerCase().trim(), passwordHash, name || null, userCountry, userState, referralCode, referredBy]
    );

    if (referredBy) {
      const refId = uuidv4();
      await SQL.run(
        'INSERT INTO referrals (id, referrer_user_id, referred_email, referred_user_id, status, free_month_granted) VALUES (?, ?, ?, ?, ?, ?)',
        [refId, referredBy, email.toLowerCase().trim(), id, 'completed', 0]
      );
      await SQL.run('UPDATE users SET referral_free_months = referral_free_months + 1 WHERE id = ?', [referredBy]);
    }

    const user = await SQL.get(
      'SELECT id, email, name, country, state, subscription_status, free_questions_remaining, referral_code, referral_free_months FROM users WHERE id = ?',
      [id]
    );
    const token = generateToken(id);

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

    const user = await SQL.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let subscriptionStatus = user.subscription_status;
    if (user.referral_free_months > 0 && subscriptionStatus === 'free') {
      subscriptionStatus = 'active';
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
        state: user.state,
        subscription_status: subscriptionStatus,
        free_questions_remaining: user.free_questions_remaining,
        referral_code: user.referral_code,
        referral_free_months: user.referral_free_months,
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
    const { state, country } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    await SQL.run('UPDATE users SET state = ?, country = ? WHERE id = ?', [state, country || 'australia', req.user.id]);

    req.user.state = state;
    req.user.country = country || 'australia';
    res.json({ user: req.user });
  } catch (err) {
    console.error('State update error:', err);
    res.status(500).json({ error: 'Error updating state' });
  }
});

// GET /api/auth/states
router.get('/states', (req, res) => {
  const { getAllStatesList } = require('../knowledge');
  const states = getAllStatesList();
  res.json({ states });
});

module.exports = router;
