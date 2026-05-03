-- Run this in Supabase SQL Editor to reset Himlab schema.
-- It drops old app tables and creates a clean set of tables with RLS policies.

-- Drop old Himlab tables if they exist.
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
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

-- Update posts table to support announcements
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS announce_level TEXT DEFAULT 'public';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  related_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  related_post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  content text,
  is_read boolean NOT NULL DEFAULT FALSE,
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
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

-- Create direct_messages table
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create connections table
CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

-- Enable row level security on the app tables.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_receiver ON connections(receiver_id);

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

-- Comment likes policies.
CREATE POLICY "Allow comment_like select for authenticated" ON comment_likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow comment_like insert for owner" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow comment_like delete for owner" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Direct messages policies.
CREATE POLICY "Allow DM select for sender or receiver" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow DM insert for sender" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow DM update for receiver" ON direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Connections policies.
CREATE POLICY "Allow connection select for authenticated" ON connections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow connection insert" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Allow connection update for receiver" ON connections
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow notification select for owner" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow notification insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow notification update for owner" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow notification delete for owner" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
