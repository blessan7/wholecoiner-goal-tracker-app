# Day 29 - Next Steps & Testing Guide

## ✅ Current Status

### Completed
- ✅ Wallet key extracted and stored in `.env.local`
- ✅ Wallet address verified: `HAwqsGu4wD8PWPQVNj7zmGWrnAkpRUmXN8rKdMfbQ3r5`
- ✅ Database schema has unique constraint on `(batchId, type)`
- ✅ Onramp endpoint implemented: `POST /api/onramp/simulate`
- ✅ Swap endpoint implemented: `POST /api/swap/execute`
- ✅ All supporting libraries created (`lib/solana.js`, `lib/jupiter.js`, `lib/tokens.js`, `lib/idempotency.js`)

### Pending
- ⏳ Apply database migration (if not applied)
- ⏳ Fund app wallet with devnet SOL (max 5 SOL per airdrop)
- ⏳ Test onramp endpoint
- ⏳ Test swap endpoint
- ⏳ Test idempotency

---

## 🔧 Step 1: Apply Database Migration

```bash
cd wholecoiner-goal-tracker-app
npx prisma migrate deploy
# OR if running locally:
npx prisma migrate dev
```

Verify migration:
```bash
npx prisma db pull  # Should show the unique constraint
```

---

## 💰 Step 2: Fund App Wallet

**Important:** Devnet airdrops are capped at **5 SOL per request**. You tried 10 SOL, which failed.

Run these commands in WSL (where Solana CLI is installed):

```bash
# Fund with 5 SOL (max per request)
solana airdrop 5 HAwqsGu4wD8PWPQVNj7zmGWrnAkpRUmXN8rKdMfbQ3r5 --url devnet

# If you need more, wait a minute and run again
# Devnet faucets usually allow multiple small requests
solana airdrop 5 HAwqsGu4w pouvait7zmGWrnAkpRUmXN8rKdMfbQ3r5 --url devnet

# Verify balance
solana balance HAwqsGu4wD8PWPQVNj7zmGWrnAkpRUmXN8rKdMfbQ3r5 --url devnet
```

**Alternative:** Use a devnet faucet website:
- https://faucet.solana.com/
- https://solfaucet.com/

---

## 🧪 Step 3: Test Endpoints

### Prerequisites
1. App running: `npm run dev` (should be running on port 3001)
2. User logged in with Privy
3. User has a Solana wallet address (Privy-managed)
4. User has 2FA enabled and verified
5. At least one active goal created

### Test 3.1: Onramp Simulation

**Endpoint:** `POST /api/onramp/simulate`

**Request:**
```bash
curl -X POST http://localhost:3001/api/onramp/simulate \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=<your-session-cookie>" \
  -d '{
    "goalId": "<your-goal-id>",
    "amountInr": 5000,
    "batchId": "test-batch-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "batchId": "test-batch-001",
  "transaction": {
    "id": "...",
    "type": "ONRAMP",
    "txnHash": "5PSu...",
    "amountInr": 5000,
    "amountCrypto": 1.0,
    "network": "DEVNET"
  },
  "explorerUrl": "https://explorer.solana.com/tx/..."
}
```

**Check Explorer:**
- Copy `txnHash` and verify on Solana Explorer: `https://explorer.solana.com/tx/<txnHash>?cluster=devnet`

### Test 3.2: Swap Execution (Get Quote)

**Endpoint:** `POST /api/swap/execute`

**Request (Get Quote):**
```bash
curl -X POST http://localhost:3001/api/swap/execute \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=<your-session-cookie>" \
  -d '{
    "goalId": "<your-goal-id>",
    "batchId": "test-batch-001",
    "inputMint": "SOL",
    "outputMint": "USDC",
    "slippageBps": 50
  }'
```

**Expected Response (Unsigned Transaction):**
```json
{
  "success": true,
  "message": "Unsigned transaction generated",
  "unsignedTransaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==",
  "quote": {
    "outAmount": 2000.5,
    "inAmount": 1.0,
    "pricePerUnit": 2000.5
  }
}
```

**Note:** The client must sign this transaction using Privy's wallet adapter, then submit it back.

### Test 3.3: Test Idempotency

**Send the same onramp request twice:**
```bash
# First request
curl -X POST http://localhost:3001/api/onramp/simulate \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=<your-session-cookie>" \
  -d '{"goalId": "<goal-id>", "amountInr": 5000, "batchId": "test-duplicate"}'

# Second request (same batchId)
curl -X POST http://localhost:3001/api/onramp/simulate \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=<your-session-cookie>" \
  -d '{"goalId": "<goal-id>", "amountInr": 5000, "batchId": "test-duplicate"}'
```

**Expected:** Second request should return the same transaction (no duplicate on-chain transfer).

---

## 🔍 Troubleshooting

### Error: "APP_WALLET_PRIVATE_KEY environment variable is not set"
**Fix:** Ensure `.env.local` has the key set:
```env
APP_WALLET_PRIVATE_KEY="kCc7fwSkj3jg9cl/0ePKWjuKB7Y9mIDUVE8dCaLWEGXwRzqPaKzXPNscdOD11CyWATB6KCn3FqZuxmgJV1wX3g=="
```

### Error: "Insufficient balance"
**Fix:** Fund the wallet with devnet SOL (see Step 2).

### Error: "No swap route found"
**Fix:** 
- Ensure you're using valid token pairs: SOL ↔ USDC (devnet liquidity)
- Check that Jupiter API is accessible

### Error: "Transaction timeout"
**Fix:**
- Check network connectivity
- Verify RPC endpoint is working: `curl https://devnet.helius-rpc.com/?api-key=...`
- Increase timeout in code if needed

---

## 📋 Testing Checklist

- [ ] Database migration applied
- [ ] App wallet funded with devnet SOL (at least 5 SOL)
- [ ] User has active goal
- [ ] User has Privy Solana wallet
- [ ] User has 2FA enabled
- [ ] Onramp endpoint returns transaction signature
- [ ] Onramp transaction visible on Solana Explorer
- [ ] Swap endpoint returns unsigned transaction
- [ ] Idempotency prevents duplicate onramp transactions
- [ ] Goal progress updates after swap

---

## 🎯 Next Actions

1. **Fund wallet** (5 SOL airdrop)
2. **Apply migration** (if not done)
3. **Test onramp** endpoint
4. **Test swap** endpoint (quote generation)
5. **Build frontend UI** to handle signing and transaction submission

---

## 📝 Environment Variables Summary

Make sure `.env.local` has:
```env
# Database
DATABASE_URL="postgresql://..."

# Solana Devnet
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=a1c96ec7-818b-4789-ad2c-2bd175df4a95
SOLANA_WS_URL=wss://devnet.helius-rpc.com/?api-key=a1c96ec7-818b-4789-ad2c-2bd175df4a95

# App Wallet
APP_WALLET_PRIVATE_KEY="kCc7fwSkj3jg9cl/0ePKWjuKB7Y9mIDUVE8dCaLWEGXwRzqPaKzXPNscdOD11CyWATB6KCn3FqZuxmgJV1wX3g=="

# Privy
NEXT_PUBLIC_PRIVY_APP_ID="..."
PRIVY_APP_SECRET="..."

# JWT
JWT_SECRET="..."
```

---

**Ready to test!** 🚀

 solicit-running's-solicit-running's-app


