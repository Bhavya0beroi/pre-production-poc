# 🚀 Deploy via Railway Dashboard (Web UI)

Since the CLI is asking for a service name, let's deploy through Railway's web interface instead - it's actually faster!

---

## ✅ Step 1: Open Railway Dashboard

I already opened it in your browser, or click here:
https://railway.app/project/88be635c-8170-4b07-b258-74a29e25d1e8

---

## ✅ Step 2: Find Your Backend API Service

Look for your backend/API service. It's likely named:
- "pre-production-poc-main-new" or
- "server" or
- "API" or similar

**Click on that service card**

---

## ✅ Step 3: Deploy from GitHub

### Option A: Automatic Deployment (Recommended)

If your service is connected to GitHub:
1. Click on **"Deployments"** tab
2. Look for the latest commit: `33e0e63 - FIX: API 500 error`
3. If it hasn't deployed automatically, click **"Deploy"** or **"Redeploy"**

### Option B: Manual Trigger

1. Click **"Settings"** tab
2. Scroll to **"Source"**
3. Click **"Redeploy"** button

---

## ✅ Step 4: Monitor Deployment

1. You'll see **"Build Logs"** appear
2. Watch for these success messages:
   ```
   ✅ Database connection successful
   🔄 Running database migrations...
   ✅ Migration: call_time column verified
   ✅ Server is ready to accept requests
   ```

3. **Deployment takes ~2-3 minutes**

---

## ✅ Step 5: Test the Fix!

Once deployed (status shows "Active" with green dot):

1. **Open your app:** https://divine-nature-production-c49a.up.railway.app
2. **Click "New Request"**
3. **Fill in the form:**
   - Shoot Name: "Test Fix"
   - Dates, Location
   - **Call Time:** "9:30 AM"
   - **Approval Emails:**
     - Type `test1@example.com` → Press Enter
     - Type `test2@example.com` → Press Enter
4. **Click "Submit Request"**
5. **✅ SUCCESS!** No error! Shoot appears in dashboard
6. **Refresh the page**
7. **✅ Data is still there!**

---

## 🎯 Alternative: Deploy via CLI with Service Name

If you want to use the CLI, you need to specify the service name:

```bash
# First, find your service name in Railway dashboard
# Then run:
railway up --service "YOUR_SERVICE_NAME_HERE"
```

For example:
```bash
railway up --service "pre-production-poc-main-new"
```

---

## ✅ What Was Fixed (Reminder)

- ✅ **API 500 error** - approval_email arrays now converted to JSON
- ✅ **call_time column** - automatically added via migration
- ✅ **Data persistence** - everything saves properly now

---

## 🆘 Need Help?

### View Logs in Railway:
1. Click on your service
2. Click "Deployments" tab
3. Click on the latest deployment
4. View "Build Logs" and "Deploy Logs"

### Check Database:
1. Click on your PostgreSQL service
2. Click "Data" tab
3. Run query: `SELECT * FROM shoots LIMIT 1;`
4. Verify `call_time` column exists

---

## 📊 Deployment Status

**Code Status:**
- ✅ Committed: 33e0e63
- ✅ Pushed to GitHub
- ✅ Railway Dashboard: Open

**Deployment Status:**
- [ ] Service found in Railway UI
- [ ] Redeploy triggered
- [ ] Build successful
- [ ] Migration ran successfully
- [ ] Server is Active
- [ ] Tested: Create shoot works
- [ ] Tested: Data persists

---

**The fix is ready - just need to trigger the deployment in Railway UI!** 🚀
