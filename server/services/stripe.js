// LeaseLand - Stripe Service
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const PRICES = {
  subscription: {
    priceId: process.env.STRIPE_SUBSCRIPTION_PRICE_ID || 'price_monthly_9',
    amount: 900, // $9.00 in cents
    currency: 'usd',
    product: 'LeaseLand Monthly Subscription',
  },
  oneShot: {
    priceId: process.env.STRIPE_ONESHOT_PRICE_ID || 'price_oneshot_29',
    amount: 2900, // $29.00
    currency: 'usd',
    product: 'LeaseLand One-Shot Lease Review',
  },
};

const DOMAIN = process.env.APP_URL || 'http://localhost:5173';

async function createCheckoutSession(userId, type) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const price = PRICES[type];
  if (!price) throw new Error('Invalid payment type');

  // Create or retrieve Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    customerId = customer.id;
    db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: price.currency,
          product_data: {
            name: price.product,
            description: type === 'subscription' 
              ? 'Monthly subscription - Full lease review + unlimited questions'
              : 'One-time lease review - Full lease analysis',
          },
          unit_amount: price.amount,
          recurring: type === 'subscription' ? { interval: 'month' } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: type === 'subscription' ? 'subscription' : 'payment',
    success_url: `${DOMAIN}/dashboard?payment=success&type=${type}`,
    cancel_url: `${DOMAIN}/pricing?payment=cancelled`,
    metadata: {
      userId,
      type,
    },
  });

  // Record payment
  db.prepare('INSERT INTO payments (id, user_id, stripe_session_id, amount, status, type) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), userId, session.id, price.amount, 'pending', type
  );

  return { url: session.url, sessionId: session.id };
}

async function handleWebhookEvent(event) {
  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const type = session.metadata.type;

      // Update payment record
      db.prepare('UPDATE payments SET status = ? WHERE stripe_session_id = ?').run('completed', session.id);

      if (type === 'subscription') {
        const subscriptionId = session.subscription;
        // Fetch subscription details to get current period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];
        
        db.prepare('UPDATE users SET subscription_status = ?, subscription_id = ?, subscription_end = ?, free_questions_remaining = 9999 WHERE id = ?')
          .run('active', subscriptionId, periodEnd, userId);
      } else if (type === 'oneShot') {
        // One-shot: grant lease check (stored as a flag or increment)
        db.prepare('UPDATE users SET free_questions_remaining = free_questions_remaining + 1 WHERE id = ?')
          .run(userId);
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata.userId;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];
        
        if (userId) {
          db.prepare('UPDATE users SET subscription_status = ?, subscription_end = ? WHERE id = ?')
            .run('active', periodEnd, userId);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      if (userId) {
        db.prepare('UPDATE users SET subscription_status = ?, subscription_id = ?, subscription_end = NULL WHERE id = ?')
          .run('free', null, userId);
      }
      break;
    }
  }
}

module.exports = { createCheckoutSession, handleWebhookEvent, PRICES, DOMAIN };