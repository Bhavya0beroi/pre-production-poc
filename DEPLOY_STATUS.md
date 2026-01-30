# Pre-Production POC - Deployment Status

## ✅ Completed Steps

1. **Code Repository**
   - ✅ Pushed to: https://github.com/productlavaibhav/Pre-prod-tool
   - ✅ All changes including quantity field committed

## 🔄 Deployment Requirements

### Backend Service Needs:
- `DATABASE_URL` - PostgreSQL connection (Railway auto-provides)
- `SENDGRID_API_KEY` - For email notifications (optional)
- `RESEND_API_KEY` - Fallback email (already in code)
- `PORT` - Auto-set by Railway

### Frontend Service Needs:
- `VITE_API_URL` - Backend API URL (will be: https://backend-service.up.railway.app)

## 📝 Manual Deployment Steps Required

Since Railway CLI authentication has issues, follow these steps in Railway Dashboard:

### Step 1: Login to Railway
1. Go to: https://railway.app
2. Login with `productlavaibhav` GitHub account (product@learnapp.com)

### Step 2: Create New Project from GitHub
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `productlavaibhav/Pre-prod-tool`
4. Railway will create services automatically

### Step 3: Verify Services Created
You should see 2 services:
- `pre-production-poc` (frontend)
- `divine-nature` or `server` (backend)

### Step 4: Add PostgreSQL Database
1. Click "+ New" in project
2. Select "Database" → "Add PostgreSQL"
3. Railway auto-connects `DATABASE_URL` to backend

### Step 5: Configure Backend Service
Click backend service → Variables → Add:
```
SENDGRID_API_KEY=(optional - leave empty for now)
EMAIL_FROM=product@learnapp.com
```

### Step 6: Generate Backend Domain
1. Backend service → Settings → Networking
2. Click "Generate Domain"
3. Copy the URL (example: https://divine-nature-production-xyz.up.railway.app)

### Step 7: Configure Frontend Service
Click frontend service → Variables → Add:
```
VITE_API_URL=<paste-backend-url-from-step-6>
```

### Step 8: Deploy & Get Frontend URL
1. Frontend service → Settings → Networking
2. Click "Generate Domain"
3. Your app will be live at this URL!

## 🌐 Expected URLs After Deployment

- Frontend: `https://pre-production-poc-production.up.railway.app`
- Backend API: `https://divine-nature-production.up.railway.app`

## ⏱️ Estimated Time: 5-7 minutes
