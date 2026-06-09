const jwt = require('jsonwebtoken');
const { client } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'lease-land-dev-secret-key-change-in-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const result = await client.execute({
      sql: 'SELECT id, email, name, state, subscription_status, free_questions_used, referral_code FROM users WHERE id = ?',
      args: [decoded.userId]
    });
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      const result = await client.execute({
        sql: 'SELECT id, email, name, state, subscription_status, free_questions_used, referral_code FROM users WHERE id = ?',
        args: [decoded.userId]
      });
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
}

module.exports = { generateToken, verifyToken, requireAuth, optionalAuth, JWT_SECRET };
