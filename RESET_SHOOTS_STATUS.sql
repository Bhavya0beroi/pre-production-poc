-- Reset all shoots that are "with_vendor" (Waiting for Quote) back to "new_request"
-- Run this in Railway PostgreSQL Query tab

UPDATE shoots 
SET status = 'new_request' 
WHERE status = 'with_vendor';

-- Verify the change
SELECT id, name, status FROM shoots ORDER BY created_at DESC LIMIT 10;
