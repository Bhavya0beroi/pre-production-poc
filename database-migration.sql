-- Migration to add missing call_time column
-- Run this in Railway Database Query or Postgres console

-- Add call_time column if it doesn't exist
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS call_time TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shoots' 
ORDER BY ordinal_position;
