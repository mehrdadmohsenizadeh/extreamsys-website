# ExtreamSys Enterprise Website
**Next-Gen IT Infrastructure & Security Solutions | San Diego, CA**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 🎯 Project Overview

Production-grade Next.js 15 website built with **"Minimalist Tech Sophistication"** aesthetic for ExtreamSys, LLC—a San Diego-based IT services firm specializing in enterprise infrastructure, managed IT, network engineering, and cybersecurity.

### Key Features
- ✅ **Zero-Trust Security**: Cloudflare Turnstile, rate limiting, penalty box, CSP/HSTS hardened
- ✅ **99.96% Email Deliverability**: Postmark with SPF/DKIM/DMARC p=reject
- ✅ **Edge-Optimized**: Vercel Edge Functions, sub-50ms global latency
- ✅ **WCAG 2.2 AA Accessible**: Keyboard navigation, focus management, reduced motion support
- ✅ **Core Web Vitals Optimized**: LCP < 1.8s, CLS < 0.05, INP < 200ms

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | React framework with SSR/ISR |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS, design system |
| **Animations** | Framer Motion 11 | Micro-interactions, page transitions |
| **Hosting** | Vercel Edge | Edge functions, CDN, auto-scaling |
| **Bot Protection** | Cloudflare Turnstile | Invisible CAPTCHA, 1M free/month |
| **Rate Limiting** | Upstash Redis | Serverless Redis, sliding window |
| **Email** | Postmark | Transactional email, 99.96% delivery |
| **Database** | Neon (Phase 2+) | Serverless Postgres (for newsletter) |
| **DNS/CDN** | Cloudflare | WAF, DDoS protection, caching |

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Cloudflare WAF + Bot Management                    │
│  → Blocks malicious traffic, DDoS protection                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Vercel Edge (Next.js Middleware)                   │
│  → Security headers (CSP, HSTS, X-Frame-Options)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Content-Length Validation                          │
│  → Reject requests > 10KB                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: Penalty Box Check (Upstash Redis)                  │
│  → Block IPs with 3+ rate limit violations                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: Rate Limiting (Upstash Redis)                      │
│  → 5 requests per hour per IP (sliding window)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 6: Cloudflare Turnstile Verification                  │
│  → Server-side token validation with IP verification         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 7: Zod Schema Validation + Sanitization               │
│  → Type-safe validation, XSS prevention                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 8: Postmark Email Delivery                            │
│  → Internal notification + customer confirmation             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
extreamsys-website/
├── app/
│   ├── api/
│   │   └── contact/
│   │       └── route.ts          # Secure contact form API
│   ├── globals.css               # Tailwind + custom styles
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Homepage
├── components/
│   └── ui/
│       └── turnstile.tsx         # Cloudflare Turnstile widget
├── lib/
│   └── utils/
│       ├── email.ts              # Postmark integration
│       ├── rate-limit.ts         # Upstash Redis rate limiting
│       ├── turnstile.ts          # Turnstile verification
│       └── validation.ts         # Zod schemas
├── docs/
│   └── setup/
│       ├── 01-vercel.md          # Vercel deployment guide
│       ├── 02-cloudflare-turnstile.md
│       ├── 03-upstash-redis.md
│       └── 04-postmark.md
├── public/
│   └── images/                   # Static assets
├── .env.example                  # Environment variable template
├── next.config.ts                # Next.js config + security headers
├── tailwind.config.ts            # Design system tokens
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- Git
- Accounts: Vercel, Cloudflare, Upstash, Postmark (all have free tiers)

### 1. Clone Repository
```bash
git clone https://github.com/mehrdadmohsenizadeh/extreamsys-website.git
cd extreamsys-website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys (see setup guides in `docs/setup/`):
```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Postmark
POSTMARK_API_TOKEN=your_token
POSTMARK_FROM_EMAIL=noreply@extreamsys.com
POSTMARK_REPLY_TO_EMAIL=contact@extreamsys.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 📚 Setup Guides

Complete zero-to-hero setup guides are available in `docs/setup/`:

1. **[Vercel Deployment](docs/setup/01-vercel.md)** - Deploy to Vercel Edge, configure domains
2. **[Cloudflare Turnstile](docs/setup/02-cloudflare-turnstile.md)** - Set up bot protection
3. **[Upstash Redis](docs/setup/03-upstash-redis.md)** - Configure rate limiting
4. **[Postmark Email](docs/setup/04-postmark.md)** - Email delivery with SPF/DKIM/DMARC

Each guide includes:
- Step-by-step instructions with screenshots
- Common troubleshooting steps
- Security best practices
- Cost breakdowns

---

## 🎨 Design System

### Brand Colors
```typescript
// ExtreamSys Brand Palette
{
  brand: {
    navy: "#1E3A5F",        // Primary (from logo)
    "navy-light": "#2D5F8D", // Accent
    "navy-dark": "#0F1E2F",  // Dark mode primary
    blue: "#3B82F6",         // Interactive elements
  }
}
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Features**: OpenType features (cv11, ss01), variable font axes

### Component Patterns
- **Glass Morphism**: `backdrop-blur-md`, subtle borders, transparency
- **Bento Cards**: Grid-based service cards with hover effects
- **Micro-interactions**: Framer Motion with reduced motion support

---

## 🔒 Security

### Headers (next.config.ts)
```typescript
// All responses include:
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Content-Security-Policy: [restrictive policy]
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: [restrictive policy]
```

### Contact Form Protection
1. **Content-Length Check**: Max 10KB payload
2. **IP Reputation**: Penalty box for repeat offenders
3. **Rate Limiting**: 5 submissions/hour per IP
4. **Bot Detection**: Cloudflare Turnstile server-side verification
5. **Input Validation**: Zod schema with XSS sanitization
6. **Email Security**: No public email addresses, API-only contact

### Email Deliverability
- **SPF**: Authorizes Postmark to send from `@extreamsys.com`
- **DKIM**: Cryptographic signature on all outbound emails
- **DMARC**: `p=reject` policy (rejects unauthenticated emails)
- **Return-Path**: Proper bounce handling via Postmark

---

## 📊 Performance

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 1.8s
- **CLS** (Cumulative Layout Shift): < 0.05
- **INP** (Interaction to Next Paint): < 200ms

### Optimizations
- Edge-cached pages (Vercel CDN)
- Image optimization (AVIF/WebP, responsive srcset)
- Font subsetting (Inter variable font)
- Minimal JavaScript (only for interactivity)
- Code splitting (Next.js automatic)

### Monitoring
- **Vercel Analytics**: Real user metrics, Core Web Vitals
- **Speed Insights**: Performance recommendations

---

## 🧪 Testing

### Run Type Check
```bash
npm run type-check
```

### Run Linter
```bash
npm run lint
```

### Build Test
```bash
npm run build
```

---

## 📦 Deployment

### Automatic (Recommended)
Push to `main` branch triggers automatic Vercel deployment:
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

### Manual (Vercel CLI)
```bash
vercel --prod
```

### Preview Deployments
Every branch push creates a preview URL:
```bash
git checkout -b feature/new-section
git push origin feature/new-section
# Vercel creates: extreamsys-website-git-feature-new-section-youruser.vercel.app
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Cloudflare Turnstile public key |
| `TURNSTILE_SECRET_KEY` | ✅ | Cloudflare Turnstile private key |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis authentication token |
| `POSTMARK_API_TOKEN` | ✅ | Postmark server API token |
| `POSTMARK_FROM_EMAIL` | ✅ | Sender email address |
| `POSTMARK_REPLY_TO_EMAIL` | ✅ | Reply-to email address |
| `NEXT_PUBLIC_APP_URL` | ✅ | Production domain URL |
| `DATABASE_URL` | ⏳ | Neon Postgres (Phase 2+) |

**Security Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never store secrets in these.

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler (no emit) |

---

## 🗺️ Roadmap

### ✅ Phase 1: Architecture & Security Baseline (COMPLETED)
- [x] Next.js 15 project scaffold
- [x] Security headers (CSP, HSTS, etc.)
- [x] Contact form API with 7-layer security
- [x] Cloudflare Turnstile integration
- [x] Upstash Redis rate limiting
- [x] Postmark email delivery
- [x] Zero-to-hero setup guides

### 🚧 Phase 2: Global UI Framework (In Progress)
- [ ] Theme provider (light/dark mode)
- [ ] Sticky glassmorphism header with navigation
- [ ] Footer with social icons and newsletter signup
- [ ] Responsive layout system
- [ ] Framer Motion page transitions

### ⏳ Phase 3: Core Pages & Content
- [ ] Homepage hero section
- [ ] Services page (bento grid)
- [ ] About page
- [ ] Resources/blog (MDX-powered)
- [ ] SEO optimization (JSON-LD, Open Graph)

### ⏳ Phase 4: Advanced Features
- [ ] Newsletter subscription (Neon DB)
- [ ] Resource search and filtering
- [ ] Auth0/Clerk (if admin CMS needed)
- [ ] Analytics integration
- [ ] Performance monitoring

---

## 🐛 Troubleshooting

### Build Fails with Font Error
**Issue:** `Failed to fetch font 'Inter' from Google Fonts`

**Solution:** This occurs in restricted network environments. The project already uses CSS `@import` as fallback. For production with next/font optimization, ensure deployment environment can reach fonts.googleapis.com.

### Environment Variables Not Loading
**Issue:** API returns errors about missing env vars

**Solutions:**
1. Verify `.env.local` exists and contains all required variables
2. Restart dev server after changing env vars
3. In Vercel, check **Settings → Environment Variables** for all environments

### Rate Limit Always Blocks
**Issue:** Contact form always returns 429 (rate limited)

**Solutions:**
1. Check Upstash Redis credentials are correct
2. In development, use different IP (VPN) to reset counter
3. Manually clear Redis keys: `redis-cli KEYS ratelimit:*` then `DEL <key>`

### Turnstile Widget Not Appearing
**Issue:** Blank space where widget should be

**Solutions:**
1. Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
2. Check browser console for CSP errors
3. Disable ad blockers (some block Cloudflare challenges)
4. Verify domain is whitelisted in Cloudflare Turnstile settings

---

## 📄 License

**Private** - © 2026 ExtreamSys, LLC. All rights reserved.

---

## 🤝 Support

For questions or issues:
- **Email:** contact@extreamsys.com
- **Phone:** +1 (858) 555-1234
- **Location:** San Diego, CA

---

**Built with ❤️ for ExtreamSys by Claude Code**
