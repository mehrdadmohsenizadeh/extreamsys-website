# ExtreamSys Website Architecture
**Technical Deep Dive | Phase 1: Security & Foundation**

---

## 🏛️ System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        END USERS                              │
│         (Desktop, Mobile, Tablets - Global Access)            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE (DNS + CDN)                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ • WAF (Web Application Firewall)                      │    │
│  │ • Bot Management                                      │    │
│  │ • DDoS Protection (Unlimited)                         │    │
│  │ • DNS Management                                      │    │
│  │ • SSL/TLS Termination                                 │    │
│  │ • Edge Caching (Static Assets)                        │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Origin Pull
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ • 100+ Edge Locations Worldwide                       │    │
│  │ • Automatic CDN                                       │    │
│  │ • Edge Functions (API Routes)                         │    │
│  │ • Next.js 15 App Router                               │    │
│  │ • Serverless Functions (0-cold-start)                 │    │
│  └──────────────────────────────────────────────────────┘    │
└─────┬──────────────────┬──────────────────┬─────────────────┘
      │                  │                  │
      │ Contact API      │ Rate Limit       │ Email Send
      ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────┐
│  Turnstile  │  │ Upstash Redis   │  │  Postmark   │
│  Verify API │  │ (Rate Limiting) │  │   (Email)   │
│ (Cloudflare)│  │  - Sliding Win. │  │ - SMTP Send │
└─────────────┘  │  - Penalty Box  │  │ - Webhooks  │
                 │  - Audit Logs   │  └─────────────┘
                 └─────────────────┘
```

---

## 🔒 Security Architecture

### Defense in Depth Strategy

#### Layer 1: Network Security (Cloudflare)
**Purpose:** Block malicious traffic before it reaches your infrastructure

**Components:**
- **WAF Rules**: OWASP Top 10 protection, SQL injection, XSS blocking
- **Bot Management**: Machine learning-based bot detection
- **Rate Limiting**: Global rate limits (10,000 requests/minute)
- **DDoS Mitigation**: Automatic traffic scrubbing, 100 Tbps capacity

**Configuration:**
```javascript
// Cloudflare Firewall Rules
- Block countries: High-risk countries (optional)
- Challenge on threat score > 14
- Block known malicious IPs (crowdsourced threat intelligence)
```

#### Layer 2: Application Security (Next.js/Vercel)
**Purpose:** Secure headers, input validation, CSP enforcement

**Security Headers:**
```typescript
// next.config.ts
headers: [
  {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; ...",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  }
]
```

**Why Each Header:**
- **HSTS**: Forces HTTPS for 2 years, prevents SSL stripping attacks
- **CSP**: Whitelists allowed content sources, prevents XSS
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type**: Prevents MIME sniffing attacks
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Disables unnecessary browser APIs

#### Layer 3: Contact Form Security
**7-Layer Protection Model:**

```typescript
// app/api/contact/route.ts

export async function POST(request: NextRequest) {
  // LAYER 1: Content-Length Validation (10KB max)
  if (contentLength > 10000) return 413;

  // LAYER 2: IP Extraction & Penalty Box Check
  const clientIP = getClientIP(request.headers);
  if (await checkPenaltyBox(clientIP)) return 429;

  // LAYER 3: Rate Limiting (5 per hour per IP)
  const rateLimit = await contactRateLimit.limit(clientIP);
  if (!rateLimit.success) {
    await addToPenaltyBox(clientIP);
    return 429;
  }

  // LAYER 4: Parse & Sanitize Input
  const sanitized = sanitizeFormData(await request.json());

  // LAYER 5: Turnstile Verification (bot detection)
  const turnstile = await verifyTurnstileToken(token, clientIP);
  if (!turnstile.success) return 400;

  // LAYER 6: Zod Schema Validation
  const validation = contactFormSchema.safeParse(sanitized);
  if (!validation.success) return 400;

  // LAYER 7: Email Delivery (Postmark)
  await sendContactFormNotification(data);
  await sendContactFormConfirmation(data.email, data.name);

  return 200;
}
```

---

## 📊 Data Flow Diagrams

### Contact Form Submission Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  1. User fills contact form                                     │
│  2. Turnstile widget loads (challenges if suspicious)           │
│  3. On submit: POST /api/contact with form data + token         │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           │ HTTPS Request
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                   VERCEL EDGE FUNCTION                          │
│  /app/api/contact/route.ts                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 1: Content-Length Check                          │      │
│  │   → Validate payload < 10KB                           │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 2: Extract IP & Check Penalty Box               │      │
│  │   → Query Redis: penalty:{IP}                         │  ────┼──→ Upstash
│  │   → If violations >= 3: BLOCK                         │      │   Redis
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 3: Rate Limiting (Sliding Window)               │      │
│  │   → Check Redis: ratelimit:contact:{IP}              │  ────┼──→ Upstash
│  │   → If > 5 in past 60min: BLOCK                      │      │   Redis
│  │   → Increment counter, set 60min TTL                 │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 4: Sanitize Input (XSS Prevention)              │      │
│  │   → Remove <script>, javascript:, event handlers     │      │
│  │   → Normalize whitespace                             │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 5: Turnstile Verification                        │      │
│  │   → POST https://challenges.cloudflare.com/...        │  ────┼──→ Cloudflare
│  │   → Verify token, check IP match                     │      │   Turnstile
│  │   → If invalid: REJECT                               │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 6: Zod Schema Validation                         │      │
│  │   → Type-safe validation                             │      │
│  │   → Email format, name regex, message length         │      │
│  │   → If invalid: Return 400 with error details        │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 7: Send Emails via Postmark                      │      │
│  │   → Internal notification to contact@extreamsys.com  │  ────┼──→ Postmark
│  │   → Customer confirmation to user's email            │      │   SMTP
│  │   → Log delivery events                              │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Step 8: Audit Logging                                 │      │
│  │   → Store event in Redis: logs:ratelimit:*           │  ────┼──→ Upstash
│  │   → TTL: 24 hours                                    │      │   Redis
│  └────────────────┬─────────────────────────────────────┘      │
│                   ▼                                              │
│  Return 200 OK with success message                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ JSON Response
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│  Display success message:                                       │
│  "Thank you! We'll be in touch within 1-2 business days."       │
└────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Storage

### Upstash Redis Schema

#### Rate Limiting Keys
```redis
# Contact form rate limit
Key:   ratelimit:contact:{IP_ADDRESS}
Value: {integer} - Request count in current window
TTL:   3600 seconds (60 minutes)

Example:
  Key: ratelimit:contact:192.168.1.100
  Value: 3
  TTL: 2145 (35 minutes remaining)
```

#### Penalty Box Keys
```redis
# Repeat offender tracking
Key:   penalty:{IP_ADDRESS}
Value: {integer} - Number of rate limit violations
TTL:   3600 seconds (1 hour)

Example:
  Key: penalty:192.168.1.100
  Value: 2
  TTL: 1800 (30 minutes remaining)

Threshold: violations >= 3 → All requests blocked for 1 hour
```

#### Audit Log Keys
```redis
# Event logging for monitoring
Key:   logs:ratelimit:{EVENT_TYPE}:{TIMESTAMP}
Value: {JSON} - Event details
TTL:   86400 seconds (24 hours)

Example:
  Key: logs:ratelimit:rate_limit_blocked:1736965200000
  Value: {
    "type": "rate_limit_blocked",
    "identifier": "192.168.1.100",
    "endpoint": "/api/contact",
    "remaining": 0,
    "limit": 5,
    "reset": 1736968800000,
    "timestamp": "2026-01-15T10:30:00Z"
  }
  TTL: 86400
```

---

## 📧 Email Architecture

### Postmark Integration

#### Email Flow
```
┌──────────────────────┐
│  Vercel Edge Fn      │
│  /api/contact        │
└─────────┬────────────┘
          │
          │ (1) Internal Notification
          ▼
┌────────────────────────────────────────┐
│        POSTMARK API                     │
│  POST /email                            │
│  {                                      │
│    From: "noreply@extreamsys.com",     │
│    To: "contact@extreamsys.com",       │
│    ReplyTo: "{user_email}",            │
│    Subject: "New Contact Form",         │
│    HtmlBody: "...",                     │
│    Tag: "contact-form"                  │
│  }                                      │
└─────────┬──────────────────────────────┘
          │
          │ SMTP Delivery (SPF/DKIM signed)
          ▼
┌────────────────────────────────────────┐
│   contact@extreamsys.com Inbox         │
│   (Your monitored email)                │
└────────────────────────────────────────┘

          │
          │ (2) Customer Confirmation
          ▼
┌────────────────────────────────────────┐
│        POSTMARK API                     │
│  POST /email                            │
│  {                                      │
│    From: "noreply@extreamsys.com",     │
│    To: "{user_email}",                 │
│    ReplyTo: "contact@extreamsys.com",  │
│    Subject: "Thank You",                │
│    HtmlBody: "...",                     │
│    Tag: "contact-confirmation"          │
│  }                                      │
└─────────┬──────────────────────────────┘
          │
          │ SMTP Delivery
          ▼
┌────────────────────────────────────────┐
│   User's Email Inbox                    │
└────────────────────────────────────────┘
```

#### DNS Configuration (Cloudflare)
```dns
# SPF Record (Sender Policy Framework)
Type: TXT
Name: @
Value: v=spf1 include:spf.mtasv.net ~all
TTL: Auto

# DKIM Record (DomainKeys Identified Mail)
Type: CNAME
Name: 20230115._domainkey.extreamsys.com
Value: 20230115.dkim.postmarkapp.com
TTL: Auto

# Return-Path (Bounce Handling)
Type: CNAME
Name: pm-bounces.extreamsys.com
Value: pm.mtasv.net
TTL: Auto

# DMARC Record (Email Authentication Policy)
Type: TXT
Name: _dmarc.extreamsys.com
Value: v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@extreamsys.com
TTL: Auto
```

**Why These Records Matter:**
- **SPF**: Tells receiving servers "Only Postmark can send email from @extreamsys.com"
- **DKIM**: Cryptographic signature proves email wasn't tampered with
- **DMARC p=reject**: "Reject any email from @extreamsys.com that fails SPF/DKIM"
- **Return-Path**: Routes bounces to Postmark for handling

---

## ⚡ Performance Architecture

### Edge Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Cache Rules (by content type)                      │    │
│  │                                                      │    │
│  │  • HTML (homepage, pages): 5 minutes                │    │
│  │  • Images (png, jpg, webp): 7 days                  │    │
│  │  • Fonts (woff2): 30 days                           │    │
│  │  • CSS/JS (hashed files): 1 year                    │    │
│  │  • API routes: No cache                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL CDN                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Edge Network (100+ locations)                      │    │
│  │                                                      │    │
│  │  • Static pages: Prerendered at build               │    │
│  │  • Dynamic pages: ISR (Incremental Static Regen)    │    │
│  │  • API routes: Edge Functions (sub-50ms)            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Image Optimization Pipeline
```
┌────────────────────┐
│  Original Image    │
│  (png/jpg)         │
│  2MB, 4000x3000    │
└─────────┬──────────┘
          │
          │ Next.js Image Component
          ▼
┌────────────────────────────────────────────────────┐
│         AUTOMATIC TRANSFORMATIONS                   │
│                                                     │
│  1. Format Conversion:                              │
│     → AVIF (if supported) - 50% smaller             │
│     → WebP (fallback) - 30% smaller                 │
│     → Original format (if neither supported)        │
│                                                     │
│  2. Responsive Sizing:                              │
│     → Generate srcset for device sizes              │
│     → 640w, 750w, 828w, 1080w, 1200w, 1920w         │
│                                                     │
│  3. Quality Optimization:                           │
│     → AVIF: quality=80                              │
│     → WebP: quality=85                              │
│     → Original: quality=90                          │
│                                                     │
│  4. Lazy Loading:                                   │
│     → loading="lazy" (native browser)               │
│     → Placeholder blur (LQIP)                       │
└────────────────────────────────────────────────────┘
```

---

## 🔄 Deployment Pipeline

### CI/CD Workflow (Vercel)

```
┌──────────────────────────────────────────────────────────────┐
│                      DEVELOPER                                │
│  git push origin main                                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ GitHub Webhook
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   VERCEL BUILD                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Step 1: Install Dependencies                          │    │
│  │   npm install                                         │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Step 2: Lint & Type Check                             │    │
│  │   npm run lint                                        │    │
│  │   npm run type-check                                  │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Step 3: Build Next.js App                             │    │
│  │   npm run build                                       │    │
│  │   → Compile TypeScript                                │    │
│  │   → Generate optimized bundles                        │    │
│  │   → Prerender static pages                            │    │
│  │   → Optimize images                                   │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Step 4: Upload to Edge Network                        │    │
│  │   → Deploy to 100+ edge locations                     │    │
│  │   → Configure routing rules                           │    │
│  │   → Update environment variables                      │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Step 5: Health Checks                                 │    │
│  │   → Test homepage loads                               │    │
│  │   → Verify API routes respond                         │    │
│  │   → Check Core Web Vitals                             │    │
│  └────────────────┬─────────────────────────────────────┘    │
│                   ▼                                            │
│  Deployment Complete (Total: ~60-90 seconds)                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Deployment URL
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              PRODUCTION (extreamsys.com)                      │
│  Auto-assigned after health checks pass                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 📈 Monitoring & Observability

### Metrics Collection

```
┌────────────────────────────────────────────────────────────┐
│                  PRODUCTION SITE                            │
│             (extreamsys.com)                                │
└──────┬──────────────────────┬──────────────────────────────┘
       │                      │
       │ Real User            │ Server Logs
       │ Monitoring           │
       ▼                      ▼
┌──────────────────┐   ┌─────────────────────┐
│ Vercel Analytics │   │  Vercel Logs        │
│                  │   │                     │
│ • Page views     │   │ • API requests      │
│ • LCP, FID, CLS  │   │ • Error traces      │
│ • Time to First  │   │ • Performance       │
│   Byte           │   │   metrics           │
│ • Visitor geo    │   │ • Rate limit events │
└──────────────────┘   └─────────────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌────────────────────────────────────────────────────────────┐
│              MONITORING DASHBOARD                           │
│  • Core Web Vitals trends                                   │
│  • Error rate tracking                                      │
│  • Rate limit violations                                    │
│  • Email delivery status (Postmark)                         │
└────────────────────────────────────────────────────────────┘
```

### Key Metrics Tracked

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Uptime** | 99.9% | < 99.5% |
| **LCP** | < 1.8s | > 2.5s |
| **CLS** | < 0.05 | > 0.1 |
| **INP** | < 200ms | > 500ms |
| **API Error Rate** | < 0.1% | > 1% |
| **Email Delivery** | > 99% | < 98% |
| **Rate Limit Blocks** | < 100/day | > 500/day |

---

## 🔐 Secrets Management

### Environment Variables (Vercel)

```
┌────────────────────────────────────────────────────────────┐
│              VERCEL DASHBOARD                               │
│  Settings → Environment Variables                           │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ NEXT_PUBLIC_TURNSTILE_SITE_KEY    [Production]     │    │
│  │ TURNSTILE_SECRET_KEY              [Production]     │    │
│  │ UPSTASH_REDIS_REST_URL            [Production]     │    │
│  │ UPSTASH_REDIS_REST_TOKEN          [Production]     │    │
│  │ POSTMARK_API_TOKEN                [Production]     │    │
│  │ POSTMARK_FROM_EMAIL               [Production]     │    │
│  │ POSTMARK_REPLY_TO_EMAIL           [Production]     │    │
│  │ NEXT_PUBLIC_APP_URL               [Production]     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Each variable is:                                          │
│  • Encrypted at rest (AES-256)                              │
│  • Encrypted in transit (TLS 1.3)                           │
│  • Scoped to environments (Production/Preview/Dev)          │
│  • Never logged or exposed in build output                  │
└────────────────────────────────────────────────────────────┘
```

**Security Best Practices:**
1. Rotate secrets every 90 days
2. Use separate keys for Production/Preview/Development
3. Never commit `.env.local` to git
4. Audit environment variable access logs monthly

---

## 🚨 Incident Response

### Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                    ERROR OCCURS                             │
│  (API failure, rate limit block, email failure, etc.)       │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER                              │
│  • Catch error in try/catch block                           │
│  • Log to console (dev) or logging service (prod)           │
│  • Don't expose internal details to user                    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│          GRACEFUL DEGRADATION                               │
│                                                             │
│  API Route Errors:                                          │
│    → Return generic 500 error                               │
│    → "An unexpected error occurred. Please try again."      │
│                                                             │
│  Rate Limit Errors:                                         │
│    → Return 429 with Retry-After header                     │
│    → "Too many requests. Please wait {X} minutes."          │
│                                                             │
│  Validation Errors:                                         │
│    → Return 400 with field-specific errors                  │
│    → "Email address is invalid"                             │
│                                                             │
│  External Service Failures (Postmark, Upstash):             │
│    → Retry with exponential backoff (3 attempts)            │
│    → If all fail: Log error, notify via fallback channel    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│           MONITORING & ALERTING                             │
│  • Error logged to Vercel Logs                              │
│  • If error rate > 1%: Send alert to Slack/Email            │
│  • Track error trends in dashboard                          │
└────────────────────────────────────────────────────────────┘
```

---

## 📚 Additional Resources

- **[Setup Guides](setup/)**: Step-by-step service configuration
- **[README](../README.md)**: Project overview and quick start
- **[Vercel Docs](https://vercel.com/docs)**: Deployment and Edge Functions
- **[Next.js Docs](https://nextjs.org/docs)**: Framework documentation

---

**Last Updated:** January 15, 2026
**Phase:** 1 (Architecture & Security Baseline)
**Status:** ✅ Complete
