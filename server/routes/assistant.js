// LeaseLand - Tenancy Assistant Routes
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { askAssistant } = require('../services/claude');

const router = express.Router();

// POST /api/assistant/ask - Ask a question
router.post('/ask', requireAuth, async (req, res) => {
  try {
    const { message, conversationId, state, country } = req.body;
    
    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Please ask a question' });
    }

    const userState = state || req.user.state;
    const userCountry = country || req.user.country;

    // Check subscription / usage
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    const isSubscribed = user.subscription_status === 'active' || user.referral_free_months > 0;
    const hasFreeQuestion = user.free_questions_remaining > 0;

    if (!isSubscribed && !hasFreeQuestion) {
      return res.status(402).json({ 
        error: 'No credits remaining',
        message: 'You have used your free question. Subscribe for unlimited lease checks and questions!',
        needsPayment: true 
      });
    }

    // Deduct if not subscribed
    if (!isSubscribed && hasFreeQuestion) {
      db.prepare('UPDATE users SET free_questions_remaining = free_questions_remaining - 1 WHERE id = ?').run(req.user.id);
    }

    // Get or create conversation
    let convId = conversationId;
    let conversation;

    if (convId) {
      conversation = db.prepare('SELECT * FROM assistant_conversations WHERE id = ? AND user_id = ?').get(convId, req.user.id);
    }

    if (!conversation) {
      convId = uuidv4();
      db.prepare('INSERT INTO assistant_conversations (id, user_id, country, state, messages) VALUES (?, ?, ?, ?, ?)')
        .run(convId, req.user.id, userCountry, userState, JSON.stringify([]));
      conversation = { messages: '[]' };
    }

    // Get AI response
    const result = await askAssistant(req.user.id, message, userCountry, userState, convId);

    // Save messages to conversation
    const messages = JSON.parse(conversation.messages);
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    messages.push({ role: 'assistant', content: result.answer, timestamp: new Date().toISOString() });
    
    // Keep only last 20 messages to stay within size limits
    const trimmedMessages = messages.slice(-20);
    
    db.prepare('UPDATE assistant_conversations SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(trimmedMessages), convId);

    const updatedUser = db.prepare('SELECT free_questions_remaining FROM users WHERE id = ?').get(req.user.id);

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

// GET /api/assistant/conversations - List conversations
router.get('/conversations', requireAuth, (req, res) => {
  const db = getDb();
  const conversations = db.prepare(
    'SELECT id, state, created_at, updated_at FROM assistant_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20'
  ).all(req.user.id);
  
  res.json({ conversations });
});

// GET /api/assistant/conversation/:id - Get conversation messages
router.get('/conversation/:id', requireAuth, (req, res) => {
  const db = getDb();
  const conversation = db.prepare(
    'SELECT * FROM assistant_conversations WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  
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
});

module.exports = router;