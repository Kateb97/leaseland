# LeaseLand

AI-powered tenancy assistant for international students renting in Australia.

## Features

- **Lease Checker** — Paste lease text or upload PDF; AI flags unusual, illegal, or negotiable clauses based on your state's tenancy laws
- **Tenancy Assistant** — Ask plain-English questions about bond disputes, maintenance, notice periods, breaking a lease, condition reports
- **6 Australian states** — NSW, VIC, QLD, WA, SA, ACT
- **Modular knowledge base** — Adding UK, Canada, or Ireland = add a directory, no rebuild

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js / Express
- **Database**: SQLite (sql.js — pure JS, no native deps)
- **AI**: Anthropic Claude (Sonnet 4)
- **Payments**: Stripe

## Quick Start

```bash
cd server
cp ../.env.example .env
# Add ANTHROPIC_API_KEY and STRIPE_SECRET_KEY to .env
npm install
npm start

# In another terminal:
cd client
npm install
npm run dev
```

## API Endpoints

- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/lease/check` — Check lease text
- `POST /api/lease/upload` — Upload PDF lease
- `POST /api/assistant/ask` — Ask tenancy question
- `POST /api/payments/create-checkout` — Create Stripe checkout
- `POST /api/referral/stats` — Get referral stats

## Monetization

| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | 1 basic lease question |
| Subscription | $9/month | Full lease reviews + unlimited questions |
| One-shot | $29 | Single full lease review (no subscription) |
| Referral | Free month | Share link with housemates |

## Legal

LeaseLand provides general information only — it is not legal advice. Consult a qualified professional for your specific situation.