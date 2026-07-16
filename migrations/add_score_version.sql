-- Migration: Add score and version columns to feedback table
-- Run this in Supabase SQL Editor → https://app.supabase.com/project/_/sql

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS score INTEGER,        -- Raw 1-5 star rating from Play Store
  ADD COLUMN IF NOT EXISTS version TEXT,          -- App version string e.g. "10.3.1"
  ADD COLUMN IF NOT EXISTS author TEXT,           -- Reviewer display name
  ADD COLUMN IF NOT EXISTS url TEXT;              -- Direct link to original review

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'feedback'
ORDER BY ordinal_position;
