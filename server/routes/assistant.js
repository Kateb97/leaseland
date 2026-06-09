// LeaseLand - Tenancy Assistant Routes
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { SQL } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { askAssistant } = require('../services/claude');

const router = express.Router();

// POST /api/assistant/ask
router.post('/ask', requireAuth, async (req, res) => {
  try {
    const { message, conversationId, state, country } = req.body;
    
    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Please ask a question' });
    }

    const userState = state || req.user.state;
    const userCountry = country || req.user.country;

    const user = await SQL.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    const isSubscribed = user.subscription_status === 'active' || user.referral_free_months > 0;
    const hasFreeQuestion = user.free_questions_remaining > 0;

    if (!isSubscribed && !hasFreeQuestion) {
      return res.status(402).json({ 
        error: 'No credits remaining',
        message: 'You have used your free question. Subscribe for unlimited lease checks and questions!',
        needsPayment: true 
      });
    }

    if (!isSubscribed && hasFreeQuestion) {
      await SQL.run('UPDATE users SET free_questions_remaining = free_questions_remaining - 1 WHERE id = ?', [req.user.id]);
    }

    let convId = conversationId;
    let conversation;

    if (convId) {
      conversation = await SQL.get('SELECT * FROM assistant_conversations WHERE id = ? AND user_id = ?', [convId, req.user.id]);
    }

    if (!conversation) {
      convId = uuidv4();
      await SQL.run(
        'INSERT INTO assistant_conversations (id, user_id, country, state, messages) VALUES (?, ?, ?, ?, ?)',
        [convId, req.user.id, userCountry, userState, JSON.stringify([])]
      );
      conversation = { messages: '[]' };
    }

    const result = await askAssistant(req.user.id, message, userCountry, userState, convId);

    const messages = JSON.parse(conversation.messages);
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    messages.push({ role: 'assistant', content: result.answer, timestamp: new Date().toISOString() });
    
    const trimmedMessages = messages.slice(-20);
    
    await SQL.run(
      'UPDATE assistant_conversations SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(trimmedMessages), convId]
    );

    const updatedUser = await SQL.get('SELECT free_questions_remaining FROM users WHERE id = ?', [req.user.id]);

    res.json({
      conversationId: convId,
      answer: result.answer,
      state: result.state || userState,
      free_questions_remaining: updatedUser.free_questions_remaining,
    });
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Error getting answer' });
  }
});

// GET /api/assistant/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await SQL.all(
      'SELECT id, state, created_at, updated_at FROM assistant_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ conversations });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

// GET /api/assistant/conversation/:id
router.get('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await SQL.get(
      'SELECT * FROM assistant_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      id: conversation.id,
      state: conversation.state,
      messages: JSON.parse(conversation.messages),
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    });
  } catch (err) {
    console.error('Conversation error:', err);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
});

module.exports = router;
