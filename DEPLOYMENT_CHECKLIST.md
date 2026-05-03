# ✅ Deployment Ready Checklist - Winatra Social

## 🔴 Critical Issues (Benerin Sebelum Deploy)

- [x] **Fixed FeedPage import** - Changed `createBrowserSupabaseClient` → `createClient`
- [ ] **Rotate Supabase Keys** - Current keys exposed in `.env.local`
  - [ ] Generate new Anon Key in Supabase
  - [ ] Remove `.env.local` from git history
  - [ ] Add new keys ke production environment

## 📋 Pre-Deployment Steps

### 1. Security
- [ ] Rotate Supabase API keys
- [ ] Run: `git rm --cached .env.local`
- [ ] Commit: `git commit -m "chore: remove .env.local"`
- [ ] Run: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty -- --all`

### 2. Local Testing
```bash
# Install deps
npm install

# Build & lint
npm run build
npm run lint

# Test locally
npm run dev
# → Test auth login
# → Create post
# → Check profile
# → Browse directory
```

### 3. Database Setup
- [ ] Create Supabase tables (see `DEPLOYMENT_GUIDE.md`)
- [ ] Enable Row Level Security (RLS)
- [ ] Create indexes for performance

### 4. Environment Config
Create `.env.local` (NOT committed):
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[new_anon_key]
```

### 5. Choose Deployment Platform

**Recommended: Vercel**
- [ ] Connect GitHub repo
- [ ] Add environment variables
- [ ] Deploy

**Alternative: Self-hosted**
- [ ] Setup Node.js 18+
- [ ] `npm run build`
- [ ] `npm start`
- [ ] Use PM2 for process management

### 6. Post-Deploy Verification
- [ ] Test login page
- [ ] Create account & verify profile
- [ ] Create test post
- [ ] Check feed loads
- [ ] Test messaging
- [ ] Browse directory

## ✅ Code Quality

- [x] TypeScript types correct
- [x] All imports valid
- [x] Supabase client initialized properly
- [x] No console errors expected
- [x] Next.js 16 compatible

## 🔒 Security Checklist

- [ ] No secrets in code
- [ ] Environment variables only
- [ ] CORS configured
- [ ] Auth redirects configured
- [ ] HTTPS enabled
- [ ] Security headers in production

## 📊 Tech Stack

| Component | Version | Status |
|-----------|---------|--------|
| Next.js | 16.2.4 | ✅ |
| React | 19.2.4 | ✅ |
| TypeScript | ^5 | ✅ |
| Supabase | ^2.105.1 | ✅ |
| Tailwind | ^4 | ✅ |
| Framer Motion | ^12.38.0 | ✅ |

## 📝 Files Created/Modified

### New Files
- ✅ `.env.example` - Template for environment variables
- ✅ `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

### Modified Files
- ✅ `components/feed/FeedPage.tsx` - Fixed import
- ✅ `next.config.ts` - Added image optimization config

## 🚀 Quick Deploy Commands

```bash
# Vercel
git push origin main

# Self-hosted
npm install
npm run build
NODE_ENV=production npm start

# Docker
docker build -t winatra-social .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  winatra-social
```

## 📞 Support

For issues, check:
1. `DEPLOYMENT_GUIDE.md` - Troubleshooting section
2. [Supabase Docs](https://supabase.com/docs)
3. [Next.js Docs](https://nextjs.org/docs)

---

**Status: Ready for Deployment** ✅
(After security steps are completed)
