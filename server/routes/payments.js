// LeaseLand - Payment Routes
const express = require('express');
const { SQL } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { createCheckoutSession } = require('../services/stripe');

const router = express.Router();

// POST /api/payments/create-checkout
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

// GET /api/payments/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const payments = await SQL.all(
      'SELECT id, amount, currency, status, type, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ payments });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ error: 'Error fetching payment history' });
  }
});

// GET /api/payments/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await SQL.get(
      'SELECT subscription_status, subscription_end, free_questions_remaining, referral_free_months FROM users WHERE id = ?',
      [req.user.id]
    );
    
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
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ error: 'Error fetching payment status' });
  }
});

module.exports = router;
