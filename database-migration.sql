-- Migration to add missing call_time column
-- Run this in Railway Database Query or Postgres console

-- Add call_time column if it doesn't exist
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS call_time TEXT;

-- Add multi-vendor quote columns
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS vendor_quotes JSONB DEFAULT '[]';
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS vendor_slot_names JSONB;

-- Add payment confirmation tracking
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shoots' 
ORDER BY ordinal_position;
