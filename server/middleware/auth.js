// LeaseLand - Auth Middleware
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'lease-land-dev-secret-key-change-in-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const db = getDb();
    const user = db.prepare('SELECT id, email, name, country, state, subscription_status, free_questions_remaining, referral_code, referral_free_months FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      const db = getDb();
      const user = db.prepare('SELECT id, email, name, country, state, subscription_status, free_questions_remaining, referral_code, referral_free_months FROM users WHERE id = ?').get(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid, just continue without user
    }
  }
  next();
}

module.exports = { generateToken, verifyToken, requireAuth, optionalAuth, JWT_SECRET };