

# 🪙 Wholecoiner Goal Tracker — Specification Sheet v2.1

*(Updated as of October 24, 2025 — Manual OnRamp + Devnet Simulation)*

---

## 1. 📘 Overview

### **Project Name:**

**Wholecoiner Goal Tracker Microapp**

### **Purpose:**

A lightweight **web microapp** under the **Share ecosystem**, designed to help users systematically **accumulate one full cryptocurrency unit** (e.g., 1 BTC, 1 ETH, 1 SOL) via **recurring micro-investments (SIPs/DCA)** in **INR**.

### **Vision Statement:**

Enable every Indian crypto enthusiast to become a **Wholecoiner** through an intuitive, disciplined, and secure goal-based investment experience.

---

## 2. 💡 Problem Statement

Crypto ownership barriers are high due to cost (one Bitcoin ≈ ₹1 crore).
Users need a way to invest small amounts regularly and track progress toward a goal.
The app bridges traditional SIP habits with crypto investing and helps users reach the “Wholecoiner” milestone safely and visually.

---

## 3. 👥 Target Users

| Type                     | Description                    | Motivation                   |
| ------------------------ | ------------------------------ | ---------------------------- |
| **New Investors**        | First-time crypto buyers       | Want safe, gradual entry     |
| **Goal-Oriented Savers** | Users who like defined targets | Motivated by visual progress |
| **Casual Holders**       | Existing crypto users          | Want organized accumulation  |

---

## 4. 🎯 Objectives & KPIs

| Objective                           | KPI                          |
| ----------------------------------- | ---------------------------- |
| Simplify crypto ownership via goals | % of users creating goals    |
| Encourage recurring investments     | Average active plans/user    |
| Boost retention via habit loops     | Monthly Active Users (MAU)   |
| Onboard Web2 users seamlessly       | Wallet creation success rate |

---

## 5. 🔑 Core Features (Updated)

### 5.1 Goal Creation

* Choose crypto (BTC, ETH, SOL).
* Set goal (default = 1 coin).
* Input monthly investment (₹).
* Choose frequency (daily/weekly/monthly).
* Confirm plan → auto invest setup.

### 5.2 Manual Investment Flow (OnMeta OnRamp)

* **No auto-payments** — user manually initiates each buy.
* **OnMeta Integration:** KYC handled by OnMeta (app stores no KYC data).
* **Production Flow:**
  1. User clicks "Buy" → OnMeta widget opens.
  2. User completes payment via OnMeta.
  3. Receives SOL or USDC in their Solana wallet.
  4. App auto-swaps to goal token (BTC/ETH/SOL) via Jupiter DEX.
* **Devnet Simulation (for development/testing):**
  1. User clicks "Buy ₹X" → backend transfers devnet SOL from app wallet to user wallet.
  2. Backend swaps devnet SOL → goal token via Jupiter devnet.
  3. Both transactions recorded in history with shared `batch_id`.

### 5.3 Goal Progress Visualizer

* Circular progress bar + milestone markers.
* Cumulative line graph of total holdings (INR & crypto).
* Time remaining estimate.
* “You’re now a Wholecoiner!” completion badge.

### 5.4 Wallet Integration

* Privy SDK (Gmail login → auto Solana wallet).
* Zero seed phrase UX.
* Wallet address retrieved for transactions.

### 5.5 Transaction History

* List all purchases grouped by `batch_id` (onramp + swap).
* Shows: date, amount (INR & crypto), token, transaction hash, network (devnet/mainnet).
* Export as CSV (optional).
* Filter by month/token/type.

### 5.6 Notifications

* Investment reminders & goal milestones.
* Email + in-app alerts (optional WhatsApp later).

### 5.7 Security Enhancements (NEW)

* **Two-Factor Authentication (2FA):** PIN or biometric after signup.
* WebAuthn API support for device biometrics.
* 2FA check before dashboard access.

### 5.8 Homepage Variants (NEW)

| User Type         | Landing Screen                                     |
| ----------------- | -------------------------------------------------- |
| **New User**      | Onboarding wizard (Welcome → Goal Setup → 2FA)     |
| **Existing User** | Dashboard with progress graph, recent transactions |

### 5.9 Behavioral Lock Mechanism (NEW)

* Users can pause but not instantly stop mid-goal.
* Require confirmation + “cool-off period” (e.g., 3 days).
* Motivational copy: “Stay on track to 1 BTC!”
* Auto-release funds only on goal completion.

---

## 6. 🧭 UX Flow & Screens (Expanded)

### **Overall Flow**

```
Landing → Signup/Login (Privy) → 2FA Setup → Goal Wizard → Confirm Plan 
→ Dashboard (Progress + Graph) → Manual Buy (OnMeta/Devnet Sim) → Auto-Swap to Goal Token
→ Transaction History → Goal Completion Screen
```

### **Key Screens**

1. **Signup / Login:** Gmail + 2FA setup.
2. **Welcome Screen (New User):** Tutorial + Goal Setup.
3. **Goal Wizard:** Currency → Target → Frequency → Amount → Confirm.
4. **Dashboard (Existing User):**

   * Circular tracker + growth graph
   * Transaction list (onramp + swap pairs)
   * Buttons: [Buy with OnMeta] (prod) / [Simulate Buy] (dev), [Pause Plan], [View History]
5. **Goal Completion:** Celebration + Share badge.
6. **Settings:** 2FA management, notifications.

*(User flow chart and screen actions to be visualized in Google Stitch UI Designer.)*

---

## 7. 🧠 Behavioral Design

* **Gamified progress** (visual feedback loop).
* **Positive reinforcement** (celebration on milestones).
* **Friction on withdrawal** (encourages discipline).
* **Ease on completion** (funds auto-released).

---

## 8. 🧩 Technology Stack (Updated)

| Layer             | Technology                         | Notes                                      |
| ----------------- | ---------------------------------- | ------------------------------------------ |
| **Frontend**      | Next.js (React) — **JavaScript**   | No TypeScript.                             |
| **Auth & Wallet** | Privy SDK                          | Gmail login + Solana wallet generation.    |
| **Backend**       | Node.js + Express — **JavaScript** | REST API for goals/investments/swap.       |
| **Database**      | **NeonDB (PostgreSQL Cloud)**      | Stores users, goals, transactions.         |
| **Blockchain**    | Solana (Devnet + Mainnet)          | On-chain swaps via Jupiter DEX.            |
| **OnRamp**        | **OnMeta**                         | Manual widget; KYC handled by OnMeta.      |
| **DEX**           | **Jupiter Aggregator**             | Auto-swap SOL/USDC → goal token.           |
| **Deployment**    | Vercel                             | Hosting platform.                          |
| **Analytics**     | Mixpanel / PostHog                 | Usage tracking.                            |
| **Design Tool**   | **Google Stitch (AI UI Designer)** | Generate HTML/CSS from spec + flows.       |

---

## 9. ⚙️ System Architecture

**High-Level Diagram**

```
[User Browser]
   ↓ (Login/2FA)
[Next.js Frontend + Privy SDK]
   ↓ (API Calls)
[Node.js + Express Backend]
   ↓ (DB Writes)              ↓ (Swap Calls)
[NeonDB (PostgreSQL)]    [Jupiter DEX → Solana]
                              ↗ (OnRamp - Production)
                        [OnMeta Widget → User Wallet]

Development Flow (Devnet):
[User clicks Buy] → [Backend transfers devnet SOL to user] 
                 → [Swap via Jupiter devnet] 
                 → [Record both in history with batch_id]
```

---

## 10. 🧾 API Design (v2.1)

| Endpoint                   | Method | Purpose                                    | Auth   |
| -------------------------- | ------ | ------------------------------------------ | ------ |
| `/api/auth/login`          | POST   | Privy login + session create               | Public |
| `/api/auth/2fa/verify`     | POST   | Verify PIN/biometric                       | Auth   |
| `/api/goals`               | POST   | Create goal                                | Auth   |
| `/api/goals`               | GET    | List goals                                 | Auth   |
| `/api/goals/:id`           | PUT    | Update goal                                | Auth   |
| `/api/goals/:id/pause`     | PATCH  | Pause/stop goal (with cool-off)            | Auth   |
| `/api/onramp/simulate`     | POST   | **Devnet**: Transfer SOL to user wallet    | Auth   |
| `/api/swap/execute`        | POST   | Swap SOL/USDC → goal token via Jupiter    | Auth   |
| `/api/history`             | GET    | Transaction history (grouped by batch_id)  | Auth   |
| `/api/progress/:goalId`    | GET    | Progress details                           | Auth   |

### **Data Model**

```json
{
  "userId": "privy_12345",
  "goalId": "uuid",
  "coin": "BTC",
  "targetAmount": 1,
  "investedAmount": 0.25,
  "frequency": "monthly",
  "monthlyAmountINR": 5000,
  "currency": "INR",
  "status": "active",
  "createdAt": "2025-10-16T12:00:00Z"
}
```

---

## 11. 🔐 Security & Compliance (v2)

| Category              | Control                                                      |
| --------------------- | ------------------------------------------------------------ |
| **2FA**               | PIN or biometric (WebAuthn).                                 |
| **Wallet Security**   | Managed via Privy (encrypted key storage).                   |
| **Data Storage**      | NeonDB encryption at rest + TLS in transit.                  |
| **Compliance**        | GDPR / Indian IT Act compliant.                              |
| **KYC**               | Fully handled by OnMeta; app does not store KYC/PII.         |
| **Payment Flow**      | Manual only (no auto-debits; no RBI e-mandate needed).       |

---

## 12. 🎨 UI Design Principles

* **Minimalist layout:** single focus per screen.
* **Dual homepages:** Onboarding (New) + Dashboard (Existing).
* **Cumulative graph visuals:** line + circular tracker.
* **Neutral palette:** white/black with crypto-themed accents.
* **Responsive:** desktop + mobile.
* **Generated via Google Stitch** for consistency.

---

## 13. 🧠 User Flow Summary (Expanded)

| Step | Action                        | Description                                          |
| ---- | ----------------------------- | ---------------------------------------------------- |
| 1    | **Landing Page**              | "Start Your Wholecoin Journey" CTA.                  |
| 2    | **Sign Up via Gmail**         | Privy login → auto-generates Solana wallet.          |
| 3    | **2FA Setup**                 | Create PIN / enable biometric.                       |
| 4    | **Goal Setup**                | Choose coin, frequency, target amount.               |
| 5    | **Confirm Plan**              | No mandate needed (manual buys only).                |
| 6    | **Dashboard (New User)**      | See initial progress (0% completed).                 |
| 7    | **Manual Buy**                | Click "Buy" → OnMeta widget (prod) or Sim (devnet).  |
| 8    | **Auto-Swap**                 | Backend swaps SOL/USDC → goal token via Jupiter.     |
| 9    | **Dashboard (Existing User)** | Progress graph + transaction history.                |
| 10   | **Pause/Withdraw Flow**       | Cool-off warning + confirmation.                     |
| 11   | **Goal Completion**           | Celebration + auto-release to wallet.                |

---

## 14. 🧮 Business Rules & Logic

* **Min Investment:** ₹100 per manual buy.
* **Max Goal Timeframe:** 10 years.
* **DCA Pricing:** Market rate at time of manual execution (via Jupiter quotes).
* **Pause Cooldown:** 3 days min.
* **Currency:** INR only (phase 1).
* **Auto-release:** Funds to wallet on goal completion.
* **Devnet Simulation:** App dev wallet transfers SOL; slippage/quotes from Jupiter devnet.
* **Batch Tracking:** Each buy creates a `batch_id` linking onramp + swap transactions.

---

## 15. 🗄️ Database Schema (NeonDB)

| Table             | Columns                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Users**         | id (PK), privy_id, email, wallet_address, 2fa_enabled, created_at                                                                                            |
| **Goals**         | id (PK), user_id, coin, target_amount, invested_amount, frequency, amount_inr, status, created_at                                                            |
| **Transactions**  | id (PK), goal_id, batch_id, type (onramp/swap), provider (OnMeta/Jupiter), network (devnet/mainnet), txn_hash, amount_inr, amount_crypto, token_mint, timestamp, meta (JSONB) |
| **Notifications** | id (PK), user_id, type, message, status, timestamp                                                                                                           |

---

## 16. 🧰 Project Management & Tooling

| Tool              | Purpose                                   |
| ----------------- | ----------------------------------------- |
| **Google Stitch** | UI design + HTML/CSS generation.          |
| **Fathom**        | Meeting recordings / feedback tracking.   |
| **Toggle**        | Time tracking.                            |
| **Notion**        | Task management / documentation.          |
| **GitHub**        | Code versioning (Privy starter kit base). |

---

## 17. 🧪 Testing & Validation

| Area                      | Strategy                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Privy Wallet Creation** | Validate login + Solana wallet retrieval.                                     |
| **Devnet Simulation**     | Test dev wallet → user wallet transfer; verify Jupiter swap on devnet.        |
| **OnMeta Integration**    | Test widget launch, payment flow, wallet credit (production environment).     |
| **Transaction History**   | Verify batch_id grouping for onramp + swap pairs.                             |
| **UX Flow**               | Validate New/Existing user paths via Google Stitch prototypes.                |
| **2FA**                   | Test PIN + biometric flows on desktop and mobile.                             |
| **Pause/Withdrawal**      | Verify cool-off period logic.                                                 |

---

## 18. 🧭 Roadmap (Updated)

| Phase | Deliverable                                   | Timeline |
| ----- | --------------------------------------------- | -------- |
| 1     | Privy + 2FA integration (JavaScript)          | Week 1–2 |
| 2     | Goal setup + NeonDB backend (JavaScript)      | Week 3–4 |
| 3     | Devnet simulation (transfer + swap + history) | Week 5   |
| 4     | Dashboard + graphs + transaction UI           | Week 6–7 |
| 5     | OnMeta widget integration (production)        | Week 8   |
| 6     | Testing + UI via Google Stitch + Beta launch  | Week 9   |

---

## 19. 📎 References

* [Privy SDK Docs](https://docs.privy.io/)
* [Solana Developer Docs](https://docs.solana.com/)
* [Jupiter DEX API](https://station.jup.ag/docs/)
* [OnMeta OnRamp](https://www.onmeta.in/)
* [NeonDB (PostgreSQL)](https://neon.tech/)
* [Google Stitch AI Designer](https://stitch.google.com/)

---

## 20. ✅ Deliverables Checklist

| Deliverable                         | Description                                                   | Owner         |
| ----------------------------------- | ------------------------------------------------------------- | ------------- |
| **Spec Sheet v2.1**                 | Updated with manual OnRamp + devnet simulation (JavaScript).  | Blessan       |
| **User Flow Doc + Flowchart**       | Visual journey including OnMeta widget + swap flow.           | Blessan       |
| **Devnet Simulation**               | Backend transfer + Jupiter swap + batch history tracking.     | Blessan       |
| **OnMeta Integration (Production)** | Widget launch + auto-swap pipeline.                           | Blessan       |
| **Google Stitch UI Screens**        | Generate HTML/CSS from spec + flows.                          | Blessan       |
| **Privy Wallet Integration**        | Gmail login → Solana wallet retrieval (JavaScript).           | Blessan       |

---

## 21. 🧾 Summary

The **Wholecoiner Goal Tracker v2.1** brings:

* **Manual OnRamp via OnMeta** (no auto-debits; KYC handled externally)
* **Devnet simulation** for testing (transfer SOL + swap via Jupiter)
* **Auto-swap SOL/USDC → goal token** using Jupiter DEX
* **Batch transaction tracking** (onramp + swap paired by `batch_id`)
* **JavaScript stack** (Next.js + Express)
* **Privy auth + Solana wallet** integration
* **2FA security**
* **Dual homepages + cumulative graphs**
* **Behavioral discipline logic**
* **NeonDB (PostgreSQL Cloud)**

It transforms the MVP into a **production-ready, manual-payment-based, devnet-testable microapp specification**.

