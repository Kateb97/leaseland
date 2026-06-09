// LeaseLand - Referral Routes
const express = require('express');
const { SQL } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/referral/code
router.get('/code', requireAuth, (req, res) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  res.json({
    referralCode: req.user.referral_code,
    referralLink: `${baseUrl}/signup?ref=${req.user.referral_code}`,
    referralFreeMonths: req.user.referral_free_months,
  });
});

// GET /api/referral/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const totalReferrals = await SQL.get('SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ?', [req.user.id]);
    const completedReferrals = await SQL.get("SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'completed'", [req.user.id]);
    const pendingReferrals = await SQL.get("SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'pending'", [req.user.id]);
    
    const referrals = await SQL.all(`
      SELECT r.id, r.referred_email, r.status, r.free_month_granted, r.created_at, u.name as referred_name
      FROM referrals r
      LEFT JOIN users u ON r.referred_user_id = u.id
      WHERE r.referrer_user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [req.user.id]);

    res.json({
      total: totalReferrals.count,
      completed: completedReferrals.count,
      pending: pendingReferrals.count,
      freeMonthsEarned: req.user.referral_free_months,
      referrals,
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ error: 'Error fetching referral stats' });
  }
});

module.exports = router;
