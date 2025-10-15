# Debugging Reown AppKit Connection

## Current Issue
- Disconnect button not showing
- No users appearing in Reown dashboard

## Step 1: Check Console Logs

After deploying, open your site and check browser console (F12 → Console):

### Expected Logs on Page Load:
```
✅ Reown AppKit initialized with project ID: a9e76b0ec4e509017100199fb6ff6957
```

### Expected Logs When Connecting:
```
🔵 Opening wallet modal...
🔗 Reown state changed: { isReownConnected: true, reownAddress: "0x..." }
✅ Wallet connected via Reown AppKit: 0x...
🔌 WalletConnectButton state: { isConnected: true, address: "0x...", caipAddress: "eip155:8453:0x..." }
✅ Showing disconnect button for address: 0x...
```

### Expected Logs When Disconnecting:
```
🔴 Disconnecting wallet...
✅ Wallet disconnected
🔴 Wallet disconnected from Reown
```

## Step 2: Verify Reown Dashboard Settings

### Go to: https://cloud.reown.com

1. **Select Your Project**
   - Project ID: `a9e76b0ec4e509017100199fb6ff6957`

2. **Check Settings → Allowed Origins**
   - Must include: `https://sloto-caster.vercel.app`
   - Optionally add: `https://*.vercel.app` for preview deployments
   - Add: `http://localhost:3000` for local testing

3. **Check Settings → Networks**
   - Verify Base Mainnet (Chain ID: 8453) is enabled
   - Verify Base Sepolia (Chain ID: 84532) is enabled

4. **Verify Analytics is Enabled**
   - Look for Analytics toggle in settings
   - Make sure it's ON

## Step 3: Test Connection Flow

### On Your Deployed Site:

1. **Open in Incognito/Private Window** (to avoid cached state)

2. **Open Browser DevTools** (F12)
   - Go to Console tab
   - Keep it open

3. **Click "Connect Wallet" Button**
   - Modal should appear with wallet options
   - Select any wallet (MetaMask, Coinbase, Rainbow, etc.)

4. **After Connecting:**
   - Check console for connection logs
   - You should see TWO buttons:
     - Green button with your address
     - Red "Disconnect" button

5. **If Disconnect Button Doesn't Show:**
   - Check console logs
   - Look for `isConnected` and `address` values
   - Share the console output

## Step 4: Common Issues

### Issue: No Disconnect Button
**Possible Causes:**
- AppKit not initializing (missing initialization log)
- Reown state not updating (check state logs)
- Farcaster mini-app overriding connection state

**Solution:**
- Check if you're in Farcaster mini-app (different connection flow)
- Verify console shows `isReownConnected: true`
- Clear browser cache and try again

### Issue: No Users in Reown Dashboard
**Possible Causes:**
- Domain not whitelisted in Allowed Origins
- Analytics disabled
- Using MetaMask direct connection instead of WalletConnect
- Connection delay (can take 1-2 minutes)

**Solution:**
- Verify allowed origins include your domain
- Make sure you connected via the AppKit modal (not direct MetaMask)
- Wait 2-3 minutes and refresh dashboard
- Check if you're on correct network (Base Mainnet)

### Issue: AppKit Modal Doesn't Open
**Possible Causes:**
- AppKit not initialized
- JavaScript error preventing modal

**Solution:**
- Check for initialization log in console
- Look for any JavaScript errors
- Try clearing cache and hard refresh (Ctrl+Shift+R)

## Step 5: Network Inspection

### Check WalletConnect Relay:

1. Open DevTools → Network tab
2. Filter by "relay.walletconnect"
3. Connect your wallet
4. You should see WebSocket connections to:
   - `wss://relay.walletconnect.com`
   - `wss://relay.walletconnect.org`

If you see these connections, WalletConnect is working!

## Step 6: Share Debug Info

If still not working, please share:

1. **Browser console logs** (all logs with 🔌, 🔗, ✅, 🔴 emojis)
2. **Network tab** filtered by "walletconnect"
3. **Screenshot** of what you see after connecting
4. **Reown dashboard** screenshot showing settings
5. **Which wallet** you're using to connect

## Expected Working Flow

```
1. Page loads
   → ✅ AppKit initialized

2. User clicks "Connect Wallet"
   → 🔵 Modal opens

3. User selects wallet and approves
   → ✅ Connected via Reown
   → 🔌 State updated: isConnected=true
   → Shows green address button + red disconnect button

4. Wait 1-2 minutes
   → Dashboard shows user in "Connected Users"

5. User clicks "Disconnect"
   → 🔴 Disconnecting
   → State resets
   → Shows "Connect Wallet" button again
```

---

**Note:** If you're testing in the Farcaster mini-app, the connection flow is different and uses Farcaster's wallet instead of WalletConnect, so it won't show in Reown dashboard.
