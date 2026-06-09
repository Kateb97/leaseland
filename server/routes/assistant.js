const express = require('express');
const { client } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { askAssistant } = require('../services/claude');

const router = express.Router();

// POST /api/assistant/ask
router.post('/ask', requireAuth, async (req, res) => {
  try {
    const { message, conversationId, state } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Please ask a question' });
    }

    const userState = state || req.user.state;

    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userResult.rows[0];

    const isSubscribed = user.subscription_status === 'active';
    const hasFreeQuestion = user.free_questions_used < 1;

    if (!isSubscribed && !hasFreeQuestion) {
      return res.status(402).json({
        error: 'No credits remaining',
        message: 'You have used your free question. Subscribe for unlimited questions!',
        needsPayment: true
      });
    }

    if (!isSubscribed) {
      await client.execute({
        sql: 'UPDATE users SET free_questions_used = free_questions_used + 1 WHERE id = ?',
        args: [req.user.id]
      });
    }

    let convId = conversationId;
    let existingMessages = [];

    if (convId) {
      const convResult = await client.execute({
        sql: 'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
        args: [convId, req.user.id]
      });
      if (convResult.rows.length > 0) {
        existingMessages = JSON.parse(convResult.rows[0].messages || '[]');
      } else {
        convId = null;
      }
    }

    const result = await askAssistant(req.user.id, message, 'AU', userState, convId);

    existingMessages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    existingMessages.push({ role: 'assistant', content: result.answer, timestamp: new Date().toISOString() });
    const trimmed = existingMessages.slice(-20);

    if (convId) {
      await client.execute({
        sql: 'UPDATE conversations SET messages = ? WHERE id = ? AND user_id = ?',
        args: [JSON.stringify(trimmed), convId, req.user.id]
      });
    } else {
      const insertResult = await client.execute({
        sql: 'INSERT INTO conversations (user_id, messages) VALUES (?, ?)',
        args: [req.user.id, JSON.stringify(trimmed)]
      });
      convId = insertResult.lastInsertRowid;
    }

    const updatedResult = await client.execute({
      sql: 'SELECT free_questions_used FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const updated = updatedResult.rows[0];

    res.json({
      conversationId: convId,
      answer: result.answer,
      state: userState,
      free_questions_remaining: isSubscribed ? 999 : Math.max(0, 1 - updated.free_questions_used),
    });
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Error getting answer' });
  }
});

// GET /api/assistant/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      args: [req.user.id]
    });
    res.json({ conversations: result.rows });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

// GET /api/assistant/conversation/:id
router.get('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conv = result.rows[0];
    res.json({
      id: conv.id,
      messages: JSON.parse(conv.messages || '[]'),
      created_at: conv.created_at,
    });
  } catch (err) {
    console.error('Conversation error:', err);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
});

module.exports = router;
