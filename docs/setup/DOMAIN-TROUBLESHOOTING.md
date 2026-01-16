# Domain Verification Troubleshooting Guide
**ExtreamSys Website | Vercel + Cloudflare**

---

## 🎯 Current Issue

Domain `extreamsys.com` not verifying in Vercel after adding DNS records.

---

## ✅ Step-by-Step Resolution

### **Step 1: Get YOUR Domain-Specific Values from Vercel**

**CRITICAL:** Don't use generic IPs from guides. Get your unique values.

1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project name
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter: `extreamsys.com`
6. Click **"Add"**

**Vercel will show:**
```
⚠️ Domain Configuration Required

To verify extreamsys.com, add these DNS records:

┌─────────────────────────────────────────────────────┐
│ Option 1: A Record (Recommended)                     │
├─────────────────────────────────────────────────────┤
│ Type: A                                              │
│ Name: @                                              │
│ Value: 76.223.XX.XX  ← YOUR SPECIFIC IP             │
│ TTL: Auto                                            │
└─────────────────────────────────────────────────────┘

OR

┌─────────────────────────────────────────────────────┐
│ Option 2: CNAME Record                               │
├─────────────────────────────────────────────────────┤
│ Type: CNAME                                          │
│ Name: @                                              │
│ Value: cname.vercel-dns.com                          │
│ TTL: Auto                                            │
└─────────────────────────────────────────────────────┘
```

**Screenshot this page** or copy the exact values.

---

### **Step 2: Clear Conflicting DNS Records in Cloudflare**

**BEFORE adding new records**, check for conflicts:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **extreamsys.com**
3. Click **DNS** → **Records**

**Look for and DELETE these if they exist:**
- Any existing `A` record for `@` or `extreamsys.com`
- Any existing `CNAME` record for `@`
- Any parked domain records (often named `@` with IPs like 192.0.2.1)

**Keep these (if present):**
- `MX` records (email)
- `TXT` records (SPF, DKIM, DMARC)
- `CNAME` records for subdomains (like `_domainkey`, `pm-bounces`)

---

### **Step 3: Add Correct DNS Records**

#### **Method A: Using A Record (Recommended)**

1. In Cloudflare DNS, click **"Add record"**
2. Fill in:
   - **Type:** `A`
   - **Name:** `@`
   - **IPv4 address:** `[YOUR IP FROM VERCEL]` (e.g., 76.223.XX.XX)
   - **Proxy status:** **DNS only** (gray cloud) ← IMPORTANT for initial verification
   - **TTL:** Auto
3. Click **"Save"**

4. Add second record for www:
   - **Type:** `A`
   - **Name:** `www`
   - **IPv4 address:** `[SAME IP FROM VERCEL]`
   - **Proxy status:** **DNS only** (gray cloud)
   - **TTL:** Auto
5. Click **"Save"**

#### **Method B: Using CNAME (Alternative)**

If A record doesn't work, try CNAME:

1. In Cloudflare DNS, click **"Add record"**
2. Fill in:
   - **Type:** `CNAME`
   - **Name:** `@`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** **DNS only** (gray cloud) ← Critical!
   - **TTL:** Auto
3. Click **"Save"**

4. Add www subdomain:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** **DNS only** (gray cloud)
   - **TTL:** Auto
5. Click **"Save"**

---

### **Step 4: Wait for DNS Propagation**

**Timing:**
- **Minimum:** 5 minutes (usually sufficient)
- **Average:** 15-30 minutes
- **Maximum:** 48 hours (rare, usually ISP caching)

**Check propagation:**
1. Go to [dnschecker.org](https://dnschecker.org/)
2. Enter: `extreamsys.com`
3. Select: `A` or `CNAME` (whichever you used)
4. Click **"Search"**

**Look for:**
- Green checkmarks across multiple locations
- Values match what you entered in Cloudflare

**If not propagated:**
- Wait 5 more minutes
- Try incognito/private browsing mode
- Clear your browser cache
- Try from a different device/network

---

### **Step 5: Verify in Vercel**

1. Back in Vercel → **Settings** → **Domains**
2. Find `extreamsys.com` in the list
3. Click **"Refresh"** button or **"Verify"**

**Expected result:**
```
✅ extreamsys.com
   Valid Configuration
   SSL Certificate: Provisioning...
```

**If still invalid:**
- Error message will show specific issue
- Common errors below ↓

---

## 🐛 Common Error Messages & Fixes

### **Error: "Invalid Configuration: No A or CNAME record found"**

**Cause:** DNS not propagated yet or wrong values.

**Fix:**
1. Verify records in Cloudflare exactly match Vercel's instructions
2. Wait 10 more minutes
3. Check [dnschecker.org](https://dnschecker.org/) for propagation
4. Ensure you used **DNS only** (gray cloud), not Proxied

---

### **Error: "CNAME already exists"**

**Cause:** Conflicting DNS record.

**Fix:**
1. Go to Cloudflare DNS
2. Search for `@` or `extreamsys.com`
3. Delete ALL existing `CNAME` records for `@`
4. Delete ALL existing `A` records for `@`
5. Re-add using Method A or B above

---

### **Error: "Domain is already in use by another Vercel project"**

**Cause:** Domain previously added to different Vercel account/project.

**Fix:**
1. Check if you have multiple Vercel accounts (personal + work)
2. Search for the domain in all your Vercel projects
3. Remove it from the other project first
4. Then add to current project

---

### **Error: "Verification pending..."** (stays for > 15 minutes)

**Cause:** Cloudflare proxy blocking Vercel's verification checks.

**Fix:**
1. In Cloudflare DNS, find your A/CNAME records
2. Click the **orange cloud** → Turn **gray** (DNS only)
3. Wait 2 minutes
4. Click **"Refresh"** in Vercel
5. **After verification succeeds**, you can re-enable proxy (turn orange)

---

## 🔍 Advanced Diagnostics

### **Check DNS from Command Line**

**macOS/Linux:**
```bash
# Check A record
dig extreamsys.com A +short

# Check CNAME record
dig extreamsys.com CNAME +short

# Check from specific DNS server (Cloudflare's)
dig @1.1.1.1 extreamsys.com A +short
```

**Windows:**
```cmd
# Check DNS
nslookup extreamsys.com

# Check from Cloudflare DNS
nslookup extreamsys.com 1.1.1.1
```

**Expected output (A record):**
```
76.223.XX.XX  ← Should match Vercel's IP
```

**Expected output (CNAME):**
```
cname.vercel-dns.com
```

---

### **Check Cloudflare API Logs**

1. Go to Cloudflare Dashboard
2. Click **Analytics & Logs** → **DNS**
3. Look for queries to `extreamsys.com`
4. Verify responses match your configured records

---

### **Check Vercel Deployment Logs**

1. In Vercel Dashboard → **Deployments**
2. Click latest deployment
3. Check **"Build Logs"** for any DNS-related warnings
4. Look for domain configuration errors

---

## 🎯 Nuclear Option: Reset Everything

If nothing works, start fresh:

### **Step 1: Remove from Vercel**
1. Vercel Dashboard → Settings → Domains
2. Click **"Remove"** next to `extreamsys.com`
3. Confirm removal

### **Step 2: Clean Cloudflare DNS**
1. Delete ALL `A` records for `@` and `www`
2. Delete ALL `CNAME` records for `@` and `www`
3. Wait 5 minutes

### **Step 3: Re-add Domain**
1. In Vercel, click **"Add Domain"** again
2. Follow Vercel's EXACT instructions (don't use generic guides)
3. Add DNS records in Cloudflare with **DNS only** (gray cloud)
4. Wait 10 minutes
5. Verify

---

## 📞 Still Stuck?

### **Contact Vercel Support**

Vercel support is excellent and responds quickly:

1. In Vercel Dashboard, click **"?"** (Help) in bottom-right
2. Click **"Contact Support"**
3. Provide:
   - Domain name: `extreamsys.com`
   - DNS provider: Cloudflare
   - Records you've added (screenshot)
   - Error message from Vercel

**Response time:** Usually < 2 hours

---

### **Contact Cloudflare Support**

If DNS propagation is stuck:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **"Get Help"** (top-right)
3. Search: "Domain not resolving"
4. Follow troubleshooting wizard

---

## ✅ Success Checklist

Once verified, you should see:

- [x] Vercel shows `✅ Valid Configuration`
- [x] SSL Certificate status: `Provisioning...` or `Active`
- [x] Can access site at `https://extreamsys.com` (may show Vercel default page)
- [x] DNS propagation shows correct IP at [dnschecker.org](https://dnschecker.org/)

**After verification:**
- You can re-enable Cloudflare proxy (orange cloud) for DDoS protection
- SSL certificate will auto-provision within 24 hours
- Site will be accessible at both `extreamsys.com` and `www.extreamsys.com`

---

## 📚 Additional Resources

- [Vercel Domain Docs](https://vercel.com/docs/concepts/projects/domains)
- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [DNS Propagation Checker](https://dnschecker.org/)
- [Vercel Status](https://www.vercel-status.com/) (check for outages)

---

**Last Updated:** January 16, 2026
**Status:** Troubleshooting Active
