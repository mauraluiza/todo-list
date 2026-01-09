-- MIGRATION V2: User Profiles & Username Login
-- Run this in Supabase SQL Editor

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    birth_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow public read of usernames if needed for login lookup?
-- Actually, for login lookup "by username", we need a secure way to get email from username.
-- We can create a stored procedure (RPC) marked as security definer to lookup email by username safely without exposing the whole profiles table to public.

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Function to handle new user signup (Trigger)
-- Auto-create profile entry when a user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RPC for Username Login Lookup
-- Allows the frontend to ask "What is the email for username X?" without needing full read access
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TABLE (email VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER -- run as admin
AS $$
BEGIN
  RETURN QUERY
  SELECT au.email
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.username = p_username;
END;
$$;
