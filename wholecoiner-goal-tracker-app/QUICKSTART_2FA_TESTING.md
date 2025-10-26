# 🚀 Quick Start: Testing 2FA Frontend

## Overview
The 2FA frontend is complete! Here's how to test it immediately.

---

## ✅ What's Ready to Test

### Pages Available:
1. **Setup Page**: `http://localhost:3001/auth/2fa/setup`
2. **Verify Page**: `http://localhost:3001/auth/2fa/verify`
3. **Locked Page**: `http://localhost:3001/auth/2fa/locked?minutes=10`

---

## 🧪 Quick Test Scenarios

### Test 1: PIN Setup UI (No Backend Needed)
```bash
# 1. Make sure server is running
cd wholecoiner-goal-tracker-app
npm run dev

# 2. Open in browser:
http://localhost:3001/auth/2fa/setup
```

**What to test:**
- ✅ Enter 6-digit PIN (e.g., "123456")
- ✅ Progress indicator shows step 1/2
- ✅ Click "Continue"
- ✅ Re-enter PIN for confirmation
- ✅ Progress indicator shows step 2/2
- ✅ Click "Enable 2FA"
- ✅ (Will fail without session, but UI works!)

---

### Test 2: PIN Verify UI
```bash
# Open in browser:
http://localhost:3001/auth/2fa/verify
```

**What to test:**
- ✅ Enter 6-digit PIN
- ✅ Auto-submits on 6th digit
- ✅ Loading spinner shows
- ✅ (Will fail without session, but UI works!)

---

### Test 3: Lockout Screen
```bash
# Open in browser:
http://localhost:3001/auth/2fa/locked?minutes=1
```

**What to test:**
- ✅ Countdown timer displays
- ✅ Warning message shows
- ✅ Timer counts down (MM:SS format)
- ✅ After 1 minute, redirects to verify page

---

## 🎨 Visual Features to Check

### PIN Input Component:
- [ ] Six separate boxes
- [ ] Auto-focus next box on digit entry
- [ ] Auto-focus previous box on backspace
- [ ] Try pasting "123456" - should fill all boxes
- [ ] Arrow keys work for navigation
- [ ] Tab key works

### Setup Component:
- [ ] Show/hide PIN toggle works
- [ ] Progress indicator updates
- [ ] Back button works (step 2)
- [ ] Error messages show for mismatched PINs
- [ ] Security tip is visible

### Verify Component:
- [ ] Attempts counter shows
- [ ] Warning message about 5 attempts
- [ ] "Forgot PIN" link visible
- [ ] Loading state during submission

### Locked Component:
- [ ] Countdown timer working
- [ ] Red/warning theme applied
- [ ] Explanations are clear
- [ ] Contact support button visible

---

## 📱 Responsive Testing

Test on different screen sizes:

**Mobile (320px):**
```bash
# Open DevTools, toggle device toolbar
# Set to iPhone SE or similar
```

**Tablet (768px):**
```bash
# Set to iPad or similar
```

**Desktop (1920px):**
```bash
# Full screen
```

**Expected:**
- ✅ Components stay centered
- ✅ PIN boxes remain visible
- ✅ No horizontal scrolling
- ✅ Text is readable
- ✅ Buttons are clickable

---

## ⌨️ Keyboard Testing

### Tab Navigation:
1. Press Tab repeatedly
2. Focus should move through:
   - PIN input boxes (all 6)
   - Show/hide toggle (setup page)
   - Buttons (Back, Continue, Enable 2FA)

### Enter Key:
1. Fill all 6 digits
2. Press Enter
3. Should submit form

### Arrow Keys:
1. Focus on PIN input
2. Press Left/Right arrows
3. Focus should move between boxes

---

## 🔗 Integration Test (With Backend)

Once you have Privy authentication working:

### Complete Flow:
```bash
1. Login with Privy
2. Get redirected to /auth/2fa/setup
3. Set up PIN: "123456"
4. Confirm PIN: "123456"
5. Get redirected to /auth/2fa/verify
6. Enter PIN: "123456"
7. Should redirect to /dashboard
```

### Wrong PIN Flow:
```bash
1. Go to /auth/2fa/verify
2. Enter wrong PIN: "999999" (5 times)
3. Should redirect to /auth/2fa/locked
4. Wait for countdown
5. Should redirect back to /auth/2fa/verify
```

---

## 🐛 Common Issues & Fixes

### Issue: Components don't show
**Fix:** Make sure server is running on port 3001
```bash
npm run dev
```

### Issue: Styles look broken
**Fix:** Tailwind CSS might not be compiled. Restart dev server:
```bash
# Stop server (Ctrl+C)
rm -rf .next
npm run dev
```

### Issue: Navigation doesn't work
**Fix:** Make sure you're using Next.js 15 with App Router
```bash
# Check package.json
"next": "15.1.4"
```

### Issue: "Module not found" errors
**Fix:** Check import paths use `@/` alias
```javascript
// ✅ Correct
import PINInput from '@/components/PINInput';

// ❌ Wrong
import PINInput from '../../../components/PINInput';
```

---

## ✅ Checklist: What to Verify

Before integration:
- [ ] All 3 pages load without errors
- [ ] PIN input component works
- [ ] Setup flow is smooth (2 steps)
- [ ] Verify page accepts input
- [ ] Locked page shows countdown
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] No console errors
- [ ] Tailwind styles applied
- [ ] Components are accessible

After integration:
- [ ] Setup actually creates PIN in database
- [ ] Verify actually checks PIN
- [ ] Lockout actually enforces 10-minute wait
- [ ] Session cookie is set after verification
- [ ] Dashboard is accessible after 2FA
- [ ] Protected routes are blocked without 2FA

---

## 📊 Browser DevTools Checks

### Console Errors:
```bash
# Open DevTools (F12)
# Check Console tab
# Should see no errors (warnings are OK)
```

### Network Tab:
```bash
# When submitting PIN, check:
# POST /api/auth/2fa/setup
# POST /api/auth/2fa/verify
# Should see requests (even if they fail due to no session)
```

### Application Tab:
```bash
# Check Cookies
# After successful verify, should see:
# app_session=<JWT token>
```

---

## 🎯 Success Criteria

Frontend is working if:
- ✅ All pages render without crashing
- ✅ Components are interactive
- ✅ Validation works (6 digits only)
- ✅ Navigation flows correctly
- ✅ Styles look good on all screen sizes
- ✅ No console errors
- ✅ API calls are made (check Network tab)

---

## 🚀 Next: Integration with Privy

To connect this to your auth flow:

1. **In your Privy login callback:**
```javascript
// After successful Privy login
if (!user.twoFaEnabled) {
  router.push('/auth/2fa/setup');
} else if (!session.twoFaVerified) {
  router.push('/auth/2fa/verify');
} else {
  router.push('/dashboard');
}
```

2. **In your protected routes:**
```javascript
// Middleware or route guard
if (user.twoFaEnabled && !session.twoFaVerified) {
  return redirect('/auth/2fa/verify');
}
```

---

## 📖 More Documentation

- **Complete Guide**: See `2FA_FRONTEND_COMPLETE.md`
- **Backend Docs**: See `2FA_IMPLEMENTATION_SUMMARY.md`
- **Testing Guide**: See `2FA_TESTING_GUIDE.md` (backend testing)

---

**Ready to test!** 🎉

Start with visiting the setup page and explore the UI!

