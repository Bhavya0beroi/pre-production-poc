# Reset Shoots to "New Request" Status

## Problem
Some shoots show "Waiting for Quote" even though you didn't send them to vendor yet.

## Solution
Reset them in Railway database.

## Steps:

### 1. Open Railway Dashboard
Go to: https://railway.app

### 2. Find Your Backend Service
Click on **"divine-nature"** (your backend service)

### 3. Open PostgreSQL
- Click on the **PostgreSQL** database
- Click on **"Query"** tab at the top

### 4. Run This SQL Command
Copy and paste this into the query box:

```sql
UPDATE shoots 
SET status = 'new_request' 
WHERE status = 'with_vendor' 
  AND vendor_quote IS NULL;
```

### 5. Click "Run Query"

### 6. Verify
Run this to check:

```sql
SELECT id, name, status 
FROM shoots 
WHERE status = 'new_request'
ORDER BY created_at DESC 
LIMIT 10;
```

### 7. Refresh Your App
Go back to your app and refresh the page (Cmd+R or Ctrl+R)

All shoots should now show "New Request" with "Send to Vendor" button!

---

## What This Does:
- Changes all "Waiting for Quote" shoots back to "New Request"
- Only affects shoots that don't have a vendor quote yet
- After this, the proper flow will work correctly
