// LeaseLand - Lease Checker Routes
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { SQL } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkLease } = require('../services/claude');
const { parsePdf, cleanupFile, UPLOAD_DIR } = require('../services/pdf');

const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });

// POST /api/lease/check
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { leaseText, state, country } = req.body;
    
    if (!leaseText || leaseText.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide lease text (at least 10 characters)' });
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

    const checkId = uuidv4();
    
    await SQL.run(
      'INSERT INTO lease_checks (id, user_id, lease_text, country, state, status) VALUES (?, ?, ?, ?, ?, ?)',
      [checkId, req.user.id, leaseText, userCountry, userState, 'processing']
    );

    const result = await checkLease(leaseText, userCountry, userState);

    await SQL.run(
      'UPDATE lease_checks SET result = ?, status = ? WHERE id = ?',
      [JSON.stringify(result), 'completed', checkId]
    );

    const updatedUser = await SQL.get('SELECT free_questions_remaining FROM users WHERE id = ?', [req.user.id]);

    res.json({
      checkId,
      analysis: result.analysis,
      state: userState,
      free_questions_remaining: updatedUser.free_questions_remaining,
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

    const { state, country } = req.body;
    const userState = state || req.user.state;
    const userCountry = country || req.user.country;

    const user = await SQL.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    const isSubscribed = user.subscription_status === 'active' || user.referral_free_months > 0;
    const hasFreeQuestion = user.free_questions_remaining > 0;

    if (!isSubscribed && !hasFreeQuestion) {
      cleanupFile(req.file.path);
      return res.status(402).json({ error: 'No credits remaining', needsPayment: true });
    }

    let pdfText;
    try {
      const buffer = require('fs').readFileSync(req.file.path);
      const result = await parsePdf(buffer);
      pdfText = result.text;
      
      if (!pdfText || pdfText.length < 10) {
        cleanupFile(req.file.path);
        return res.status(400).json({ 
          error: 'Could not extract text from the PDF. Try copying and pasting the lease text directly instead.',
          extractionFailed: true
        });
      }
    } catch (pdfErr) {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: 'Could not parse the PDF file. Please paste the lease text directly.' });
    }

    if (!isSubscribed && hasFreeQuestion) {
      await SQL.run('UPDATE users SET free_questions_remaining = free_questions_remaining - 1 WHERE id = ?', [req.user.id]);
    }

    const checkId = uuidv4();
    await SQL.run(
      'INSERT INTO lease_checks (id, user_id, lease_text, pdf_filename, country, state, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [checkId, req.user.id, pdfText, req.file.originalname, userCountry, userState, 'processing']
    );

    const result = await checkLease(pdfText, userCountry, userState);

    await SQL.run(
      'UPDATE lease_checks SET result = ?, status = ? WHERE id = ?',
      [JSON.stringify(result), 'completed', checkId]
    );

    cleanupFile(req.file.path);

    const updatedUser = await SQL.get('SELECT free_questions_remaining FROM users WHERE id = ?', [req.user.id]);

    res.json({
      checkId,
      filename: req.file.originalname,
      analysis: result.analysis,
      state: userState,
      free_questions_remaining: updatedUser.free_questions_remaining,
    });
  } catch (err) {
    console.error('Lease upload error:', err);
    if (req.file) cleanupFile(req.file.path);
    res.status(500).json({ error: 'Error processing lease PDF' });
  }
});

// GET /api/lease/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const checks = await SQL.all(
      'SELECT id, state, status, pdf_filename, created_at, result FROM lease_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    
    res.json({ checks: checks.map(c => ({
      ...c,
      result: c.result ? JSON.parse(c.result) : null,
    }))});
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

module.exports = router;
