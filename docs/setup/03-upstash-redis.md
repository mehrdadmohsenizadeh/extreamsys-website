# Upstash Redis Setup Guide
**Zero-to-Hero | Rate Limiting & Caching**

---

## What is Upstash Redis?

Upstash is a **serverless Redis database** that:
- **Edge-compatible**: Works with Vercel Edge Functions
- **Durable**: Data persists (not just cache)
- **Pay-per-request**: No monthly fees, only pay for what you use
- **Global**: Sub-10ms latency worldwide via replicas

**Why Redis?** Perfect for rate limiting because:
- Atomic counters (no race conditions)
- Built-in expiration (sliding windows)
- Ultra-fast (in-memory storage)

---

## Step 1: Create Upstash Account

### 1.1 Sign Up
1. Go to [console.upstash.com](https://console.upstash.com)
2. Click **"Sign Up"**
3. Choose sign-up method:
   - **GitHub** (recommended - single sign-on)
   - **Google**
   - **Email/Password**
4. Complete registration

**Free tier includes:**
- 10,000 commands/day
- 256 MB storage
- Global replication

---

## Step 2: Create Redis Database

### 2.1 Create Database
1. In Upstash console, click **"Create Database"**
2. Fill in the form:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `extreamsys-prod` | Descriptive name for production |
| **Region** | **US-West** (us-west-1) | Closest to San Diego |
| **Type** | **Regional** | Cheaper, sufficient for single-region |
| **Eviction** | **Disabled** | We need data persistence |
| **TLS** | **Enabled** | Always use encryption |

**Regional vs Global:**
- **Regional**: Single region, lower cost, <10ms latency
- **Global**: Multi-region replicas, higher cost, <5ms latency globally

**For ExtreamSys:** Use **Regional** (US-West) - perfect for San Diego traffic.

### 2.2 Click "Create"

Database will be ready in ~10 seconds.

---

## Step 3: Get Connection Credentials

### 3.1 Navigate to Database Details
1. Click on your newly created database (`extreamsys-prod`)
2. You'll see the database dashboard

### 3.2 Find REST API Credentials
Scroll down to **"REST API"** section. You'll see:

#### UPSTASH_REDIS_REST_URL
```
https://us1-proper-koala-12345.upstash.io
```

#### UPSTASH_REDIS_REST_TOKEN
```
AXXXAbQgLong-Token-String-Here-XXXXXXX==
```

**⚠️ Security:**
- **Never commit these to git**
- **Store only in environment variables**
- Token has full read/write access to your database

### 3.3 Copy Credentials
Click **"Copy"** buttons to save both values.

---

## Step 4: Add Credentials to Vercel

### 4.1 In Vercel Dashboard
1. Go to your project: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Settings → Environment Variables**
3. Add these two variables:

#### Variable 1: REST URL
```
Name: UPSTASH_REDIS_REST_URL
Value: [paste your REST URL]
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variable 2: REST Token
```
Name: UPSTASH_REDIS_REST_TOKEN
Value: [paste your REST token]
Environments: ✓ Production  ✓ Preview  ✓ Development
```

### 4.2 Redeploy
After adding variables, trigger a redeploy:
```bash
vercel --prod
```

Or push a commit to trigger automatic deployment.

---

## Step 5: Test Redis Connection

### 5.1 Test via Upstash Console
1. In Upstash dashboard, click **"CLI"** tab
2. Run a test command:
   ```redis
   SET test "Hello from Upstash"
   GET test
   ```

**Expected output:**
```
"Hello from Upstash"
```

### 5.2 Test via API (Development)
Create a test API route:

**File:** `app/api/test-redis/route.ts`
```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Test write
    await redis.set("test-key", "Hello from ExtreamSys", { ex: 60 });

    // Test read
    const value = await redis.get("test-key");

    // Test increment (for rate limiting)
    const count = await redis.incr("test-counter");

    return NextResponse.json({
      success: true,
      value,
      count,
      message: "Redis connection successful!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

### 5.3 Test Locally
```bash
npm run dev
```

Visit: `http://localhost:3000/api/test-redis`

**Expected response:**
```json
{
  "success": true,
  "value": "Hello from ExtreamSys",
  "count": 1,
  "message": "Redis connection successful!"
}
```

---

## Step 6: Understanding Rate Limiting Strategy

Our implementation uses **sliding window** rate limiting:

### 6.1 Sliding Window Algorithm
```
Time:     0s    15s    30s    45s    60s
Requests: [1] → [2] → [3] → [4] → [5] → BLOCK
                                    ↑
                                  Limit: 5/60min
```

**How it works:**
1. Each request increments counter: `rate-limit:contact:{IP}`
2. Counter expires after window (60 minutes)
3. If counter exceeds limit (5), request is blocked

**Why sliding window?**
- **Smooth traffic**: No burst at window reset
- **Fair**: Spreads requests evenly over time
- **Accurate**: Counts exact request times

### 6.2 Penalty Box
For repeat offenders, we use a **penalty box**:

```
Violations: 1st     2nd     3rd     → PENALTY BOX
Duration:   1hr     1hr     1hr     → Block for 1hr
```

**Keys in Redis:**
- `penalty:{IP}` → Violation count (expires in 1 hour)
- If violations ≥ 3 → All requests blocked for 1 hour

---

## Step 7: Monitor Redis Usage

### 7.1 Upstash Dashboard Metrics
1. In Upstash console, click on your database
2. Click **"Metrics"** tab

**Key metrics:**
- **Daily Requests**: Total commands executed
- **Storage Usage**: Memory consumed
- **Throughput**: Requests per second
- **Latency**: P50, P95, P99 response times

### 7.2 Set Up Alerts
1. Click **"Alerts"** (if available in your plan)
2. Create alerts for:
   - **Daily requests > 8,000** (approaching free tier limit)
   - **Storage > 200 MB** (approaching limit)
   - **High latency > 100ms** (performance degradation)

### 7.3 View Real-Time Data
```bash
# In Upstash CLI tab
KEYS *
```

**Expected keys:**
```
ratelimit:contact:{IP}
penalty:{IP}
logs:ratelimit:*
```

---

## Understanding Redis Data Structures

### Rate Limiting Keys
```redis
# Key format:
ratelimit:contact:192.168.1.1

# Value: Number of requests in current window
GET ratelimit:contact:192.168.1.1
→ "3"

# TTL: Seconds until key expires
TTL ratelimit:contact:192.168.1.1
→ 2145 (35 minutes remaining)
```

### Penalty Box Keys
```redis
# Key format:
penalty:192.168.1.1

# Value: Number of violations
GET penalty:192.168.1.1
→ "2"

# TTL: Seconds until penalty expires
TTL penalty:192.168.1.1
→ 1800 (30 minutes)
```

### Audit Logs (Optional)
```redis
# Key format:
logs:ratelimit:rate_limit_blocked:1736965200000

# Value: JSON event data
GET logs:ratelimit:rate_limit_blocked:1736965200000
→ '{"type":"rate_limit_blocked","identifier":"192.168.1.1",...}'
```

---

## Advanced Configuration

### 8.1 Adjust Rate Limits
Edit `lib/utils/rate-limit.ts`:

```typescript
// More permissive (10 per hour)
export const contactRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 m"),
  // ...
});

// More restrictive (3 per hour)
export const contactRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 m"),
  // ...
});
```

**Recommended starting values:**
- **Contact form**: 5 per 60 minutes
- **Newsletter**: 3 per 60 minutes
- **Global API**: 100 per 15 minutes

### 8.2 Custom Windows
```typescript
// Different time windows
Ratelimit.slidingWindow(10, "10 s")  // 10 per 10 seconds
Ratelimit.slidingWindow(50, "1 h")   // 50 per hour
Ratelimit.slidingWindow(1000, "1 d") // 1000 per day
```

### 8.3 Per-User Rate Limiting
Instead of IP-based, use email:

```typescript
const identifier = email; // Instead of IP
const result = await contactRateLimit.limit(identifier);
```

**Pros:** Can't be bypassed with VPN
**Cons:** Requires valid email before rate limiting

---

## Cost Management

### Free Tier Limits
- **10,000 commands/day** (~7 commands/minute)
- **256 MB storage**
- **Global replication**: Not included

**Typical usage (ExtreamSys):**
| Action | Commands | Daily Usage |
|--------|----------|-------------|
| Contact form submission | 5 | 250 (50 forms/day) |
| Rate limit check | 2 | 100 (50 checks) |
| Penalty box check | 1 | 50 |
| **Total** | | **400/day** |

**Conclusion:** Free tier is **more than sufficient**.

### Paid Tier (if needed)
- **$0.20 per 100K commands**
- No storage fees (included)
- Global replication available

**Cost example:**
- 50,000 commands/day = 1.5M/month
- Cost: ~$3/month

---

## Security Best Practices

### ✅ DO:
- Use TLS for all connections (enabled by default)
- Rotate REST tokens every 90 days
- Monitor for unusual access patterns
- Set appropriate TTLs (don't store data indefinitely)

### ❌ DON'T:
- Expose REST token in frontend code
- Disable TLS
- Store sensitive user data without encryption
- Use same database for dev/staging/prod

---

## Troubleshooting

### Issue: "Connection timeout"
**Solutions:**
1. Verify REST URL is correct (no typos)
2. Check Vercel region matches Upstash region (reduce latency)
3. Test connection from Upstash console CLI

### Issue: "Authentication failed"
**Solutions:**
1. Verify REST token is correct (copy again from Upstash)
2. Check token is not expired (tokens don't expire, but can be revoked)
3. Ensure no extra whitespace in environment variable

### Issue: "High latency (>100ms)"
**Solutions:**
1. Move database closer to Vercel Edge region (recreate in same region)
2. Use Global database for multi-region traffic
3. Check if free tier limits are hit (throttling)

### Issue: "Keys not expiring"
**Solutions:**
1. Verify TTL is set: `redis.set(key, value, { ex: 3600 })`
2. Check eviction policy is **disabled** (we want persistence)
3. Manually check TTL: `redis.ttl(key)`

---

## Maintenance Tasks

### Weekly
- [ ] Review metrics (daily requests, storage)
- [ ] Check for unusual patterns (spike in penalty box additions)

### Monthly
- [ ] Review rate limit thresholds (too strict? too lenient?)
- [ ] Audit keys (delete old test keys)
- [ ] Check cost (if approaching free tier limit)

### Quarterly
- [ ] Rotate REST token (security best practice)
- [ ] Review access logs (who's accessing API)

---

## Next Steps

1. ✅ Upstash Redis is configured
2. → Continue to: `04-postmark.md` (email delivery)
3. → Then: `05-neon-database.md` (database setup - Phase 2+)

---

## Quick Reference

| Resource | URL |
|----------|-----|
| **Console** | [console.upstash.com](https://console.upstash.com) |
| **Docs** | [docs.upstash.com/redis](https://docs.upstash.com/redis) |
| **NPM Package** | [@upstash/redis](https://www.npmjs.com/package/@upstash/redis) |
| **Rate Limit Package** | [@upstash/ratelimit](https://www.npmjs.com/package/@upstash/ratelimit) |

---

**Questions?** Upstash has excellent docs and responsive Discord community.
