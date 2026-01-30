# 🚀 Complete Deployment Guide - Pre-Production POC

## 📦 What You're Deploying

Your app has **3 components**:

### 1. **Frontend** (React/Vite)
- **Location**: Root directory (`/`)
- **Config**: `railway.json`
- **What it does**: User interface for managing shoots
- **Service name**: `pre-production-poc`

### 2. **Backend API** ("divine-nature")
- **Location**: `server/` directory
- **Config**: `server/railway.json`
- **What it does**: Node.js API server, handles database operations
- **Service name**: `divine-nature` (or `backend`)
- **File**: `server/index.js` (1000+ lines)

### 3. **Database** (PostgreSQL)
- **Type**: Railway PostgreSQL
- **Auto-connects to backend**

---

## 🎯 Step-by-Step Deployment (5 minutes)

### Step 1: Open Railway & Login
1. Go to: **https://railway.app/new**
2. Login with **`productlavaibhav`** GitHub account
3. You'll see the "New Project" screen

### Step 2: Deploy from GitHub
1. Click **"Deploy from GitHub repo"**
2. Authorize Railway to access your repos (if asked)
3. Search for: **`Pre-prod-tool`**
4. Select: **`productlavaibhav/Pre-prod-tool`**
5. Click **"Deploy Now"**

### Step 3: Railway Auto-Detection
Railway will automatically:
- ✅ Find `railway.json` (frontend config)
- ✅ Find `server/railway.json` (backend config)
- ✅ Create **2 services**:
  - `pre-production-poc` (frontend)
  - Service from `server/` folder (backend)

**Wait 2-3 minutes for initial build**

### Step 4: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Click **"Add PostgreSQL"**
4. Railway auto-creates `DATABASE_URL` variable
5. Backend service auto-connects to it

### Step 5: Configure Backend Service
1. Click on **backend service** (the one with `server/` directory)
2. Go to **"Variables"** tab
3. **Verify these exist** (Railway should auto-add):
   - `DATABASE_URL` ✅ (auto-added from PostgreSQL)
   - `PORT` ✅ (auto-added by Railway)

4. **Add optional variables**:
   ```
   EMAIL_FROM=product@learnapp.com
   SENDGRID_API_KEY=(leave empty for now - emails won't work)
   ```

### Step 6: Generate Backend Domain
1. Stay in **backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. **COPY THE URL** (looks like: `https://backend-production-xyz.up.railway.app`)

### Step 7: Configure Frontend Service
1. Click on **frontend service** (`pre-production-poc`)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   ```
   VITE_API_URL=<paste-backend-url-from-step-6>
   ```
   Example: `https://backend-production-abc123.up.railway.app`
5. Click **"Add"**

### Step 8: Redeploy Frontend
1. Stay in frontend service
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** (or wait for auto-redeploy after adding variable)

### Step 9: Generate Frontend Domain
1. Frontend service → **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. **YOUR APP IS LIVE!** 🎉

---

## 🌐 Final URLs

After deployment:
- **Frontend (Your App)**: `https://pre-production-poc-production.up.railway.app`
- **Backend API**: `https://backend-production-xyz.up.railway.app`
- **Database**: Internal (connected via `DATABASE_URL`)

---

## ✅ Verification Checklist

- [ ] 3 services running in Railway project
- [ ] PostgreSQL database created
- [ ] Backend has `DATABASE_URL` variable
- [ ] Backend domain generated
- [ ] Frontend has `VITE_API_URL` pointing to backend
- [ ] Frontend domain generated
- [ ] App loads in browser

---

## 🐛 If Something Goes Wrong

### Frontend shows errors:
- Check that `VITE_API_URL` is set correctly
- Make sure backend domain is accessible

### Backend crashes:
- Check Logs tab in backend service
- Verify `DATABASE_URL` exists
- Check if PostgreSQL is running

### Database connection fails:
- Railway auto-connects - shouldn't fail
- Check backend logs for connection errors

---

## 📊 What the App Does

Once deployed:
1. **Create shoot requests** with equipment
2. **Quantity field shows** in vendor quotes (your recent update!)
3. **Track approvals** and invoices
4. **Manage equipment catalog**
5. **Send email notifications** (needs SendGrid API key)

---

## ⏱️ Total Time: 5-7 minutes

**Current Status:**
✅ Code pushed to GitHub: https://github.com/productlavaibhav/Pre-prod-tool
🔄 Ready to deploy on Railway

**Next Action:** Follow steps above in Railway dashboard
