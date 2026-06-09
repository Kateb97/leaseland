const express = require('express');
const { client } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/referral/code
router.get('/code', requireAuth, (req, res) => {
  const baseUrl = process.env.APP_URL || 'https://leaseland.vercel.app';
  res.json({
    referralCode: req.user.referral_code,
    referralLink: `${baseUrl}/signup?ref=${req.user.referral_code}`,
  });
});

// GET /api/referral/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, email, name, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC LIMIT 20',
      args: [req.user.id]
    });

    const referrals = result.rows;

    res.json({
      total: referrals.length,
      referrals: referrals.map(r => ({
        email: r.email,
        name: r.name,
        joined_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ error: 'Error fetching referral stats' });
  }
});

module.exports = router;
