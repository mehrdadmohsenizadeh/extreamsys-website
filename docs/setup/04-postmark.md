# Postmark Setup Guide
**Zero-to-Hero | Email Delivery & Deliverability**

---

## What is Postmark?

Postmark is a **transactional email service** built for:
- **99.96% deliverability**: Best-in-class inbox placement
- **Speed**: Email delivered in <1 second
- **Reliability**: Built for mission-critical applications
- **Transparency**: Real-time delivery tracking, bounce handling

**vs SendGrid/Mailgun:** Postmark focuses exclusively on transactional emails (not marketing), resulting in better reputation and deliverability.

---

## Step 1: Create Postmark Account

### 1.1 Sign Up
1. Go to [postmarkapp.com](https://postmarkapp.com)
2. Click **"Start Free Trial"**
3. Fill in your details:
   - **Email**: Your work email
   - **Name**: Your name
   - **Company**: ExtreamSys, LLC
   - **Password**: Strong password (12+ characters)
4. Click **"Create Account"**

### 1.2 Email Verification
1. Check your inbox for verification email
2. Click verification link
3. Log in to Postmark dashboard

**Free trial includes:**
- 100 emails/month forever (no credit card required)
- All features unlocked
- Full analytics and tracking

---

## Step 2: Create a Server

In Postmark, a **"Server"** is a container for your emails (not a physical server).

### 2.1 Create Production Server
1. In Postmark dashboard, click **"Create Server"**
2. Fill in the form:

| Field | Value |
|-------|-------|
| **Server Name** | `ExtreamSys Production` |
| **Server Type** | **Transactional** |
| **Environment** | **Production** |

**Server Types:**
- **Transactional**: Password resets, receipts, **contact forms** ← Use this
- **Broadcast**: Newsletters, announcements

### 2.2 Click "Create Server"

---

## Step 3: Get API Token

### 3.1 Navigate to API Tokens
1. Click on your server name (`ExtreamSys Production`)
2. Click **"API Tokens"** tab
3. You'll see a **Server API Token** (automatically generated)

### 3.2 Copy API Token
- **Format:** Long string like `d1234567-89ab-cdef-0123-456789abcdef`
- **Usage:** This token allows sending emails from your server
- **Security:** Never commit to git, store in environment variables only

**⚠️ Security:**
- This token has **full access** to send emails from your domain
- Treat it like a password
- Rotate every 90 days (security best practice)

### 3.3 Save Token
Copy the token to a safe location (we'll add to Vercel in Step 6).

---

## Step 4: Verify Sender Domain (extreamsys.com)

This is the **most critical step** for deliverability. We'll configure SPF, DKIM, and DMARC.

### 4.1 Add Domain
1. In your server, click **"Sender Signatures"** tab
2. Click **"Add Domain or Signature"**
3. Choose **"Domain"** (recommended over single email)
4. Enter: `extreamsys.com`
5. Click **"Verify Domain"**

### 4.2 DNS Records Required
Postmark will show you 4 DNS records to add. We'll add these in Cloudflare.

**Example records (yours will be unique):**

#### Record 1: DKIM (DomainKeys Identified Mail)
```
Type: CNAME
Name: 20230115._domainkey.extreamsys.com
Value: 20230115.dkim.postmarkapp.com
TTL: Auto
```

#### Record 2: Return-Path (Bounce Handling)
```
Type: CNAME
Name: pm-bounces.extreamsys.com
Value: pm.mtasv.net
TTL: Auto
```

**Copy all records** - we'll add them next.

---

## Step 5: Configure DNS in Cloudflare

### 5.1 Log In to Cloudflare
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **extreamsys.com** domain
3. Click **"DNS"** tab

### 5.2 Add DKIM Record
1. Click **"Add record"**
2. Fill in:
   - **Type:** CNAME
   - **Name:** `20230115._domainkey` (your value from Postmark)
   - **Target:** `20230115.dkim.postmarkapp.com` (your value)
   - **Proxy status:** **DNS only** (gray cloud) ← Important!
   - **TTL:** Auto
3. Click **"Save"**

### 5.3 Add Return-Path Record
1. Click **"Add record"**
2. Fill in:
   - **Type:** CNAME
   - **Name:** `pm-bounces`
   - **Target:** `pm.mtasv.net`
   - **Proxy status:** **DNS only** (gray cloud)
   - **TTL:** Auto
3. Click **"Save"**

### 5.4 Configure SPF Record
SPF (Sender Policy Framework) tells email servers that Postmark is authorized to send emails from your domain.

**Check existing SPF record:**
1. In Cloudflare DNS, look for a **TXT** record with name `@` that starts with `v=spf1`
2. If it exists, **edit it**. If not, **create new**.

**Add Postmark to SPF:**
- If **no SPF record exists:**
  ```
  Type: TXT
  Name: @
  Content: v=spf1 include:spf.mtasv.net ~all
  TTL: Auto
  ```

- If **SPF record already exists** (e.g., `v=spf1 include:_spf.google.com ~all`):
  ```
  v=spf1 include:spf.mtasv.net include:_spf.google.com ~all
  ```
  (Just add `include:spf.mtasv.net` before `~all`)

**Important:** Only one SPF record per domain allowed.

### 5.5 Configure DMARC Record
DMARC (Domain-based Message Authentication) protects your domain from spoofing.

**Add DMARC record:**
1. Click **"Add record"**
2. Fill in:
   - **Type:** TXT
   - **Name:** `_dmarc`
   - **Content:** `v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@extreamsys.com; ruf=mailto:dmarc@extreamsys.com; fo=1`
   - **TTL:** Auto
3. Click **"Save"**

**DMARC Policy Explanation:**
- `p=reject`: Reject unauthenticated emails (strongest policy)
- `pct=100`: Apply to 100% of emails
- `rua`: Aggregate reports sent here (daily summaries)
- `ruf`: Forensic reports (individual failures)

**⚠️ Important:** Start with `p=none` for testing, then escalate to `p=reject` after verifying all emails authenticate correctly.

**Testing Phase:**
```
v=DMARC1; p=none; pct=100; rua=mailto:dmarc@extreamsys.com
```

**Production (after 1 week of monitoring):**
```
v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@extreamsys.com; ruf=mailto:dmarc@extreamsys.com; fo=1
```

---

## Step 6: Verify DNS Configuration

### 6.1 In Postmark Dashboard
1. Go back to Postmark **"Sender Signatures"** tab
2. Click **"Verify"** next to your domain
3. Wait 5-10 minutes for DNS propagation
4. Click **"Verify"** again

**Expected result:**
- ✅ **DKIM**: Verified
- ✅ **Return-Path**: Verified
- ✅ **SPF**: Verified (if configured correctly)

**If not verified:**
- Wait another 10 minutes (DNS can take up to 1 hour)
- Use [mxtoolbox.com/spf.aspx](https://mxtoolbox.com/spf.aspx) to test SPF
- Use [mxtoolbox.com/dkim.aspx](https://mxtoolbox.com/dkim.aspx) to test DKIM

### 6.2 Test DNS Records Manually
```bash
# Test DKIM
dig 20230115._domainkey.extreamsys.com CNAME

# Test Return-Path
dig pm-bounces.extreamsys.com CNAME

# Test SPF
dig extreamsys.com TXT | grep spf

# Test DMARC
dig _dmarc.extreamsys.com TXT
```

---

## Step 7: Configure From Email Addresses

### 7.1 Choose From Address
We'll use: `noreply@extreamsys.com`

**Why noreply?**
- Standard practice for automated emails
- Users can still reply (we set Reply-To header to `contact@extreamsys.com`)

### 7.2 Set Up Reply-To Address
In our code (`lib/utils/email.ts`), we configure:
```typescript
From: noreply@extreamsys.com        // Sender
ReplyTo: contact@extreamsys.com     // Replies go here
```

This way:
- Automated emails come from `noreply@`
- User replies go to `contact@` (your monitored inbox)

---

## Step 8: Add API Token to Vercel

### 8.1 In Vercel Dashboard
1. Go to your project: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Settings → Environment Variables**
3. Add these three variables:

#### Variable 1: API Token
```
Name: POSTMARK_API_TOKEN
Value: [paste your Server API Token]
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variable 2: From Email
```
Name: POSTMARK_FROM_EMAIL
Value: noreply@extreamsys.com
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variable 3: Reply-To Email
```
Name: POSTMARK_REPLY_TO_EMAIL
Value: contact@extreamsys.com
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### 8.2 Redeploy
```bash
vercel --prod
```

---

## Step 9: Test Email Sending

### 9.1 Send Test Email via Postmark UI
1. In Postmark, click your server
2. Click **"Send a Test Email"** tab
3. Fill in:
   - **To:** Your email address
   - **From:** `noreply@extreamsys.com`
   - **Subject:** Test Email from ExtreamSys
   - **Body:** Test message
4. Click **"Send"**

**Check your inbox** (should arrive in <5 seconds).

### 9.2 Test Contact Form (End-to-End)
```bash
# Use the actual contact form or API
curl -X POST https://extreamsys.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "message": "Test message from API",
    "turnstileToken": "[get from widget]"
  }'
```

**Expected:**
1. API returns: `{"success": true}`
2. You receive email at `contact@extreamsys.com` (internal notification)
3. User receives confirmation at `your-email@example.com`

---

## Step 10: Monitor Email Delivery

### 10.1 Activity Dashboard
1. In Postmark, click **"Activity"** tab
2. You'll see all sent emails with:
   - **Status**: Sent, Delivered, Bounced, Opened
   - **Recipient**
   - **Subject**
   - **Timestamp**
   - **Delivery time** (usually <1 second)

### 10.2 Track Individual Emails
Click on any email to see:
- **Delivery events**: Sent → Delivered → Opened
- **Opens**: When recipient opened email (if images loaded)
- **Clicks**: Which links were clicked (if enabled)
- **Raw email**: Full email source (for debugging)

### 10.3 Bounce Handling
If an email bounces:
1. Postmark automatically retries (for transient failures)
2. Hard bounces (invalid email) are marked immediately
3. You'll see bounce reason (e.g., "Mailbox not found")

**Action required:**
- Hard bounce → Remove from your database
- Soft bounce → Retry later (Postmark does this automatically)

---

## Understanding Postmark Metrics

### Key Metrics (Activity Tab)

#### Sent
- Total emails sent from your server
- Includes successful and failed attempts

#### Delivered
- Emails successfully accepted by recipient's mail server
- **Target:** 99%+ delivery rate

#### Bounced
- Emails rejected by recipient's server
- **Hard bounce:** Permanent failure (bad email)
- **Soft bounce:** Temporary failure (mailbox full)
- **Target:** <1% bounce rate

#### Opened
- Recipient opened the email (loaded images)
- **Note:** Privacy features (Apple Mail Privacy) may affect accuracy
- **Target:** Not applicable for transactional emails

#### Spam Complaints
- Recipient marked email as spam
- **Critical:** High spam rate damages your domain reputation
- **Target:** <0.1% spam complaint rate

---

## Email Templates (Production-Ready)

Our code includes two templates (in `lib/utils/email.ts`):

### 1. Internal Notification
- **Sent to:** `contact@extreamsys.com`
- **Purpose:** Notify your team of new contact form submission
- **Includes:**
  - Customer name, email, phone, company
  - Message content
  - "Reply directly" action (Reply-To set to customer email)

### 2. Customer Confirmation
- **Sent to:** Customer email
- **Purpose:** Confirm receipt of their message
- **Includes:**
  - Personalized greeting
  - Expected response time (1-2 business days)
  - Your contact phone number
  - Professional branding

---

## Deliverability Best Practices

### ✅ DO:
1. **Authenticate your domain** (SPF, DKIM, DMARC)
2. **Monitor bounce rates** (pause sending if >5%)
3. **Handle unsubscribes** (for newsletters)
4. **Use Reply-To header** (let users respond)
5. **Warm up new domains** (start with low volume)

### ❌ DON'T:
1. **Send marketing emails** from transactional server
2. **Use purchased email lists** (guaranteed spam complaints)
3. **Send to invalid emails** (damages reputation)
4. **Use all caps in subject** (spam trigger)
5. **Embed too many images** (slow loading, spam trigger)

---

## Advanced Configuration

### Webhooks (Optional - Phase 3+)
Configure webhooks to receive real-time delivery events:

1. In Postmark, click **"Webhooks"** tab
2. Click **"Add Webhook"**
3. URL: `https://extreamsys.com/api/webhooks/postmark`
4. Select events:
   - **Delivery**: Email delivered
   - **Bounce**: Email bounced
   - **Spam Complaint**: Marked as spam
   - **Open**: Email opened (optional)

**Use case:** Track delivery status in your database.

### Message Streams
Separate email streams for different purposes:

- **Transactional**: Contact forms, password resets
- **Broadcasts**: Newsletters (requires separate setup)

**Default:** All emails use "outbound" stream.

---

## Troubleshooting

### Issue: "Invalid API token"
**Solutions:**
1. Verify token is correct (copy again from Postmark)
2. Check no extra whitespace in environment variable
3. Ensure token is from correct server (not account token)

### Issue: "Email not delivered"
**Solutions:**
1. Check Activity tab for bounce reason
2. Verify recipient email is valid
3. Check spam folder (recipient side)
4. Verify SPF/DKIM/DMARC are configured correctly

### Issue: "Emails going to spam"
**Solutions:**
1. **Check authentication**: SPF, DKIM, DMARC must be verified
2. **Test email content**: Use [mail-tester.com](https://www.mail-tester.com/)
3. **Review sender reputation**: Use [postmarkapp.com/blacklist-check](https://postmarkapp.com/blacklist-check)
4. **Reduce image-to-text ratio** (too many images = spam)

### Issue: "DMARC verification failed"
**Solutions:**
1. Ensure DKIM is verified first (required for DMARC alignment)
2. Check From domain matches DKIM domain
3. Wait 24 hours for DNS propagation
4. Use [dmarcian.com](https://dmarcian.com/dmarc-inspector/) to test

---

## Cost & Limits

### Free Tier
- **100 emails/month**
- All features unlocked
- No time limit
- No credit card required

**For ExtreamSys contact form:**
- ~50 submissions/month = 100 emails/month (notification + confirmation)
- **Conclusion:** Free tier is sufficient for Phase 1

### Paid Tier (if needed)
| Volume | Cost per Email |
|--------|----------------|
| 0-10K | $0.0125 ($1.25 per 100) |
| 10K-50K | $0.0100 ($1.00 per 100) |
| 50K-125K | $0.0075 ($0.75 per 100) |

**Example:**
- 500 contact forms/month = 1,000 emails
- Cost: ~$12.50/month

---

## Security Checklist

- [ ] API token stored in environment variables (not committed)
- [ ] SPF record includes Postmark
- [ ] DKIM verified
- [ ] DMARC policy set (start with `p=none`, escalate to `p=reject`)
- [ ] From email uses verified domain
- [ ] Reply-To header configured (allows responses)
- [ ] Bounce webhooks configured (optional, Phase 2+)

---

## Maintenance Tasks

### Weekly
- [ ] Review Activity dashboard (check bounce/spam rates)
- [ ] Monitor delivery rate (should be >99%)

### Monthly
- [ ] Review DMARC reports (from `rua=` email)
- [ ] Check sender reputation: [postmarkapp.com/blacklist-check](https://postmarkapp.com/blacklist-check)
- [ ] Verify email templates render correctly (test sends)

### Quarterly
- [ ] Rotate API token (security best practice)
- [ ] Review and update DMARC policy (escalate to `p=reject` if ready)

---

## Next Steps

1. ✅ Postmark is configured
2. ✅ Domain is verified (SPF, DKIM, DMARC)
3. → Optional: `05-neon-database.md` (for Phase 2+ newsletter storage)
4. → Proceed to: **Phase 1 Testing & Deployment**

---

## Quick Reference

| Resource | URL |
|----------|-----|
| **Dashboard** | [account.postmarkapp.com](https://account.postmarkapp.com) |
| **Docs** | [postmarkapp.com/developer](https://postmarkapp.com/developer) |
| **NPM Package** | [postmark](https://www.npmjs.com/package/postmark) |
| **Support** | [postmarkapp.com/support](https://postmarkapp.com/support) |
| **Blacklist Check** | [postmarkapp.com/blacklist-check](https://postmarkapp.com/blacklist-check) |

---

**Questions?** Postmark has world-class support - use in-app chat or email support@postmarkapp.com.
