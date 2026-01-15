# Cloudflare Turnstile Setup Guide
**Zero-to-Hero | Bot Protection**

---

## What is Cloudflare Turnstile?

Turnstile is Cloudflare's **invisible CAPTCHA replacement** that:
- **Blocks bots** without annoying users (no image puzzles!)
- **Privacy-focused**: No user tracking or fingerprinting
- **Free**: 1 million verifications/month included
- **Better UX**: Most users see nothing (challenge appears only for suspicious traffic)

**vs reCAPTCHA:** Turnstile doesn't track users across the web or sell data to Google.

---

## Step 1: Access Cloudflare Dashboard

### 1.1 Log In to Cloudflare
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Log in with your Cloudflare account
3. Verify your domain `extreamsys.com` is listed

**Don't have Cloudflare?**
- If your domain is registered elsewhere but DNS is on Cloudflare, you're good
- If DNS is not on Cloudflare yet, follow their [domain transfer guide](https://developers.cloudflare.com/dns/zone-setups/full-setup/)

---

## Step 2: Create Turnstile Site

### 2.1 Navigate to Turnstile
1. In Cloudflare dashboard, click **"Turnstile"** in the left sidebar
2. Or go directly to: [dash.cloudflare.com/turnstile](https://dash.cloudflare.com/turnstile)

### 2.2 Create New Site
1. Click **"Add Site"**
2. Fill in the form:

| Field | Value |
|-------|-------|
| **Site name** | `ExtreamSys Production` |
| **Domain** | `extreamsys.com` |
| **Widget Mode** | **Managed** (recommended) |

**Widget Mode Options:**
- **Managed**: Automatically shows challenge when needed (best UX)
- **Non-Interactive**: Always invisible (use for low-risk forms)
- **Invisible**: Challenge triggered programmatically (advanced)

**Recommendation:** Use **Managed** for contact form.

### 2.3 Click "Create"

---

## Step 3: Get Your API Keys

After creating the site, you'll see two keys:

### 3.1 Site Key (Public)
- **Looks like:** `0x4AAAAAAA...` (40 characters)
- **Used in:** Frontend (visible in browser)
- **Environment variable:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

### 3.2 Secret Key (Private)
- **Looks like:** `0x4AAAAAAA...` (40 characters, different from site key)
- **Used in:** Backend API verification
- **Environment variable:** `TURNSTILE_SECRET_KEY`

**⚠️ SECURITY:**
- **Never commit secret key to git**
- **Never expose secret key in browser**
- Store in Vercel environment variables only

### 3.3 Copy Keys to Safe Location
Save both keys temporarily (we'll add them to Vercel in Step 5).

---

## Step 4: Configure Turnstile Settings

### 4.1 Edit Site Settings
1. Click on your site name in Turnstile dashboard
2. Review/adjust these settings:

| Setting | Recommended Value | Why |
|---------|-------------------|-----|
| **Domain** | `extreamsys.com` | Restricts where widget can be used |
| **Widget Mode** | Managed | Best UX, auto-escalates challenges |
| **Security Level** | Medium | Balances security and user experience |
| **Enable Cookies** | Enabled | Improves accuracy (no tracking across sites) |

### 4.2 Whitelist Additional Domains (Optional)
If you want Turnstile to work on:
- **Preview deployments:** Add `*.vercel.app`
- **Localhost:** Add `localhost`, `127.0.0.1`

**How to add:**
1. Click **"Settings"**
2. Under **"Domains"**, click **"Add domain"**
3. Enter: `*.vercel.app` (allows all Vercel preview URLs)
4. Enter: `localhost` (for local development)
5. Click **"Save"**

---

## Step 5: Add Keys to Vercel Environment Variables

### 5.1 In Vercel Dashboard
1. Go to your project: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Settings → Environment Variables**
3. Add these two variables:

#### Variable 1: Site Key (Public)
```
Name: NEXT_PUBLIC_TURNSTILE_SITE_KEY
Value: [paste your site key]
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variable 2: Secret Key (Private)
```
Name: TURNSTILE_SECRET_KEY
Value: [paste your secret key]
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### 5.2 Verify Variables
Run this command locally to verify:
```bash
vercel env pull .env.local
cat .env.local | grep TURNSTILE
```

Should output (with your actual keys):
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

---

## Step 6: Test Turnstile Integration

### 6.1 Create Test Component
We'll create a simple test page to verify Turnstile works.

**File:** `app/test-turnstile/page.tsx`
```tsx
"use client";

import { useState } from "react";

export default function TurnstileTest() {
  const [token, setToken] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Turnstile Test</h1>

        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-callback="onTurnstileSuccess"
        />

        {token && (
          <div className="p-4 bg-green-100 border border-green-400 rounded">
            <p className="text-sm font-mono break-all">{token}</p>
          </div>
        )}

        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </div>
    </div>
  );
}
```

### 6.2 Test Locally
```bash
npm run dev
```

Visit: `http://localhost:3000/test-turnstile`

**Expected behavior:**
- Widget appears (small Cloudflare logo)
- After 1-2 seconds: Checkmark appears (if no challenge needed)
- Or: Interactive challenge appears (for suspicious patterns)

### 6.3 Verify Server-Side
Test the API endpoint:

```bash
# Get a token from the widget first, then:
curl -X POST https://extreamsys.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message",
    "turnstileToken": "[paste token from widget]"
  }'
```

**Expected response:**
- ✅ `{"success": true, ...}` - Turnstile verified
- ❌ `{"error": "Verification failed"}` - Token invalid/expired

---

## Step 7: Monitor Turnstile Analytics

### 7.1 View Analytics Dashboard
1. Go to Cloudflare **Turnstile** dashboard
2. Click on your site name
3. Click **"Analytics"** tab

**Metrics you'll see:**
- **Total Verifications**: Total challenges completed
- **Solve Rate**: % of challenges passed
- **Challenge Rate**: % of requests that required a challenge
- **Top Countries**: Geographic distribution

### 7.2 Set Up Alerts (Optional)
1. Click **"Notifications"**
2. Create alert for:
   - **High fail rate** (>10% failures) → Possible attack
   - **Unusual traffic spike** → Investigate source

---

## Understanding Turnstile Responses

### Success Response
```json
{
  "success": true,
  "challenge_ts": "2026-01-15T10:30:00Z",
  "hostname": "extreamsys.com",
  "action": "contact-form"
}
```

### Failure Response
```json
{
  "success": false,
  "error-codes": ["invalid-input-response"]
}
```

**Common Error Codes:**

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `missing-input-response` | No token provided | Check frontend sends token |
| `invalid-input-response` | Token invalid/expired | Token used twice or >5min old |
| `timeout-or-duplicate` | Token already used | Generate new token |
| `invalid-input-secret` | Wrong secret key | Verify environment variable |

---

## Best Practices

### ✅ DO:
- Verify tokens **server-side** (never trust client)
- Set token expiration to 5 minutes max
- Include user IP in verification request (increases accuracy)
- Monitor analytics for unusual patterns

### ❌ DON'T:
- Reuse tokens (each submission = new token)
- Cache verification results (always verify fresh)
- Skip verification on "trusted" users (bots can fake this)
- Expose secret key in frontend code

---

## Troubleshooting

### Issue: "Widget not appearing"
**Solutions:**
1. Check site key is correct: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
2. Verify domain is whitelisted in Cloudflare
3. Check browser console for errors
4. Disable ad blockers (sometimes block Turnstile)

### Issue: "Verification always fails"
**Solutions:**
1. Verify secret key is correct: `TURNSTILE_SECRET_KEY`
2. Check domain matches Cloudflare config
3. Ensure token is not expired (5min lifetime)
4. Check server clock is synchronized (NTP)

### Issue: "Too many challenges"
**Solutions:**
1. Lower security level in Cloudflare (Settings → Security Level)
2. Check if your IP is flagged (test from different network)
3. Review Cloudflare firewall rules (may be blocking legitimate traffic)

### Issue: "CORS errors"
**Solutions:**
1. Verify domain is added to Turnstile allowed domains
2. Check `https://` is used (not `http://`)
3. Add `*.vercel.app` for preview deployments

---

## Security Considerations

### Token Lifetime
- Tokens expire after **5 minutes**
- Tokens can only be verified **once**
- Store tokens temporarily in memory only (never in localStorage)

### Rate Limiting Integration
Turnstile works **alongside** rate limiting:
1. **Rate limit** prevents spam from single IP
2. **Turnstile** prevents distributed bot attacks

Both are required for comprehensive protection.

### Monitoring
Set up alerts for:
- **Solve rate < 90%**: Possible issue with widget
- **Challenge rate > 50%**: High bot traffic
- **Verification failures > 100/hour**: Potential attack

---

## Cost & Limits

| Plan | Verifications/Month | Cost |
|------|---------------------|------|
| **Free** | 1,000,000 | $0 |
| **Paid** | Unlimited | $0.50 per 1,000 additional |

**For ExtreamSys:**
- With 1,000 contact form submissions/month → **Free**
- Even with 10,000/month → $4.50/month

---

## Next Steps

1. ✅ Turnstile is configured
2. → Continue to: `03-upstash-redis.md` (rate limiting)
3. → Then: `04-postmark.md` (email delivery)

---

## Quick Reference

| Resource | URL |
|----------|-----|
| **Dashboard** | [dash.cloudflare.com/turnstile](https://dash.cloudflare.com/turnstile) |
| **Docs** | [developers.cloudflare.com/turnstile](https://developers.cloudflare.com/turnstile/) |
| **API Endpoint** | `https://challenges.cloudflare.com/turnstile/v0/siteverify` |
| **Widget Script** | `https://challenges.cloudflare.com/turnstile/v0/api.js` |

---

**Questions?** Cloudflare support is available 24/7 via dashboard chat.
