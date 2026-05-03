# Deployment Guide - Winatra Social

## Pre-Deployment Checklist

### 1. Security - Remove Credentials ⚠️
```bash
# Remove .env.local dari git tracking (sudah di .gitignore, tapi perlu cleanup)
git rm --cached .env.local

# Commit removal
git commit -m "chore: remove .env.local from git tracking"

# Jangan lupa delete .env.local dari repo history jika sudah published
```

**PENTING: Rotate Supabase Keys**
- Buka [Supabase Dashboard](https://app.supabase.com)
- Ke project settings → API
- Regenerate Anon Key
- Update di deployment platform

### 2. Build & Test Locally
```bash
# Install dependencies
npm install

# Test build
npm run build

# Start production server
npm start

# Verify on http://localhost:3000
```

### 3. Setup Environment Variables

Create `.env.local` (tidak di-commit):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
```

### 4. Supabase Database Setup

Run these migrations in Supabase SQL Editor:

```sql
-- Create tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'alumni', 'admin')),
  angkatan TEXT,
  jurusan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'announcement', 'story')),
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_profiles_username ON profiles(username);
```

### 5. Deploy Options

#### Option A: Vercel (Recommended for Next.js)
1. Push code ke GitHub
2. Connect repo di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy otomatis dari main branch

#### Option B: Self-Hosted (VPS/Server)
```bash
# Build
npm run build

# Start production
NODE_ENV=production npm start

# Or use PM2 for persistence
pm2 start npm --name "winatra" -- start
```

#### Option C: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 6. Supabase Configuration

- **Auth Providers**: Enable via Dashboard → Authentication
- **Redirect URLs**: Add deployment URL ke Auth settings
- **CORS**: Whitelist domain di API settings
- **Rate Limiting**: Configure jika needed

### 7. Post-Deployment

- [ ] Test login flow
- [ ] Create test post
- [ ] Verify profile creation
- [ ] Test messaging
- [ ] Check directory loading
- [ ] Monitor error logs
- [ ] Setup analytics (optional)

### 8. Maintenance

- Monitor Supabase quota usage
- Regular backups (Supabase auto-backup)
- Update dependencies monthly
- Check error logs weekly

## Troubleshooting

**Build fails**: 
- Run `npm run lint` locally
- Check Node.js version (need 18+)
- Clear `.next` folder: `rm -rf .next`

**Auth not working**:
- Verify Supabase URL & keys correct
- Check Redirect URLs in Supabase
- Enable email auth provider

**Database errors**:
- Check tables exist in Supabase
- Verify user has proper RLS permissions
- Check connection limits

## Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=https://your-production.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key_xxxxx
```

The `NEXT_PUBLIC_` prefix means these are safe to expose in frontend (they're public keys for client-side authentication).
