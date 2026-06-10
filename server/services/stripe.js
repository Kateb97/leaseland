const Stripe = require('stripe');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}
const { client } = require('../db');

const PRICES = {
  subscription: {
    priceId: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
    amount: 1400,
    currency: 'aud',
    product: 'LeaseLand Monthly Subscription',
  },
  oneShot: {
    priceId: process.env.STRIPE_ONESHOT_PRICE_ID,
    amount: 4400,
    currency: 'aud',
    product: 'LeaseLand One-Shot Lease Review',
  },
};

const DOMAIN = process.env.APP_URL || 'https://leaseland.vercel.app';

async function createCheckoutSession(userId, type) {
  const userResult = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId]
  });
  if (userResult.rows.length === 0) throw new Error('User not found');
  const user = userResult.rows[0];

  const price = PRICES[type];
  if (!price) throw new Error('Invalid payment type');

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
    await client.execute({
      sql: 'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
      args: [customerId, userId]
    });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: price.currency,
          product_data: {
            name: price.product,
            description: type === 'subscription'
              ? 'Monthly subscription - unlimited lease checks and questions'
              : 'One-time lease review - full lease analysis',
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
      userId: String(userId),
      type,
    },
  });

  await client.execute({
    sql: 'INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
    args: [userId, session.id, price.amount, price.currency, 'pending']
  });

  return { url: session.url, sessionId: session.id };
}

async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const type = session.metadata.type;

      await client.execute({
        sql: 'UPDATE payments SET status = ? WHERE stripe_payment_id = ?',
        args: ['completed', session.id]
      });

      if (type === 'subscription') {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        await client.execute({
          sql: 'UPDATE users SET subscription_status = ?, stripe_subscription_id = ? WHERE id = ?',
          args: ['active', subscription.id, userId]
        });
      } else if (type === 'oneShot') {
        await client.execute({
          sql: 'UPDATE users SET subscription_status = ? WHERE id = ?',
          args: ['active', userId]
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata.userId;
        if (userId) {
          await client.execute({
            sql: 'UPDATE users SET subscription_status = ? WHERE id = ?',
            args: ['free', userId]
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      if (userId) {
        await client.execute({
          sql: 'UPDATE users SET subscription_status = ?, stripe_subscription_id = NULL WHERE id = ?',
          args: ['free', userId]
        });
      }
      break;
    }
  }
}

module.exports = { createCheckoutSession, handleWebhookEvent, PRICES, DOMAIN };
