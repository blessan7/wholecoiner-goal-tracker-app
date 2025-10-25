# 🪙 Wholecoiner Goal Tracker

A web microapp to help users systematically accumulate one full cryptocurrency unit (e.g., 1 BTC, 1 ETH, 1 SOL) via recurring micro-investments in INR.

## 🎯 Overview

Enable every Indian crypto enthusiast to become a **Wholecoiner** through an intuitive, disciplined, and secure goal-based investment experience.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) with JavaScript
- **Backend**: Node.js + Express (JavaScript)
- **Database**: NeonDB (PostgreSQL Cloud)
- **Blockchain**: Solana (Devnet + Mainnet)
- **Auth**: Privy SDK
- **OnRamp**: OnMeta
- **DEX**: Jupiter Aggregator
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- NeonDB account and credentials
- Privy account and API keys
- Solana devnet wallet for testing

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/Blessan-Alex/wholecoiner-goal-tracker-app.git
cd wholecoiner-goal-tracker-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Fill in your environment variables in `.env`:
```env
DATABASE_URL="your_neondb_connection_string"
PRIVY_APP_ID="your_privy_app_id"
PRIVY_APP_SECRET="your_privy_app_secret"
DEV_WALLET_PRIVATE_KEY="your_devnet_wallet_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

1. Initialize Prisma:
```bash
npx prisma generate
```

2. Run migrations:
```bash
npx prisma migrate dev --name init
```

3. (Optional) Seed the database:
```bash
npm run seed
```

### Running Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
wholecoiner-goal-tracker-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── layout.js          # Root layout
│   └── page.js            # Landing page
├── lib/                   # Utility functions
│   ├── auth.js           # Authentication helpers
│   ├── errors.js         # Error handling
│   ├── logger.js         # Logging utilities
│   └── prisma.js         # Prisma client
├── components/            # React components
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database schema
├── middleware.js         # Next.js middleware
└── public/              # Static assets
```

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Authentication (Coming Soon)
- `POST /api/auth/login` - Privy login
- `POST /api/auth/2fa/verify` - Verify 2FA

### Goals (Coming Soon)
- `POST /api/goals` - Create a new goal
- `GET /api/goals` - List user goals
- `GET /api/goals/:id` - Get goal details
- `PATCH /api/goals/:id` - Update goal
- `PATCH /api/goals/:id/pause` - Pause/resume goal

### Transactions (Coming Soon)
- `POST /api/onramp/simulate` - Simulate devnet on-ramp
- `POST /api/swap/execute` - Execute token swap
- `GET /api/history` - Transaction history
- `GET /api/progress/:goalId` - Goal progress

## 🧪 Testing

```bash
# Run linter
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## 📝 Development Workflow

1. Create a feature branch
2. Make your changes
3. Run linter and formatter
4. Test locally
5. Create pull request

## 🗺️ Roadmap

- [x] Phase 1: Foundation setup (Oct 24)
- [ ] Phase 2: Auth + 2FA integration (Oct 25-26)
- [ ] Phase 3: Goals service (Oct 27)
- [ ] Phase 4: Price & Progress (Oct 28)
- [ ] Phase 5: Devnet simulation (Oct 29-30)
- [ ] Phase 6: UI wiring (Nov 3-4)
- [ ] Phase 7: Testing & Deploy (Nov 7)
- [ ] Phase 8: Finalize (Nov 10)

## 📄 License

Private project - All rights reserved

## 👤 Owner

Blessan Alex

---

For detailed specifications, see [spec-sheet.md](../spec-sheet.md)
