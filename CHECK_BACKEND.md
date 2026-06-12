# Check Backend & Data Status

## Quick Checks to Find Your Data:

### Step 1: Check Backend Service Status
1. Go to Railway: https://railway.app
2. Find **divine-nature** (backend service)
3. Check if it shows **"Active"** or **"Crashed"**
4. If crashed → Click **"Restart"** button

### Step 2: Check Database Directly
1. In Railway, click **divine-nature** → **PostgreSQL**
2. Click **"Query"** tab
3. Run this query:
```sql
SELECT id, name, status, created_at 
FROM shoots 
ORDER BY created_at DESC 
LIMIT 20;
```
4. **Do you see your shoots?**
   - ✅ YES → Backend has data, but frontend isn't loading it
   - ❌ NO → Data was actually deleted from database

### Step 3: Check Backend Logs
1. In Railway, click **divine-nature** service
2. Click **"Logs"** tab
3. Look for:
   - **Red errors** → Backend crashed or database connection failed
   - `✓ Server running on port` → Backend is working
   - `Database connected` → Database connection OK

### Step 4: Test API Directly
Open this URL in your browser:
```
https://divine-nature-production-c49a.up.railway.app/api/shoots
```

What do you see?
- **JSON array with shoots** → API is working! Frontend issue.
- **Error message** → Backend issue
- **Nothing/blank** → Backend not responding

### Step 5: Check Frontend Console
1. Open your app: https://pre-production-poc-production.up.railway.app
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Look for:
   - `✅ Loaded X shoots from API` → How many shoots loaded?
   - **Red errors** → Shows what failed
   - `🔗 API: https://divine-nature...` → Confirms API URL

## Common Issues & Fixes:

### Issue 1: Backend Service Crashed
**Fix**: Restart it in Railway dashboard

### Issue 2: Database Connection Lost
**Fix**: Check Railway PostgreSQL service is running

### Issue 3: CORS Error in Browser Console
**Fix**: Backend needs to allow frontend domain

### Issue 4: API Timeout
**Fix**: Backend might be slow - check logs

## What to Do Next:

1. **First**: Run the SQL query above to confirm data exists
2. **Then**: Test the API URL in browser
3. **Finally**: Check frontend console for errors

Tell me what you find and I'll help fix it!
