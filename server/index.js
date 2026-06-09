// LeaseLand - Main Express Server
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { getDb, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook needs raw body - must come before json parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { handleWebhookEvent } = require('./services/stripe');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Regular JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize DB on first request and add it to req
app.use((req, res, next) => {
  try {
    req.db = getDb();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lease', require('./routes/lease'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/referral', require('./routes/referral'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = getDb();
    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      db: !!db,
    });
  } catch (e) {
    res.json({ status: 'error', db: false, error: e.message });
  }
});

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize DB then start listening
async function start() {
  try {
    await initDb();
    console.log('Database initialized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LeaseLand server running on port ${PORT}`);
      console.log(`API: http://0.0.0.0:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;