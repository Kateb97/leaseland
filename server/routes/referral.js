// LeaseLand - Referral Routes
const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/referral/code - Get user's referral code
router.get('/code', requireAuth, (req, res) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  res.json({
    referralCode: req.user.referral_code,
    referralLink: `${baseUrl}/signup?ref=${req.user.referral_code}`,
    referralFreeMonths: req.user.referral_free_months,
  });
});

// GET /api/referral/stats - Get referral statistics
router.get('/stats', requireAuth, (req, res) => {
  const db = getDb();
  
  const totalReferrals = db.prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ?').get(req.user.id);
  const completedReferrals = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'completed'").get(req.user.id);
  const pendingReferrals = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'pending'").get(req.user.id);
  
  // Get referral details
  const referrals = db.prepare(`
    SELECT r.id, r.referred_email, r.status, r.free_month_granted, r.created_at, u.name as referred_name
    FROM referrals r
    LEFT JOIN users u ON r.referred_user_id = u.id
    WHERE r.referrer_user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json({
    total: totalReferrals.count,
    completed: completedReferrals.count,
    pending: pendingReferrals.count,
    freeMonthsEarned: req.user.referral_free_months,
    referrals,
  });
});

module.exports = router;