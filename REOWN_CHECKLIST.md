# Reown Dashboard - Not Showing Connected Users Checklist

## Issue Summary
- Disconnect button not showing → **FIXED** (will show after next deployment)
- Wallet auto-connecting on refresh → **NORMAL BEHAVIOR** (AppKit persists connections)
- No users in Reown dashboard → **FOLLOW CHECKLIST BELOW**

## ✅ Checklist to Fix "No Connected Users"

### 1. Verify You're Using WalletConnect (Not Direct Injection)

**The Problem:**
- If you connect via MetaMask browser extension directly, it uses "injected provider"
- This does NOT go through WalletConnect relay
- Therefore, it won't show in Reown dashboard

**The Solution:**
1. Visit: `https://sloto-caster.vercel.app/test-wallet`
2. Click "Open Wallet Modal"
3. **DO NOT** click "MetaMask" if you have the extension installed
4. Instead, choose:
   - **WalletConnect** option
   - **Scan QR code** with mobile wallet
   - Or choose **Coinbase Wallet**, **Rainbow**, etc.

**Important:** Direct MetaMask extension connections bypass WalletConnect!

### 2. Check Reown Dashboard Configuration

Go to: https://cloud.reown.com/app/a9e76b0ec4e509017100199fb6ff6957

#### Settings → Configuration → Allowed Origins
✅ Must include:
```
https://sloto-caster.vercel.app
```

Optional but recommended:
```
https://*.vercel.app
http://localhost:3000
```

#### Settings → Analytics
✅ Make sure "Analytics" is **ENABLED**

#### Settings → Networks
✅ Verify these networks are enabled:
- Base (Chain ID: 8453)
- Base Sepolia (Chain ID: 84532)

### 3. Test Connection Flow

**Step 1:** Visit test page
```
https://sloto-caster.vercel.app/test-wallet
```

**Step 2:** Open browser DevTools (F12) → Console

**Step 3:** Look for this log:
```
✅ Reown AppKit initialized with project ID: a9e76b0ec4e509017100199fb6ff6957
```
❌ If missing → AppKit not initializing (clear cache and refresh)

**Step 4:** Click "Open Wallet Modal"

**Step 5:** Expected modal options:
- MetaMask (mobile/QR)
- Coinbase Wallet
- Rainbow
- WalletConnect
- Trust Wallet
- ... and more

❌ If modal doesn't appear → Check console for errors

**Step 6:** Choose a wallet THAT USES WALLETCONNECT:
- ✅ WalletConnect QR code
- ✅ Mobile wallet via QR
- ✅ Coinbase Wallet (web)
- ❌ MetaMask browser extension (direct injection)

**Step 7:** After connecting, verify:
```
Is Connected: ✅ Yes
Address: 0x... (your address)
CAIP Address: eip155:8453:0x... (with chain ID)
Provider Available: ✅ Yes
```

**Step 8:** Check browser DevTools → Network tab:
- Filter by "relay.walletconnect"
- Should see WebSocket connections to:
  ```
  wss://relay.walletconnect.com
  wss://relay.walletconnect.org
  ```

❌ If no relay connections → You're not using WalletConnect!

### 4. Wait and Refresh Dashboard

After successful WalletConnect connection:
1. ⏱️ Wait **2-3 minutes**
2. 🔄 Refresh your Reown dashboard
3. 👥 Check "Connected Users" section
4. ✅ You should see your connection

### 5. Common Mistakes

#### ❌ Using MetaMask Extension Directly
**Problem:** Clicking MetaMask when extension is installed uses direct injection
**Solution:** Use WalletConnect option or scan QR code instead

#### ❌ Wrong Network
**Problem:** Connected to Ethereum mainnet instead of Base
**Solution:** Switch to Base Mainnet (Chain ID: 8453) in your wallet

#### ❌ Domain Not Whitelisted
**Problem:** Your domain isn't in allowed origins
**Solution:** Add exact domain including https:// in Reown settings

#### ❌ Using Old Session
**Problem:** Browser cached an old connection method
**Solution:** Clear browser cache or use incognito window

#### ❌ Wrong Project ID
**Problem:** Using different project ID than configured
**Solution:** Verify project ID in console log matches: a9e76b0ec4e509017100199fb6ff6957

### 6. Verify Current Deployment

**After next deployment**, the disconnect button will show because:
1. ✅ WalletConnectButton now always renders (fixed)
2. ✅ Shows green address button + red disconnect button when connected
3. ✅ Better state management between connection methods

**On main game page:**
- When disconnected: Shows "Connect Wallet" button
- When connected: Shows address + "Disconnect" button

**Test both pages:**
1. Main game: https://sloto-caster.vercel.app
2. Test page: https://sloto-caster.vercel.app/test-wallet

### 7. If Still Not Working

Share these details:

1. **Screenshot of test page** showing connection status
2. **Browser console logs** (all of them)
3. **Network tab** filtered by "walletconnect"
4. **Which wallet** you used (exact name)
5. **How you connected** (QR code, browser extension, mobile, etc.)
6. **Screenshot of Reown dashboard** settings page

## Expected Working Flow

```
1. Visit site
   → AppKit initializes with your project ID

2. Click "Connect Wallet"  
   → Modal shows multiple wallet options

3. Choose WalletConnect or mobile wallet
   → Scan QR code OR approve in wallet app
   → NOT browser extension direct connection

4. Connection establishes
   → See relay.walletconnect.com in Network tab
   → Address shows in UI
   → Disconnect button appears

5. Wait 1-3 minutes
   → Check Reown dashboard
   → See user in "Connected Users"
```

## Quick Debug Commands

**Check if WalletConnect is active:**
```javascript
// In browser console after connecting
console.log(window.ethereum?.isMetaMask)  // Should be undefined or false for WC
console.log(window.ethereum?.isWalletConnect)  // Should be true for WC
```

**Check provider type:**
```javascript
// Look for walletProvider in console logs
// Should show WalletConnect related properties, not just MetaMask
```

---

**Current Project ID:** `a9e76b0ec4e509017100199fb6ff6957`

**Need Help?** Share the 7 items listed in "If Still Not Working" section.
