# Vercel Deployment Setup Guide
**Zero-to-Hero | ExtreamSys Website**

---

## What is Vercel?

Vercel is a cloud platform optimized for deploying Next.js applications with:
- **Edge Functions**: Sub-50ms response times globally
- **Automatic CDN**: Your site is cached at 100+ edge locations
- **Preview Deployments**: Every git push gets a unique URL for testing
- **Zero Configuration**: Works perfectly with Next.js out of the box

**Cost:** Free tier includes 100GB bandwidth, unlimited sites, and analytics.

---

## Step 1: Create Your Vercel Account

### 1.1 Sign Up
1. Go to [vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"** (recommended for git integration)
3. Authorize Vercel to access your GitHub account
4. Complete your profile

### 1.2 Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
vercel login
```

**Why?** The CLI lets you deploy from your terminal and manage environment variables easily.

---

## Step 2: Connect Your GitHub Repository

### 2.1 From Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select **mehrdadmohsenizadeh/extreamsys-website**
4. Click **"Import"**

### 2.2 Configure Project Settings
Vercel will auto-detect Next.js. Verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node Version** | 20.x (automatic) |

**Don't deploy yet!** We need to add environment variables first.

---

## Step 3: Configure Domain (extreamsys.com)

### 3.1 Add Domain to Vercel
1. In your Vercel project dashboard, go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `extreamsys.com`
4. Click **"Add"**

### 3.2 Configure DNS in Cloudflare

Since your domain is managed by Cloudflare, you need to update DNS records:

#### Option A: A Records (Recommended for Cloudflare Proxy)
Add these A records in Cloudflare DNS:

| Type | Name | Value | Proxy Status |
|------|------|-------|--------------|
| A | @ | `76.76.19.19` | Proxied (orange cloud) |
| A | www | `76.76.19.19` | Proxied (orange cloud) |

#### Option B: CNAME (Alternative)
| Type | Name | Value | Proxy Status |
|------|------|-------|--------------|
| CNAME | @ | `cname.vercel-dns.com` | Proxied |
| CNAME | www | `cname.vercel-dns.com` | Proxied |

**Important:** Keep Cloudflare proxy **ENABLED** (orange cloud) for WAF protection.

### 3.3 Verify Domain
- Back in Vercel, click **"Refresh"** next to your domain
- Status should change to **"Valid Configuration"** (may take 5-10 minutes)

### 3.4 SSL Certificate
- Vercel automatically provisions SSL certificates via Let's Encrypt
- Certificate renewal is automatic
- Your site will be accessible at `https://extreamsys.com` within 24 hours

---

## Step 4: Environment Variables

### 4.1 In Vercel Dashboard
1. Go to **Settings → Environment Variables**
2. Add each variable from your `.env.example` file
3. For each variable, select environments: **Production**, **Preview**, **Development**

### 4.2 Required Variables for Phase 1

Add these now (you'll get the actual values from other setup guides):

```bash
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<from Cloudflare setup>
TURNSTILE_SECRET_KEY=<from Cloudflare setup>

# Upstash Redis
UPSTASH_REDIS_REST_URL=<from Upstash setup>
UPSTASH_REDIS_REST_TOKEN=<from Upstash setup>

# Postmark
POSTMARK_API_TOKEN=<from Postmark setup>
POSTMARK_FROM_EMAIL=noreply@extreamsys.com
POSTMARK_REPLY_TO_EMAIL=contact@extreamsys.com

# Application
NEXT_PUBLIC_APP_URL=https://extreamsys.com
NODE_ENV=production
```

**Security Note:**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Others are server-side only (never sent to client)

### 4.3 CLI Method (Alternative)
```bash
# From your project directory
vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY production
vercel env add TURNSTILE_SECRET_KEY production
# ... repeat for each variable
```

---

## Step 5: Deploy to Production

### 5.1 Trigger Deployment
Once environment variables are set:

1. Go to **Deployments** tab
2. Click **"Deploy"** or trigger from GitHub:
   ```bash
   git add .
   git commit -m "feat: initial deployment configuration"
   git push origin claude/enterprise-website-architecture-mUQWr
   ```

### 5.2 Monitor Deployment
- Watch real-time logs in Vercel dashboard
- Deployment typically takes 60-90 seconds
- Status indicators:
  - **Building**: Compiling your Next.js app
  - **Uploading**: Sending to edge network
  - **Ready**: Live at your domain

### 5.3 Verify Deployment
1. Visit `https://extreamsys.com`
2. Open DevTools → Network tab
3. Check headers for security configuration:
   ```
   strict-transport-security: max-age=63072000
   content-security-policy: [should be present]
   x-frame-options: DENY
   ```

---

## Step 6: Preview Deployments (Automatic)

Every time you push to a branch, Vercel creates a preview deployment:

```bash
git checkout -b feature/new-hero-section
# ... make changes ...
git commit -m "feat: update hero section"
git push origin feature/new-hero-section
```

- Vercel automatically deploys to: `extreamsys-website-git-feature-new-hero-mehrdadmohsenizadeh.vercel.app`
- Comment appears in your GitHub PR with preview URL
- Preview deployments have same environment variables as production

---

## Step 7: Configure Project Settings

### 7.1 Edge Functions Region
1. Go to **Settings → Functions**
2. Set **Edge Function Region**: `iad1` (Washington DC - closest to San Diego)
3. Click **Save**

**Why?** Minimizes latency for API routes.

### 7.2 Build & Output Settings
Keep defaults:
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 7.3 Security Settings
1. Go to **Settings → Security**
2. Enable **"Vercel Authentication"** for preview deployments (optional)
3. Enable **"Deployment Protection"** (prevents accidental public previews)

---

## Step 8: Analytics & Monitoring

### 8.1 Enable Web Analytics
1. Go to **Analytics** tab
2. Click **"Enable Web Analytics"**
3. This tracks Core Web Vitals, page views, and performance metrics

### 8.2 Speed Insights
- Automatically enabled for all deployments
- Measures real user performance metrics
- Access at: `vercel.com/[your-project]/analytics`

---

## Common Issues & Troubleshooting

### Issue: "Domain Not Verified"
**Solution:**
- Wait 10-15 minutes for DNS propagation
- Verify Cloudflare DNS records match Vercel's requirements
- Run `dig extreamsys.com` to check DNS resolution

### Issue: "Build Failed"
**Solution:**
- Check **Deployment Logs** in Vercel
- Common causes:
  - Missing environment variables
  - TypeScript errors
  - Missing dependencies
- Run `npm run build` locally first to debug

### Issue: "Environment Variables Not Working"
**Solution:**
- Verify variables are added to **all environments** (Production, Preview, Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Issue: "SSL Certificate Pending"
**Solution:**
- Wait up to 24 hours for initial certificate
- Ensure DNS is pointing to Vercel
- Check Cloudflare SSL mode: should be **"Full (strict)"**

---

## Security Checklist

- [ ] Environment variables are set (not committed to git)
- [ ] Domain is using HTTPS
- [ ] Cloudflare proxy is enabled (orange cloud)
- [ ] Preview deployments are protected (if desired)
- [ ] Build logs don't expose secrets
- [ ] `.env` files are in `.gitignore`

---

## Next Steps

1. ✅ Vercel is configured
2. → Continue to: `02-cloudflare-turnstile.md` (bot protection)
3. → Then: `03-upstash-redis.md` (rate limiting)
4. → Then: `04-postmark.md` (email delivery)

---

## Quick Reference

| Action | Command/URL |
|--------|-------------|
| **Deploy from CLI** | `vercel --prod` |
| **View logs** | `vercel logs [deployment-url]` |
| **Manage env vars** | `vercel env ls` |
| **Dashboard** | [vercel.com/dashboard](https://vercel.com/dashboard) |
| **Docs** | [vercel.com/docs](https://vercel.com/docs) |

---

**Questions?** Check Vercel docs or contact their support (excellent response times).
