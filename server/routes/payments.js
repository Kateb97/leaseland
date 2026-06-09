// LeaseLand - Payment Routes
const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { createCheckoutSession } = require('../services/stripe');

const router = express.Router();

// POST /api/payments/create-checkout - Create a Stripe Checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type || !['subscription', 'oneShot'].includes(type)) {
      return res.status(400).json({ error: 'Invalid payment type. Must be "subscription" or "oneShot"' });
    }

    const result = await createCheckoutSession(req.user.id, type);
    res.json(result);
  } catch (err) {
    console.error('Payment session error:', err);
    res.status(500).json({ error: 'Error creating payment session' });
  }
});

// GET /api/payments/history - Get payment history
router.get('/history', requireAuth, (req, res) => {
  const db = getDb();
  const payments = db.prepare('SELECT id, amount, currency, status, type, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ payments });
});

// GET /api/payments/status - Get current subscription status
router.get('/status', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT subscription_status, subscription_end, free_questions_remaining, referral_free_months FROM users WHERE id = ?').get(req.user.id);
  
  let effectiveStatus = user.subscription_status;
  if (user.referral_free_months > 0 && effectiveStatus === 'free') {
    effectiveStatus = 'active';
  }

  res.json({
    subscription_status: effectiveStatus,
    subscription_end: user.subscription_end,
    free_questions_remaining: user.free_questions_remaining,
    referral_free_months: user.referral_free_months,
    isActive: effectiveStatus === 'active',
  });
});

module.exports = router;