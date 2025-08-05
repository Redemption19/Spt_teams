# 🔐 Agora Authentication Fix Guide

## Problem: "CAN_NOT_GET_GATEWAY_SERVER: dynamic use static key"

Your Agora project is configured for **token-based authentication** (secure mode), but the video call is trying to join without a token. This is a security feature to prevent unauthorized access.

## 🚀 Quick Fix (Development Mode)

### Option 1: Enable Testing Mode in Agora Console (Recommended for Development)

1. **Go to Agora Console**: https://console.agora.io/
2. **Navigate to**: Project Management → Your Project
3. **Find your project** with App ID: `821a4893963f4896868d01c3aff9c6e9`
4. **Click "Config"** → Authentication tab
5. **Change authentication mode** from:
   - ❌ **"App ID + Token"** (Secure mode)
   - ✅ **"App ID + App Certificate"** (Testing mode)
6. **Save** and **refresh** your video call page

### Option 2: Add App Certificate to Environment

If you prefer to keep secure mode but want to use certificates:

1. **Get your App Certificate** from Agora Console → Project → Config
2. **Add to your `.env.local`**:
   ```bash
   NEXT_PUBLIC_AGORA_APP_CERTIFICATE=your_app_certificate_here
   ```
3. **Restart your development server**

## 🏗️ Production Solution (Recommended)

For production deployment, implement proper token generation:

### Backend Token Generation (Secure)

1. **Install Agora Server SDK** on your backend:
   ```bash
   npm install agora-access-token
   ```

2. **Create token endpoint** on your backend:
   ```javascript
   // backend/api/agora-token.js
   import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
   
   export function generateAgoraToken(channelName, uid) {
     const appId = process.env.AGORA_APP_ID;
     const appCertificate = process.env.AGORA_APP_CERTIFICATE;
     const role = RtcRole.PUBLISHER;
     const expirationTimeInSeconds = 3600; // 1 hour
     
     return RtcTokenBuilder.buildTokenWithUid(
       appId, 
       appCertificate, 
       channelName, 
       uid, 
       role, 
       Math.floor(Date.now() / 1000) + expirationTimeInSeconds
     );
   }
   ```

3. **Update video call service** to fetch tokens:
   ```typescript
   // Before joining call
   const token = await fetch('/api/agora-token', {
     method: 'POST',
     body: JSON.stringify({ channelName, uid })
   }).then(res => res.json());
   
   // Use token in join call
   await client.join(appId, channelName, token, uid);
   ```

## 📊 Current Status

- ✅ **App ID**: Configured and valid
- ❌ **Authentication**: Project in secure mode, needs token or testing mode
- ✅ **User**: Authenticated  
- ✅ **Channel**: Generated correctly

## 🔧 Debugging Steps

1. **Check your current Agora project settings**:
   - Login to: https://console.agora.io/
   - Project Management → Your Project → Config
   - Note the current Authentication mode

2. **Test with different modes**:
   - Testing mode: Uses App ID + App Certificate
   - Secure mode: Uses App ID + Token (requires backend)

3. **Monitor console logs** for authentication attempts

## ⚡ Quick Actions

### For Immediate Testing:
```bash
# Option A: Switch to testing mode in Agora Console (1 minute)
# Option B: Add App Certificate to .env.local
```

### For Production Deployment:
```bash
# Implement backend token generation (30 minutes)
# Update frontend to fetch tokens from backend
# Deploy with proper environment variables
```

## 🛡️ Security Notes

- **Testing Mode**: Less secure, good for development
- **Token Mode**: Highly secure, required for production
- **App Certificate**: Keep secret, never expose to frontend
- **Tokens**: Generate server-side, expire automatically

## 📞 Support

If you continue having issues:
1. Check Agora Console for project status
2. Verify environment variables are loaded
3. Check browser console for detailed error messages
4. Test with a fresh browser session

---

**Next Step**: Choose testing mode for immediate development or implement token generation for production-ready solution.
