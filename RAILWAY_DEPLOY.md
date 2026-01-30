# Deploy to Railway - Manual Steps

Since CLI authentication is having issues, follow these steps to deploy via Railway Dashboard:

## Option 1: Deploy from Railway Dashboard (Recommended)

### Step 1: Go to Railway Dashboard
1. Open: https://railway.app/dashboard
2. Login with `productlavaibhav` GitHub account

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Search and select: **`productlavaibhav/Pre-prod-tool`**
4. Railway will automatically detect the configuration

### Step 3: Configure Services
Railway should create 1 service automatically:
- **Frontend Service** (uses `railway.json` config)

### Step 4: Set Environment Variables
In the service settings, add:
- `VITE_SUPABASE_URL` = your_supabase_url
- `VITE_SUPABASE_ANON_KEY` = your_supabase_key

### Step 5: Deploy
- Railway will automatically deploy
- You'll get a `.up.railway.app` domain
- Click "Generate Domain" if not auto-generated

---

## Option 2: Use Existing Railway Account

If you're already logged in as `bhavya.oberoi@learnapp.co`:

1. Go to: https://railway.app/project/88be635c-8170-4b07-b258-74a29e25d1e8
2. Click on the **pre-production-poc** service
3. Go to **Settings** → **Source**
4. Change GitHub repo to: `productlavaibhav/Pre-prod-tool`
5. Redeploy

---

## URLs After Deployment

Your app will be live at:
- Frontend: `https://[service-name]-production.up.railway.app`

---

## Current Status
✅ Code pushed to: https://github.com/productlavaibhav/Pre-prod-tool
🔄 Ready to deploy on Railway
