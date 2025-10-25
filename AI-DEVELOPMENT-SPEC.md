# Wholecoiner Goal Tracker - AI Development Specification

## Project Context & Mission

You are building a **crypto goal-based investment microapp** called **Wholecoiner Goal Tracker**. The app helps Indian users systematically accumulate one full cryptocurrency unit (1 BTC, 1 ETH, or 1 SOL) through recurring INR-based micro-investments using a SIP/DCA strategy.

**Core Philosophy:** Make crypto ownership accessible through disciplined, goal-oriented investing with strong behavioral design to encourage completion.

---

## Technology Stack - MANDATORY

### Frontend
- **Framework:** Next.js 14+ (React, TypeScript)
- **Styling:** Tailwind CSS
- **State Management:** React Context API or Zustand
- **Charts:** Recharts or Chart.js for progress visualization
- **Deployment:** Vercel

### Backend
- **Runtime:** Node.js with Express
- **API Style:** RESTful
- **Database:** NeonDB (PostgreSQL cloud)
- **ORM:** Prisma (recommended) or direct SQL

### Authentication & Wallet
- **Auth Provider:** Privy SDK (privy.io)
- **Login Method:** Gmail OAuth (passwordless)
- **Wallet Generation:** Automatic Solana wallet creation via Privy
- **2FA:** WebAuthn API for biometric or custom PIN implementation

### Blockchain
- **Network:** Solana mainnet
- **DEX Integration:** Jupiter Aggregator API for token swaps
- **Wallet:** Solana wallets generated and managed by Privy

### Security
- **2FA Methods:** PIN (6-digit) OR Biometric (WebAuthn)
- **Encryption:** TLS in transit, encryption at rest in NeonDB
- **Session Management:** JWT tokens via Privy

---

## Core Features - Detailed Requirements

### 1. Authentication & Wallet Setup

#### Flow:
1. User lands on landing page
2. Click "Continue with Gmail"
3. Privy SDK handles OAuth flow
4. On successful login, Privy automatically generates a Solana wallet
5. Retrieve and store wallet address in database
6. Redirect to 2FA setup

#### Implementation Details:
- Use `@privy-io/react-auth` package
- Initialize Privy with app ID and configuration
- Store user session in HTTP-only cookies
- Wallet address must be retrievable via Privy SDK methods
- Handle wallet creation loop bug (check if wallet already exists before creating)

#### Database Entry Created:
```
Users table: privy_id, email, wallet_address, 2fa_enabled, created_at
```

---

### 2. Two-Factor Authentication (2FA)

#### Requirements:
- **Mandatory** after first login
- Two options: PIN or Biometric
- Must verify before accessing dashboard
- Store 2FA preference and verification status in database

#### PIN Flow:
1. User chooses "Set up PIN"
2. Enter 6-digit numeric PIN
3. Re-enter to confirm
4. Hash and store PIN (use bcrypt or similar)
5. On subsequent logins, prompt for PIN before dashboard access

#### Biometric Flow:
1. User chooses "Use Biometric"
2. Trigger WebAuthn registration
3. Device prompts for fingerprint/face ID
4. Store credential ID in database
5. On subsequent logins, verify via WebAuthn challenge

#### Database Fields:
```
Users table additions: 
- 2fa_method: 'pin' | 'biometric' | null
- 2fa_secret: encrypted hash
- 2fa_enabled: boolean
- webauthn_credential_id: string (if biometric)
```

---

### 3. Goal Creation Wizard

#### Screen Sequence:
**Screen 1: Welcome (New Users Only)**
- Heading: "Start Your Wholecoin Journey"
- Subtext: "Set your goal and we'll help you get there"
- Button: "Create My First Goal"

**Screen 2: Select Cryptocurrency**
- Options: BTC, ETH, SOL (radio buttons or cards)
- Show current market price in INR below each option
- Selected state should be visually distinct

**Screen 3: Set Target Amount**
- Default: 1 (pre-filled)
- Editable input field
- Min: 0.01, Max: 100
- Calculate estimated INR value based on current price

**Screen 4: Investment Frequency**
- Options: Daily, Weekly, Monthly (radio buttons)
- Explain each option with examples

**Screen 5: Monthly Investment Amount**
- Input field for INR amount
- Validation: Minimum ₹100
- Show calculation: "At ₹X per [frequency], you'll reach your goal in approximately Y months"
- Use current crypto price for estimation

**Screen 6: Review & Confirm**
- Display summary:
  - Cryptocurrency: [BTC/ETH/SOL]
  - Target: [X] coins
  - Frequency: [Daily/Weekly/Monthly]
  - Amount: ₹[X] per interval
  - Estimated completion: [Y] months
- Buttons: "Go Back" (to edit) | "Confirm Plan"

#### Backend Processing:
- POST to `/api/goals`
- Calculate estimated completion date based on current price
- Store goal with status: "active"
- Generate first payment schedule

#### Validation Rules:
- Amount must be ≥ ₹100 per interval
- Target amount must be > 0
- Maximum goal duration: 10 years (calculate and warn if exceeded)

#### Database Entry:
```
Goals table:
- id (UUID)
- user_id (FK to Users)
- coin: 'BTC' | 'ETH' | 'SOL'
- target_amount (decimal, e.g., 1.0)
- invested_amount (decimal, default 0)
- frequency: 'daily' | 'weekly' | 'monthly'
- amount_inr (decimal)
- status: 'active' | 'paused' | 'completed'
- created_at
- estimated_completion_date
```

---

### 4. Payment & Investment Execution

#### Initial Payment Setup:
1. After goal confirmation, redirect to payment setup
2. Display payment options:
   - UPI (one-time authorization)
   - Auto-mandate (RBI-compliant e-mandate for recurring)
3. Integrate payment gateway (Razorpay or similar)
4. Execute first investment immediately upon confirmation

#### Recurring Investment Logic:
- **Scheduler:** Use cron job or scheduled task (node-cron)
- **Frequency handling:**
  - Daily: Execute at 10 AM IST every day
  - Weekly: Execute every Monday 10 AM IST
  - Monthly: Execute on 1st of month 10 AM IST
- **Process:**
  1. Check all active goals with due investments
  2. For each goal, call payment gateway API
  3. If payment successful, call Jupiter API to swap INR→Crypto
  4. Record transaction in database
  5. Update goal's `invested_amount`
  6. Send notification to user

#### Manual Trigger Option:
- Dashboard should have "Invest Now" button
- Allows user to make additional investment outside schedule
- Add to existing schedule, don't replace

#### Investment Execution API Flow:
```
POST /api/investments/execute
Body: { goalId, amountINR }

1. Verify user authentication
2. Check goal is active
3. Process payment via gateway
4. If successful:
   - Call Jupiter API for swap quote
   - Execute swap transaction on Solana
   - Store transaction hash
5. Update goal progress
6. Create transaction record
7. Check if goal completed (invested_amount >= target_amount)
8. If completed, trigger completion flow
9. Return success/failure response
```

#### Database Entry:
```
Transactions table:
- id (UUID)
- goal_id (FK to Goals)
- txn_hash (Solana transaction signature)
- amount_inr (decimal)
- amount_crypto (decimal)
- crypto_price_at_purchase (decimal)
- timestamp
- status: 'pending' | 'completed' | 'failed'
```

---

### 5. Dashboard (Existing User Homepage)

#### Layout Components:

**Top Section: Progress Card**
- Circular progress tracker showing percentage to goal
- Center text: "[X]% Complete" and "[amount] / [target] [COIN]"
- Color gradient based on progress (0-25% red→orange, 25-75% orange→yellow, 75-100% yellow→green)

**Middle Section: Cumulative Graph**
- Line chart with dual Y-axes:
  - Left axis: Total INR invested (actual)
  - Right axis: Current crypto value in INR
- X-axis: Timeline (months)
- Two lines:
  - Blue line: Cumulative INR invested
  - Green line: Current portfolio value
- Show profit/loss delta at top right

**Stats Row:**
- Card 1: Total Invested (₹X)
- Card 2: Current Value (₹Y)
- Card 3: Total Crypto ([amount] [COIN])
- Card 4: Estimated Completion ([date])

**Quick Actions Row:**
- Button: "Add Funds" (manual investment)
- Button: "Pause Plan" (triggers behavioral lock flow)
- Button: "View All Transactions"

**Recent Transactions List:**
- Last 5 transactions
- Each row: Date | Amount (INR) | Crypto Purchased | Price | Status
- Link: "View All History"

#### Data Fetching:
```
On dashboard load, call these APIs in parallel:
1. GET /api/goals - fetch active goals
2. GET /api/progress/:goalId - get progress details
3. GET /api/history?limit=5 - get recent transactions
4. GET /api/price/current?coins=BTC,ETH,SOL - get current prices
```

#### Conditional States:
- **No Active Goal:** Show "Create New Goal" CTA
- **Goal Paused:** Show banner "Your goal is paused" with "Resume" button
- **Multiple Goals:** Show tabs or cards for each goal

---

### 6. Goal Progress Visualization Details

#### Circular Progress Ring:
- SVG-based circular progress bar
- Outer ring: Full circle (gray background)
- Inner ring: Colored arc representing progress
- Animate on load (0% → current% over 1 second)
- Center content:
  - Percentage (large font)
  - Fraction: "[current] / [target] [COIN]"
  - Small crypto logo

#### Milestone Markers:
- Visual indicators at 25%, 50%, 75%, 100%
- Each milestone shows a star/badge icon
- Completed milestones: colored
- Pending milestones: gray
- On reaching milestone, show celebratory modal

#### Timeline Estimate:
- Calculate based on:
  - Remaining amount needed
  - Investment frequency and amount
  - Current average crypto price (7-day MA)
- Display: "Estimated completion: [Month Year]"
- Update weekly based on price fluctuations

#### Progress API Response Format:
```json
{
  "goalId": "uuid",
  "coin": "BTC",
  "targetAmount": 1.0,
  "investedAmount": 0.25,
  "progressPercentage": 25.0,
  "totalInvestedINR": 125000,
  "currentValueINR": 132000,
  "profitLoss": 7000,
  "profitLossPercentage": 5.6,
  "estimatedCompletionDate": "2026-08-15",
  "nextInvestmentDate": "2025-11-01",
  "milestones": [
    { "percentage": 25, "reached": true, "date": "2025-08-01" },
    { "percentage": 50, "reached": false, "date": null },
    { "percentage": 75, "reached": false, "date": null },
    { "percentage": 100, "reached": false, "date": null }
  ]
}
```

---

### 7. Transaction History

#### Screen Layout:
- Title: "Investment History"
- Filter options:
  - Date range picker
  - Coin filter (All | BTC | ETH | SOL)
  - Status filter (All | Completed | Failed)
- Table columns:
  - Date & Time
  - Amount Invested (INR)
  - Crypto Purchased
  - Price per unit
  - Transaction Hash (copyable, links to Solana explorer)
  - Status badge

#### Features:
- Pagination (20 items per page)
- Sort by date (newest first, default)
- Export as CSV button
- Search by transaction hash

#### API:
```
GET /api/history
Query params: 
  - goalId (optional)
  - startDate (optional)
  - endDate (optional)
  - coin (optional)
  - status (optional)
  - page (default: 1)
  - limit (default: 20)

Response:
{
  "transactions": [...],
  "total": 156,
  "page": 1,
  "totalPages": 8
}
```

---

### 8. Behavioral Lock Mechanism (Pause/Stop Flow)

**Objective:** Create friction to discourage impulsive goal abandonment while allowing legitimate pauses.

#### Pause Flow:

**Step 1: User clicks "Pause Plan"**
- Show modal with motivational message:
  - Title: "Hold on! You're [X]% there"
  - Message: "Pausing now means delaying your Wholecoin dream. Are you sure?"
  - Stats: "You've invested ₹[X] over [Y] months. Don't lose momentum!"
  - Buttons: "Continue Investing" (primary) | "I Still Want to Pause" (secondary, gray)

**Step 2: Confirmation Required**
- If user clicks "I Still Want to Pause":
  - Show second confirmation:
  - Title: "3-Day Cool-off Period"
  - Message: "Your plan will pause in 3 days. You can cancel anytime before then."
  - Checkbox: "I understand my goal will be paused"
  - Buttons: "Cancel" | "Confirm Pause"

**Step 3: Cool-off Period**
- Store pause request in database with timestamp
- Show banner on dashboard: "Your pause will activate in [X] days. [Cancel Pause]"
- Continue scheduled investments during cool-off
- Send daily email: "Are you sure you want to pause? [Cancel Pause Link]"

**Step 4: Pause Activated**
- After 3 days, automatically set goal status to "paused"
- Stop all scheduled investments
- Send confirmation email
- Dashboard shows "Paused" badge and "Resume Plan" button

#### Resume Flow:
- Click "Resume Plan" button
- Immediate reactivation (no waiting period)
- Next investment scheduled based on original frequency
- Send confirmation notification

#### Backend Logic:
```
Table: PauseRequests
- id
- goal_id
- requested_at
- activated_at (null until cool-off expires)
- cancelled_at (if user cancels)
- status: 'pending' | 'active' | 'cancelled'

Cron job (runs daily):
- Check for pause requests older than 3 days
- If found, update goal status to 'paused'
- Send notification
```

#### Stop (Permanent) vs Pause:
- Pause: Temporary, can resume anytime, funds remain invested
- Stop: Not allowed until goal completion
- User can only delete goal after completion
- Early withdrawal: Not implemented in v1 (behavioral lock)

---

### 9. Goal Completion Flow

#### Trigger Condition:
- When `invested_amount >= target_amount` (checked after each investment)

#### Completion Sequence:

**Step 1: Automatic Detection**
- After successful investment, backend checks if goal reached
- If yes, update goal status to "completed"
- Trigger completion workflow

**Step 2: Celebration Screen**
- Full-screen modal overlay
- Animation: Confetti falling effect
- Badge: "🎉 You're Now a Wholecoiner!"
- Stats display:
  - "You accumulated [X] [COIN]"
  - "Total invested: ₹[Y]"
  - "Journey duration: [Z] months"
  - "Current value: ₹[W]"
- Share buttons: Twitter, WhatsApp (with pre-filled text)

**Step 3: Funds Released**
- All crypto automatically available in user's Privy wallet
- No lock, no withdrawal process needed
- Show wallet address and balance
- Provide link to view on Solana explorer

**Step 4: Next Steps**
- Modal bottom section:
  - Primary button: "Start New Goal"
  - Secondary button: "View My Dashboard"
  - Link: "Share Your Achievement"

**Step 5: Badge/Certificate (Optional v2 feature)**
- Generate unique completion NFT
- Mint on Solana as proof of achievement
- Display in profile

#### Notifications:
- Email: Congratulations with summary
- In-app: Persistent notification until acknowledged
- Optional: SMS if phone number provided

---

### 10. Notifications System

#### Notification Types:

**Investment Executed:**
- Trigger: After successful investment
- Channel: In-app + Email
- Message: "₹[X] invested successfully. You purchased [Y] [COIN]."

**Milestone Reached:**
- Trigger: 25%, 50%, 75% progress
- Channel: In-app + Email
- Message: "Congratulations! You're [X]% towards your Wholecoin goal!"

**Goal Completed:**
- Trigger: 100% progress
- Channel: In-app + Email + Push (if enabled)
- Message: "🎉 You did it! You're now a Wholecoiner!"

**Investment Reminder:**
- Trigger: 1 day before scheduled investment
- Channel: Email
- Message: "Your next investment of ₹[X] is scheduled for tomorrow"

**Pause Warning:**
- Trigger: Daily during cool-off period
- Channel: Email
- Message: "You have [X] days to cancel your pause request"

**Investment Failed:**
- Trigger: Payment failure
- Channel: In-app + Email + SMS
- Message: "Your investment failed. Please update payment method."

#### Implementation:
- Store notifications in database
- Mark as read/unread
- Settings page to toggle notification preferences
- Use email service (SendGrid or similar)
- For in-app: WebSocket or polling

#### Database:
```
Notifications table:
- id
- user_id
- type: 'investment' | 'milestone' | 'completion' | 'reminder' | 'warning' | 'error'
- message
- status: 'unread' | 'read'
- created_at
- metadata (JSON for additional data)
```

---

### 11. Settings & Account Management

#### Settings Page Sections:

**Profile:**
- Email (read-only from Privy)
- Wallet address (copyable, read-only)

**Security:**
- Current 2FA method (PIN or Biometric)
- Button: "Change 2FA Method"
- Button: "Reset PIN" (if using PIN)

**Notifications:**
- Toggle: Email notifications (on/off)
- Toggle: Investment reminders (on/off)
- Toggle: Milestone alerts (on/off)

**Payment Methods:**
- Linked payment method display
- Button: "Update Payment Method"
- Auto-mandate status: Active/Inactive

**Goals:**
- List of all goals (active, paused, completed)
- For each: View details link

**Account Actions:**
- Button: "Export My Data" (GDPR compliance)
- Link: "Delete Account" (requires confirmation)

**Logout:**
- Button: "Sign Out"
- Clears session, redirects to landing page

#### APIs:
```
GET /api/user - Get user profile
PATCH /api/user - Update user settings
PATCH /api/auth/2fa/update - Change 2FA settings
POST /api/auth/logout - End session
GET /api/export - Export user data as JSON
DELETE /api/user - Delete account
```

---

### 12. Homepage Variants (New vs Existing Users)

#### New User Landing (First Visit After Signup + 2FA):
- Screen: Welcome message
- Heading: "Welcome to Wholecoiner!"
- Subtext: "Let's set up your first goal"
- Illustration: Crypto coin stack
- Button: "Create My First Goal" → Goes to Goal Wizard

#### Existing User Landing (Returning Users):
- Screen: Dashboard (described in section 5)
- Auto-load active goals
- Show progress immediately
- Quick access to all features

#### Detection Logic:
```javascript
// In frontend routing or middleware
if (userHasActiveGoals) {
  redirect('/dashboard');
} else {
  redirect('/welcome');
}
```

---

### 13. Database Schema (Complete)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  2fa_enabled BOOLEAN DEFAULT false,
  2fa_method VARCHAR(20), -- 'pin' | 'biometric'
  2fa_secret TEXT, -- encrypted
  webauthn_credential_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Goals Table
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL, -- 'BTC' | 'ETH' | 'SOL'
  target_amount DECIMAL(18, 8) NOT NULL,
  invested_amount DECIMAL(18, 8) DEFAULT 0,
  frequency VARCHAR(20) NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  amount_inr DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'paused' | 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  estimated_completion_date DATE,
  completed_at TIMESTAMP
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  txn_hash VARCHAR(255) UNIQUE, -- Solana signature
  amount_inr DECIMAL(12, 2) NOT NULL,
  amount_crypto DECIMAL(18, 8) NOT NULL,
  crypto_price_at_purchase DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread', -- 'unread' | 'read'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Pause Requests Table
```sql
CREATE TABLE pause_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' -- 'pending' | 'active' | 'cancelled'
);
```

#### Indexes (for performance):
```sql
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
```

---

### 14. API Specifications (Complete Reference)

#### Authentication APIs

**POST /api/auth/login**
- Purpose: Initiate Privy login, create session
- Request: `{ privyToken: string }`
- Response: `{ success: true, userId: string, walletAddress: string, requires2FA: boolean }`

**POST /api/auth/2fa/setup**
- Purpose: Set up 2FA for first time
- Request: `{ method: 'pin' | 'biometric', pin?: string, credentialId?: string }`
- Response: `{ success: true }`

**POST /api/auth/2fa/verify**
- Purpose: Verify 2FA on login
- Request: `{ method: 'pin' | 'biometric', pin?: string, challenge?: string }`
- Response: `{ success: true, sessionToken: string }`

**PATCH /api/auth/2fa/update**
- Purpose: Change 2FA method
- Request: `{ newMethod: 'pin' | 'biometric', pin?: string, credentialId?: string }`
- Response: `{ success: true }`

**POST /api/auth/logout**
- Purpose: Clear session
- Request: `{}`
- Response: `{ success: true }`

#### Goals APIs

**POST /api/goals**
- Purpose: Create new goal
- Request:
```json
{
  "coin": "BTC",
  "targetAmount": 1.0,
  "frequency": "monthly",
  "amountINR": 5000
}
```
- Response:
```json
{
  "goalId": "uuid",
  "estimatedCompletionDate": "2026-08-15",
  "firstInvestmentDate": "2025-11-01"
}
```

**GET /api/goals**
- Purpose: List all user's goals
- Query: `?status=active` (optional filter)
- Response:
```json
{
  "goals": [
    {
      "id": "uuid",
      "coin": "BTC",
      "targetAmount": 1.0,
      "investedAmount": 0.25,
      "progressPercentage": 25,
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**GET /api/goals/:id**
- Purpose: Get single goal details
- Response: (same as single goal object above + additional stats)

**PATCH /api/goals/:id**
- Purpose: Update goal settings
- Request: `{ amountINR?: number, frequency?: string }`
- Response: `{ success: true }`

**PATCH /api/goals/:id/pause**
- Purpose: Request pause (initiates cool-off)
- Request: `{}`
- Response: `{ success: true, pauseActivatesAt: "2025-11-05T00:00:00Z" }`

**PATCH /api/goals/:id/resume**
- Purpose: Resume paused goal
- Request: `{}`
- Response: `{ success: true, nextInvestmentDate: "2025-11-15T00:00:00Z" }`

#### Investment APIs

**POST /api/investments/execute**
- Purpose: Execute manual or scheduled investment
- Request:
```json
{
  "goalId": "uuid",
  "amountINR": 5000
}
```
- Response:
```json
{
  "transactionId": "uuid",
  "txnHash": "solana-signature",
  "amountCrypto": 0.0012,
  "pricePerUnit": 4166666.67,
  "status": "completed"
}
```

**GET /api/investments/upcoming**
- Purpose: Get scheduled investments
- Response:
```json
{
  "investments": [
    {
      "goalId": "uuid",
      "coin": "BTC",
      "amountINR": 5000,
      "scheduledDate": "2025-12-01T10:00:00Z"
    }
  ]
}
```

#### Progress & History APIs

**GET /api/progress/:goalId**
- Purpose: Get detailed progress for a goal
- Response: (see section 6 for complete format)

**GET /api/history**
- Purpose: Get transaction history
- Query params: `goalId, startDate, endDate, coin, status, page, limit`
- Response:
```json
{
  "transactions": [...],
  "total": 156,
  "page": 1,
  "totalPages": 8
}
```

**GET /api/history/export**
- Purpose: Export transactions as CSV
- Query: `?goalId=uuid` (optional)
- Response: CSV file download

#### Price APIs

**GET /api/price/current**
- Purpose: Get current crypto prices
- Query: `?coins=BTC,ETH,SOL`
- Response:
```json
{
  "prices": {
    "BTC": 5234567.89,
    "ETH": 234567.89,
    "SOL": 12345.67
  },
  "timestamp": "2025-10-22T10:00:00Z"
}
```

**GET /api/price/historical**
- Purpose: Get historical prices for charts
- Query: `?coin=BTC&range=30d`
- Response:
```json
{
  "data": [
    { "date": "2025-10-01", "price": 5100000 },
    { "date": "2025-10-02", "price": 5150000 }
  ]
}
```

#### Notifications APIs

**GET /api/notifications**
- Purpose: Get user notifications
- Query: `?status=unread&limit=20`
- Response:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "milestone",
      "message": "You've reached 50% of your goal!",
      "status": "unread",
      "createdAt": "2025-10-22T10:00:00Z"
    }
  ]
}
```

**PATCH /api/notifications/:id/read**
- Purpose: Mark notification as read
- Response: `{ success: true }`

**PUT /api/notifications/settings**
- Purpose: Update notification preferences
- Request:
```json
{
  "emailEnabled": true,
  "reminderEnabled": true,
  "milestoneEnabled": true
}
```
- Response: `{ success: true }`

#### User APIs

**GET /api/user**
- Purpose: Get user profile and settings
- Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "walletAddress": "solana-address",
  "2faEnabled": true,
  "2faMethod": "pin",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**PATCH /api/user**
- Purpose: Update user settings
- Request: `{ notificationPreferences: {...} }`
- Response: `{ success: true }`

**GET /api/user/export**
- Purpose: Export all user data (GDPR)
- Response: JSON file with all user data

**DELETE /api/user**
- Purpose: Delete account
- Request: `{ confirmation: "DELETE MY ACCOUNT" }`
- Response: `{ success: true }`

---

### 15. UI/UX Design Requirements

#### Design System

**Color Palette:**
- Primary: Bitcoin Orange (#F7931A) for CTAs
- Secondary: Ethereum Purple (#627EEA) for accents
- Success: Green (#10B981)
- Warning: Yellow (#FBBF24)
- Error: Red (#EF4444)
- Neutral: Gray scale (#F9FAFB to #111827)
- Background: White (#FFFFFF)
- Text: Dark Gray (#1F2937)

**Typography:**
- Headings: Inter or SF Pro Display (bold, 600-700 weight)
- Body: Inter or SF Pro Text (regular, 400 weight)
- Code/Numbers: JetBrains Mono or SF Mono

**Spacing:**
- Use 8px base unit
- Padding: 16px, 24px, 32px
- Margins: 8px, 16px, 24px

**Components:**
- Buttons: Rounded corners (8px), hover states, disabled states
- Cards: White background, subtle shadow, rounded corners (12px)
- Inputs: Border gray, focus state (blue outline), error state (red)
- Modals: Overlay (50% black), centered card, close button

#### Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Stack circular progress above graph (not side-by-side)
- Single column layout for stats cards
- Bottom navigation for quick actions
- Collapsible transaction list

**Desktop Features:**
- Sidebar navigation
- Multi-column dashboard
- Larger chart display
- Hover tooltips on graph

#### Accessibility

**Requirements:**
- WCAG 2.1 AA compliance
- Minimum contrast ratio 4.5:1 for text
- Keyboard navigation support
- Screen reader friendly (ARIA labels)
- Focus indicators on all interactive elements
- Alt text for all images
- Form validation with clear error messages

#### Loading States

- Skeleton loaders for charts and cards
- Spinner for button actions
- Progress bar for multi-step flows
- Optimistic UI updates (show before API confirms)

#### Error States

- Inline errors for form fields
- Toast notifications for API errors
- Empty states with CTAs when no data
- 404 page with navigation back
- Network error page with retry button

#### Animations

- Page transitions: Fade in (300ms)
- Button clicks: Scale down slightly on press
- Progress ring: Animate from 0 to current value on load
- Confetti: On goal completion (library: canvas-confetti)
- Modal entry: Slide up from bottom (mobile) or fade in (desktop)

---

### 16. Third-Party Integrations

#### Privy SDK
- Package: `@privy-io/react-auth`
- Setup: Configure with app ID from Privy dashboard
- Features: OAuth login, wallet generation, session management
- Documentation: https://docs.privy.io/

#### Jupiter Aggregator (Solana DEX)
- API: Jupiter Swap API v6
- Endpoint: `https://quote-api.jup.ag/v6`
- Features: Get swap quotes, execute swaps
- Process:
  1. Get quote for INR→Crypto swap
  2. Execute swap transaction
  3. Return transaction signature
- Documentation: https://station.jup.ag/docs/

#### Payment Gateway (Razorpay recommended)
- Package: `razorpay` (Node.js SDK)
- Features: UPI, cards, net banking, auto-debit
- Setup: API key and secret from Razorpay dashboard
- Use cases: One-time payments, recurring subscriptions
- Webhooks: Listen for payment success/failure events

#### NeonDB (PostgreSQL)
- Connection: Use connection string from Neon dashboard
- ORM: Prisma recommended
- Features: Serverless Postgres, auto-scaling
- Connection pooling: Use PgBouncer or Prisma connection pool

#### Email Service (SendGrid or Resend)
- Package: `@sendgrid/mail` or `resend`
- Features: Transactional emails, templates
- Templates needed:
  - Welcome email
  - Investment confirmation
  - Milestone celebration
  - Goal completion
  - Pause warning

#### Price Data
- Source: CoinGecko API (free tier) or Jupiter API
- Endpoint: `/api/v3/simple/price` (CoinGecko)
- Frequency: Update every 5 minutes, cache in backend
- Fallback: Store last known price if API fails

---

### 17. Security Implementation Details

#### Session Management
- Use HTTP-only cookies for session tokens
- Implement CSRF protection
- Set secure cookie flags (Secure, SameSite)
- Session expiry: 7 days, refresh on activity
- Logout clears all cookies and sessions

#### API Security
- All endpoints (except /login) require authentication
- Validate JWT tokens on each request
- Rate limiting: 100 requests/minute per user
- Input validation on all POST/PATCH requests
- SQL injection prevention via parameterized queries

#### Data Encryption
- 2FA PIN: Hash with bcrypt (10 rounds)
- Sensitive data at rest: NeonDB encryption
- TLS 1.3 for all API communication
- Wallet private keys: Managed by Privy (not stored in app DB)

#### 2FA Implementation
**PIN Method:**
```javascript
// Setup
const hashedPIN = await bcrypt.hash(userPIN, 10);
await db.users.update({ 2fa_secret: hashedPIN });

// Verification
const isValid = await bcrypt.compare(inputPIN, storedHash);
```

**Biometric (WebAuthn):**
```javascript
// Registration
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: randomChallenge,
    rp: { name: "Wholecoiner" },
    user: { id: userId, name: email, displayName: email },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }]
  }
});
// Store credential.id in database

// Authentication
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: randomChallenge,
    allowCredentials: [{ type: "public-key", id: storedCredentialId }]
  }
});
// Verify signature on backend
```

#### Environment Variables
```env
# Privy
PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-secret

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Payment
RAZORPAY_KEY_ID=your-key
RAZORPAY_SECRET=your-secret

# Email
SENDGRID_API_KEY=your-key

# JWT
JWT_SECRET=your-secret-key

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

### 18. Business Logic & Rules

#### Investment Validation
- **Minimum per transaction:** ₹100
- **Maximum per transaction:** ₹1,00,000 (1 lakh)
- **Maximum goal duration:** 10 years
- **Minimum goal duration:** 1 month

#### Goal Status Transitions
- `null` → `active` (on goal creation)
- `active` → `paused` (after cool-off period)
- `paused` → `active` (on resume)
- `active` → `completed` (when invested_amount >= target_amount)
- Completed goals cannot be reopened

#### DCA Pricing Logic
- Each investment uses **market price at execution time**
- No price averaging across purchases (true DCA)
- Price slippage tolerance: 1% (Jupiter API parameter)
- If slippage exceeds tolerance, retry or notify user

#### Pause/Resume Rules
- Cool-off period: **3 days** (72 hours)
- User can cancel pause request during cool-off
- Maximum pauses per goal: Unlimited
- Scheduled investments continue during cool-off
- Resume is immediate (no waiting period)

#### Completion Rules
- Goal auto-completes when invested ≥ target
- Funds immediately available in wallet
- No withdrawal fees
- User gets completion notification
- Goal moved to "Completed" section

#### Multi-Goal Support
- Users can have **multiple active goals** simultaneously
- Each goal operates independently
- Separate investment schedules
- Separate progress tracking

---

### 19. Cron Jobs & Scheduled Tasks

#### Daily Investment Executor
```javascript
// Runs every day at 10:00 AM IST
cron.schedule('0 10 * * *', async () => {
  const activeGoals = await getActiveGoalsWithDailyFrequency();
  for (const goal of activeGoals) {
    await executeInvestment(goal);
  }
});
```

#### Weekly Investment Executor
```javascript
// Runs every Monday at 10:00 AM IST
cron.schedule('0 10 * * 1', async () => {
  const activeGoals = await getActiveGoalsWithWeeklyFrequency();
  for (const goal of activeGoals) {
    await executeInvestment(goal);
  }
});
```

#### Monthly Investment Executor
```javascript
// Runs on 1st of every month at 10:00 AM IST
cron.schedule('0 10 1 * *', async () => {
  const activeGoals = await getActiveGoalsWithMonthlyFrequency();
  for (const goal of activeGoals) {
    await executeInvestment(goal);
  }
});
```

#### Pause Request Processor
```javascript
// Runs daily at midnight to check cool-off expiry
cron.schedule('0 0 * * *', async () => {
  const expiredRequests = await getPauseRequestsOlderThan3Days();
  for (const request of expiredRequests) {
    await activatePause(request.goalId);
    await sendPauseConfirmationEmail(request.userId);
  }
});
```

#### Price Update Job
```javascript
// Runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const prices = await fetchCurrentPrices(['BTC', 'ETH', 'SOL']);
  await cachePrices(prices);
});
```

#### Milestone Checker
```javascript
// Runs after each investment execution
async function checkMilestones(goalId) {
  const goal = await getGoal(goalId);
  const progress = goal.invested_amount / goal.target_amount * 100;
  
  const milestones = [25, 50, 75, 100];
  for (const milestone of milestones) {
    if (progress >= milestone && !goal.milestones[milestone]) {
      await markMilestoneReached(goalId, milestone);
      await sendMilestoneNotification(goal.userId, milestone);
    }
  }
}
```

---

### 20. Error Handling

#### API Error Responses
All API errors should follow this format:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Investment amount must be at least ₹100",
    "field": "amountINR" // optional, for form validation
  }
}
```

#### Error Codes

**Authentication Errors:**
- `AUTH_REQUIRED` - User not authenticated
- `2FA_REQUIRED` - 2FA verification needed
- `INVALID_2FA` - 2FA verification failed
- `SESSION_EXPIRED` - Session token expired

**Goal Errors:**
- `GOAL_NOT_FOUND` - Goal ID doesn't exist
- `GOAL_ALREADY_COMPLETED` - Cannot modify completed goal
- `INVALID_AMOUNT` - Amount below minimum or above maximum
- `INVALID_FREQUENCY` - Frequency not supported

**Investment Errors:**
- `PAYMENT_FAILED` - Payment gateway error
- `INSUFFICIENT_FUNDS` - User doesn't have enough balance
- `SWAP_FAILED` - Jupiter swap execution failed
- `PRICE_SLIPPAGE_EXCEEDED` - Price moved too much

**General Errors:**
- `INTERNAL_ERROR` - Server error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Input validation failed

#### Frontend Error Handling
```javascript
try {
  const response = await api.post('/api/investments/execute', data);
  // Handle success
} catch (error) {
  if (error.code === 'PAYMENT_FAILED') {
    showToast('Payment failed. Please check your payment method.');
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    showModal('Insufficient funds. Please add money to your account.');
  } else {
    showToast('Something went wrong. Please try again.');
  }
}
```

#### Retry Logic
- Network failures: Auto-retry 3 times with exponential backoff
- Payment failures: Notify user, don't auto-retry
- Swap failures: Retry once after 5 seconds
- Database errors: Log and alert team, show generic error to user

---

### 21. Testing Requirements

#### Unit Tests
- Test all API endpoints
- Test utility functions (calculations, validations)
- Test database queries
- Target coverage: 80%+

#### Integration Tests
- Test complete user flows (signup → goal creation → investment)
- Test 2FA setup and verification
- Test pause/resume flows
- Test goal completion

#### E2E Tests
- Test full user journey in browser
- Test responsive design on different devices
- Test form submissions and validations
- Tools: Playwright or Cypress

#### Test Scenarios to Cover

**Authentication:**
- Successful Gmail login
- 2FA setup (PIN and biometric)
- 2FA verification on login
- Session expiry handling

**Goal Creation:**
- Valid goal creation
- Invalid amount rejection
- Frequency selection
- Estimated completion calculation

**Investments:**
- Scheduled investment execution
- Manual investment trigger
- Payment failure handling
- Swap execution and verification

**Progress Tracking:**
- Correct percentage calculation
- Milestone detection
- Graph rendering
- Goal completion trigger

**Pause/Resume:**
- Pause request creation
- Cool-off period countdown
- Pause cancellation
- Resume activation

#### Manual Testing Checklist
- [ ] Gmail login works
- [ ] Wallet is generated and displayed
- [ ] 2FA setup completes
- [ ] Goal wizard saves correctly
- [ ] Dashboard loads with correct data
- [ ] Progress ring animates
- [ ] Graph displays data
- [ ] Transactions list shows history
- [ ] Pause flow works with cool-off
- [ ] Goal completion triggers celebration
- [ ] Notifications appear
- [ ] Settings update correctly
- [ ] Responsive design works on mobile
- [ ] Dark mode works (if implemented)

---

### 22. Deployment & DevOps

#### Deployment Steps

**Frontend (Vercel):**
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
4. Set up custom domain (optional)
5. Enable automatic deployments on push to main

**Backend:**
- Option 1: Deploy with frontend (Next.js API routes)
- Option 2: Separate deployment (Railway, Render, or Heroku)

**Database (NeonDB):**
1. Create project in Neon dashboard
2. Copy connection string
3. Run migrations (Prisma migrate deploy)
4. Set up connection pooling

**Environment Variables:**
- Store in Vercel/deployment platform
- Never commit to Git
- Use different values for dev/staging/production

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test
      - run: npm run build
      - run: vercel deploy --prod
```

#### Monitoring
- Error tracking: Sentry
- Analytics: Mixpanel or PostHog
- Uptime monitoring: UptimeRobot
- Performance: Vercel Analytics

---

### 23. Development Workflow

#### Project Structure
```
wholecoiner-app/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── history/
│   │   └── settings/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── charts/          # Chart components
│   │   ├── auth/            # Auth-related components
│   │   └── goals/           # Goal-related components
│   ├── lib/                 # Utilities and helpers
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth helpers
│   │   ├── calculations.ts  # Business logic
│   │   └── constants.ts     # Constants
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── .env.local               # Environment variables (not committed)
├── package.json
└── README.md
```

#### Development Steps
1. Clone repo
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Initialize database: `npx prisma migrate dev`
5. Run dev server: `npm run dev`
6. Access at http://localhost:3000

#### Git Workflow
- Main branch: `main` (production)
- Feature branches: `feature/goal-creation`, `feature/2fa`
- Commit messages: Conventional commits format
- PR required before merging to main
- Run linter before committing: `npm run lint`

---

### 24. Key Implementation Priorities

#### Phase 1 (Week 1-2): Core Auth & Setup
1. Set up Next.js project with Tailwind
2. Integrate Privy SDK
3. Implement Gmail login
4. Create user database schema
5. Implement 2FA (PIN method first)
6. Create basic routing structure

#### Phase 2 (Week 3-4): Goal Creation & Backend
1. Build goal creation wizard UI
2. Implement goal database schema
3. Create goal creation API
4. Set up NeonDB connection
5. Implement price fetching from CoinGecko
6. Build goal estimation logic

#### Phase 3 (Week 5-6): Dashboard & Progress
1. Build dashboard UI
2. Implement circular progress tracker
3. Create cumulative graph with Recharts
4. Build transaction history view
5. Implement progress calculation API
6. Add milestone detection

#### Phase 4 (Week 7-8): Investments & Notifications
1. Set up payment gateway integration
2. Implement investment execution API
3. Integrate Jupiter for Solana swaps
4. Create cron jobs for scheduled investments
5. Build notification system
6. Implement email service

#### Phase 5 (Week 9): Polish & Launch
1. Implement pause/resume flow with cool-off
2. Build goal completion celebration
3. Add responsive mobile design
4. Implement settings page
5. Testing and bug fixes
6. Deploy to production

---

### 25. Important Considerations

#### Legal & Compliance
- **RBI Guidelines:** Auto-debit requires user mandate approval
- **KYC:** May need to implement KYC verification (consult legal team)
- **Tax:** Crypto investments are taxable in India (inform users)
- **Terms of Service:** Required before user signup
- **Privacy Policy:** GDPR and IT Act compliant

#### UX Best Practices
- Progressive disclosure (don't overwhelm with info)
- Clear CTAs on every screen
- Loading states for all async operations
- Helpful error messages (not just "Error occurred")
- Success confirmations for all actions
- Undo options where possible

#### Performance Optimization
- Image optimization (Next.js Image component)
- Code splitting (automatic with Next.js)
- Lazy loading for charts and heavy components
- Database query optimization (indexes, query limits)
- API response caching (5-minute cache for prices)
- Debounce user inputs

#### Accessibility Checklist
- All buttons have accessible names
- Form fields have labels
- Color is not the only indicator (use icons too)
- Focus visible on keyboard navigation
- Skip to content link for screen readers
- Alt text for images
- ARIA labels for complex components

---

### 26. Future Enhancements (Post-MVP)

**v2 Features:**
- Support for more cryptocurrencies (MATIC, AVAX, etc.)
- Multi-currency support (USD, EUR)
- Goal sharing and social features
- Referral program
- Mobile apps (React Native)
- Portfolio analytics and insights
- Tax reporting tools
- Automated tax calculation
- Goal templates (e.g., "Bitcoin Maximalist", "DeFi Basket")
- Family goals (shared investment pools)

**Advanced Features:**
- Staking integration (earn while accumulating)
- Dollar-cost averaging strategies
- Automatic portfolio rebalancing
- Limit orders (buy when price drops to X)
- WhatsApp notifications
- Voice commands (Alexa/Google Assistant)
- NFT completion badges (on-chain)
- Leaderboards and achievements

---

## 27. Quick Reference - Development Checklist

Use this as your development roadmap:

### Setup Tasks
- [ ] Initialize Next.js project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up Prisma with NeonDB
- [ ] Create database schema
- [ ] Run initial migrations
- [ ] Configure Privy SDK
- [ ] Set up environment variables
- [ ] Create folder structure

### Authentication Implementation
- [ ] Landing page with "Continue with Gmail" button
- [ ] Privy login integration
- [ ] Wallet generation on signup
- [ ] 2FA setup screen (PIN option)
- [ ] 2FA verification on login
- [ ] Protected route middleware
- [ ] Session management
- [ ] Logout functionality

### Goal Creation Implementation
- [ ] Welcome screen for new users
- [ ] Goal wizard step 1: Select crypto
- [ ] Goal wizard step 2: Set target
- [ ] Goal wizard step 3: Choose frequency
- [ ] Goal wizard step 4: Enter amount
- [ ] Goal wizard step 5: Review summary
- [ ] Goal creation API endpoint
- [ ] Goal validation logic
- [ ] Estimated completion calculation

### Dashboard Implementation
- [ ] Dashboard layout
- [ ] Fetch active goals on load
- [ ] Circular progress tracker component
- [ ] Cumulative graph component
- [ ] Stats cards (invested, value, crypto, ETA)
- [ ] Quick action buttons
- [ ] Recent transactions list
- [ ] Empty state (no active goals)

### Investment Implementation
- [ ] Payment gateway integration
- [ ] Investment execution API
- [ ] Jupiter swap integration
- [ ] Transaction recording
- [ ] Goal progress update
- [ ] Scheduled investment cron jobs (daily/weekly/monthly)
- [ ] Manual investment trigger
- [ ] Payment failure handling

### Progress & History Implementation
- [ ] Progress API endpoint
- [ ] Milestone detection logic
- [ ] Transaction history page
- [ ] Transaction filters and search
- [ ] CSV export functionality
- [ ] Progress calculations

### Pause/Resume Implementation
- [ ] Pause button on dashboard
- [ ] Pause confirmation modal with motivation
- [ ] Cool-off period creation
- [ ] Cool-off countdown display
- [ ] Cancel pause functionality
- [ ] Pause activation cron job
- [ ] Resume button and logic

### Goal Completion Implementation
- [ ] Completion detection after investment
- [ ] Celebration screen with confetti
- [ ] Badge display
- [ ] Share functionality
- [ ] Funds release (auto-available in wallet)
- [ ] Completion notification
- [ ] Move to completed section

### Notifications Implementation
- [ ] Notification database schema
- [ ] In-app notification display
- [ ] Email service setup (SendGrid)
- [ ] Email templates (welcome, milestone, completion)
- [ ] Notification preferences in settings
- [ ] Mark as read functionality

### Settings Implementation
- [ ] Settings page layout
- [ ] Profile section (display only)
- [ ] 2FA management (change method, reset PIN)
- [ ] Notification toggles
- [ ] Payment method management
- [ ] Export data functionality
- [ ] Logout button

### UI/UX Polish
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states (skeletons, spinners)
- [ ] Error states (inline, toast, modal)
- [ ] Empty states with CTAs
- [ ] Animations (page transitions, progress ring)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Dark mode (optional)

### Testing
- [ ] Unit tests for utilities
- [ ] API endpoint tests
- [ ] Integration tests for key flows
- [ ] E2E tests (signup, goal creation, investment)
- [ ] Manual testing on different devices
- [ ] Performance testing
- [ ] Security testing

### Deployment
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Set up NeonDB production database
- [ ] Run production migrations
- [ ] Configure custom domain (optional)
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Mixpanel/PostHog)
- [ ] Deploy to production
- [ ] Post-deployment testing

---

## Final Notes for AI Implementation

When building this application:

1. **Start with authentication** - Get Privy working first, as it's the foundation
2. **Build incrementally** - Complete one feature before moving to the next
3. **Test as you go** - Don't wait until the end to test
4. **Use TypeScript** - Type safety will catch many bugs early
5. **Follow the flows** - Refer back to the user flows when implementing features
6. **Keep it simple** - MVP first, enhancements later
7. **Error handling** - Every API call should have proper error handling
8. **Loading states** - Never leave users wondering if something is happening
9. **Validation** - Validate on frontend AND backend
10. **Security first** - Implement 2FA, secure sessions, input validation from the start

**Key Success Metrics:**
- Users can create account in < 2 minutes
- Goal setup completes in < 3 minutes
- Dashboard loads in < 2 seconds
- Zero data loss on investments
- 99.9% uptime for scheduled investments

**Remember:** This is a financial application. Accuracy, security, and reliability are more important than fancy features. Every investment must be tracked correctly, every transaction must be recorded, and user funds must be secure.

Good luck building Wholecoiner! 🚀

