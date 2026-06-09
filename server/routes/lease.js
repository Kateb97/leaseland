const express = require('express');
const multer = require('multer');
const { client } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkLease } = require('../services/claude');
const { parsePdf } = require('../services/pdf');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/lease/check
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { leaseText, state } = req.body;

    if (!leaseText || leaseText.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide lease text (at least 10 characters)' });
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
        message: 'You have used your free question. Subscribe for unlimited lease checks!',
        needsPayment: true
      });
    }

    if (!isSubscribed) {
      await client.execute({
        sql: 'UPDATE users SET free_questions_used = free_questions_used + 1 WHERE id = ?',
        args: [req.user.id]
      });
    }

    const result = await checkLease(leaseText, 'AU', userState);

    await client.execute({
      sql: 'INSERT INTO lease_checks (user_id, state, lease_text, analysis) VALUES (?, ?, ?, ?)',
      args: [req.user.id, userState, leaseText, JSON.stringify(result)]
    });

    const updatedResult = await client.execute({
      sql: 'SELECT free_questions_used FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const updated = updatedResult.rows[0];

    res.json({
      analysis: result.analysis || result,
      state: userState,
      free_questions_remaining: isSubscribed ? 999 : Math.max(0, 1 - updated.free_questions_used),
    });
  } catch (err) {
    console.error('Lease check error:', err);
    res.status(500).json({ error: 'Error analyzing lease' });
  }
});

// POST /api/lease/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    const { state } = req.body;
    const userState = state || req.user.state;

    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userResult.rows[0];

    const isSubscribed = user.subscription_status === 'active';
    const hasFreeQuestion = user.free_questions_used < 1;

    if (!isSubscribed && !hasFreeQuestion) {
      return res.status(402).json({ error: 'No credits remaining', needsPayment: true });
    }

    let pdfText;
    try {
      const result = await parsePdf(req.file.buffer);
      pdfText = result.text;

      if (!pdfText || pdfText.length < 10) {
        return res.status(400).json({
          error: 'Could not extract text from the PDF. Try pasting the lease text directly.',
          extractionFailed: true
        });
      }
    } catch (pdfErr) {
      return res.status(400).json({ error: 'Could not parse the PDF file. Please paste the lease text directly.' });
    }

    if (!isSubscribed) {
      await client.execute({
        sql: 'UPDATE users SET free_questions_used = free_questions_used + 1 WHERE id = ?',
        args: [req.user.id]
      });
    }

    const result = await checkLease(pdfText, 'AU', userState);

    await client.execute({
      sql: 'INSERT INTO lease_checks (user_id, state, lease_text, analysis) VALUES (?, ?, ?, ?)',
      args: [req.user.id, userState, pdfText, JSON.stringify(result)]
    });

    const updatedResult = await client.execute({
      sql: 'SELECT free_questions_used FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const updated = updatedResult.rows[0];

    res.json({
      filename: req.file.originalname,
      analysis: result.analysis || result,
      state: userState,
      free_questions_remaining: isSubscribed ? 999 : Math.max(0, 1 - updated.free_questions_used),
    });
  } catch (err) {
    console.error('Lease upload error:', err);
    res.status(500).json({ error: 'Error processing lease PDF' });
  }
});

// GET /api/lease/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, state, created_at, analysis FROM lease_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      args: [req.user.id]
    });

    res.json({
      checks: result.rows.map(c => ({
        ...c,
        analysis: c.analysis ? JSON.parse(c.analysis) : null,
      }))
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

module.exports = router;
