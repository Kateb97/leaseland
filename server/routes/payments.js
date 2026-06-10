const express = require('express');
const { client } = require('../db');
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
    console.error('Payment session error:', err.message, err.type, err.statusCode);
    res.status(500).json({ error: err.message || 'Error creating payment session' });
  }
});

// GET /api/payments/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, amount, currency, status, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ error: 'Error fetching payment history' });
  }
});

// GET /api/payments/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT subscription_status, free_questions_used FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = result.rows[0];

    res.json({
      subscription_status: user.subscription_status,
      free_questions_remaining: Math.max(0, 1 - user.free_questions_used),
      isActive: user.subscription_status === 'active',
    });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ error: 'Error fetching payment status' });
  }
});

module.exports = router;
