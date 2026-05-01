-- Run this in Supabase SQL Editor to reset Himlab schema.
-- It drops old app tables and creates a clean set of tables with RLS policies.

-- Drop old Himlab tables if they exist.
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table for user metadata.
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'member',
  angkatan text,
  jurusan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create posts table.
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  type text NOT NULL DEFAULT 'post',
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create likes table.
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Create comments table.
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable row level security on the app tables.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies.
CREATE POLICY "Allow profile select for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow profile insert for owner" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile update for owner" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow profile delete for owner" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Posts policies.
CREATE POLICY "Allow post select for authenticated users" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow post insert for owner" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow post update for owner" ON posts
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow post delete for owner" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Likes policies.
CREATE POLICY "Allow like select for authenticated users" ON likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow like insert for owner" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow like delete for owner" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies.
CREATE POLICY "Allow comment select for authenticated users" ON comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow comment insert for owner" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow comment update for owner" ON comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow comment delete for owner" ON comments
  FOR DELETE USING (auth.uid() = user_id);
