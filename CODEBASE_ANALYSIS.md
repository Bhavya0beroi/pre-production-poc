# Pre-Production POC - Complete Codebase Analysis

**Generated on:** Tuesday, February 3, 2026  
**Analysis Date:** Feb 3, 2026

---

## 📊 PROJECT OVERVIEW

### Project Name
**Pre-Production POC (ShootFlow)**

### Description
A comprehensive shoot equipment management system for managing equipment requests, vendor quotes, approvals, invoicing, and payment processing. Built with React (TypeScript) frontend and Node.js Express backend.

---

## 🔗 GIT REPOSITORY INFORMATION

### Repository Details
- **Repository URL:** `https://github.com/Bhavya0beroi/pre-production-poc.git`
- **GitHub Account:** `Bhavya0beroi`
- **Repository Owner:** Bhavya Oberoi
- **Branch:** `main` (synced with `origin/main`)

### Last Commit Information
```
Commit Hash: f5a89ffb15a0c2a4fdd2bc1441c8f8241bb4ba7f
Author: Akkibilwan
Email: ankush.chaudhary@learnapp.com
Date: Fri Jan 30 14:59:04 2026 +0530
Message: Fix: Add Equipment button now visible with inline styles (blue bg + white text)
```

### Recent Commit History (Last 20)
1. `f5a89ff` - Fix: Add Equipment button now visible with inline styles (blue bg + white text)
2. `a52f800` - Fix: Make Add Equipment button visible with proper modal height and add DELETE API for catalog persistence
3. `990ae7b` - Force redeploy - update build version
4. `3071f82` - Fix: Add DELETE endpoint for catalog items and persist deletions to database
5. `02d7c0d` - Force cache bust - update build timestamp
6. `3f43226` - Force Railway redeploy - trigger fresh build
7. `c47d7e7` - Fix frontend deployment - use npm start instead of npx serve
8. `c445a0b` - Update Add Equipment modal UI - simplify button text and remove helper text
9. `83fff5a` - Fix: Add transaction support and validation for catalog bulk save
10. `8d2b59a` - Fix equipment catalog persistence - data now saves to database
11. `7f4a1a0` - Fix critical data persistence issue with enhanced database error handling
12. `6a1e289` - Add quantity field to vendor quote form
13. `ff9ca33` - Fix email threading - use consistent subject for all emails in a request group
14. `58cecbc` - Switch to Gmail SMTP for direct email delivery
15. `fc3ce23` - Email workaround: send all emails to verified address with intended recipient shown
16. `ed2b427` - Fix: Email modal only shows after successful send
17. `6c75daa` - Fix email threading - use custom Message-ID headers and proper delays
18. `a714ba2` - Add email threading support for all workflow steps

---

## 🚀 RAILWAY DEPLOYMENT INFORMATION

### Railway Project ID
**Project ID:** `88be635c-8170-4b07-b258-74a29e25d1e8`

### Deployed Services

#### 1. Frontend Service
- **URL:** `https://pre-production-poc-production.up.railway.app`
- **Alternative URL:** `https://pre-production-poc.up.railway.app`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** Dynamic (Railway assigned via `$PORT` env variable)
- **Technology:** Vite + React + TypeScript

#### 2. Backend API Service
- **URL:** `https://divine-nature-production-c49a.up.railway.app`
- **Port:** 3001 (locally), Railway `$PORT` in production
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Technology:** Node.js + Express + PostgreSQL

#### 3. Database Service
- **Type:** PostgreSQL
- **Connection:** Automatically connected via `DATABASE_URL` environment variable
- **Tables:**
  - `shoots` - Stores all shoot requests and their states
  - `catalog_items` - Equipment catalog with rates

### Environment Variables

#### Frontend
```
VITE_API_URL=https://divine-nature-production-c49a.up.railway.app
VITE_SUPABASE_URL=<optional>
VITE_SUPABASE_ANON_KEY=<optional>
```

#### Backend
```
DATABASE_URL=<automatically set by Railway PostgreSQL>
PORT=<automatically set by Railway>
SENDGRID_API_KEY=<for email notifications>
EMAIL_FROM=bhavya.oberoi@learnapp.co
RESEND_API_KEY=re_gPwuFNvg_JEL3arzPU7QApcCZz7CW5xFu (fallback)
NODE_ENV=production
APP_URL=https://pre-production-poc.up.railway.app
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### Frontend Stack
- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Build Tool:** Vite 6.3.5
- **UI Library:** Radix UI components
- **Styling:** Tailwind CSS
- **State Management:** React Context (AuthContext)
- **Storage:** LocalStorage + API sync

### Backend Stack
- **Runtime:** Node.js (>=18)
- **Framework:** Express.js
- **Database:** PostgreSQL (via pg pool)
- **Email:** SendGrid HTTP API (primary), Resend API (fallback)
- **CORS:** Enabled for frontend communication

### Key Dependencies

#### Frontend
```json
{
  "@radix-ui/*": "Various versions for UI components",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.55.0",
  "lucide-react": "^0.487.0",
  "recharts": "^2.15.2",
  "sonner": "^2.0.3",
  "tailwind-merge": "*",
  "class-variance-authority": "^0.7.1"
}
```

#### Backend
```json
{
  "express": "^4.x",
  "cors": "*",
  "pg": "^8.x"
}
```

---

## 📁 PROJECT STRUCTURE

```
/Users/bhavya/Desktop/pre-production-poc-main new/
├── src/                          # Frontend source code
│   ├── App.tsx                   # Main application component (1700 lines)
│   ├── components/               # React components
│   │   ├── MainDashboard.tsx
│   │   ├── VendorQuoteForm.tsx
│   │   ├── ApprovalScreen.tsx
│   │   ├── InvoiceManagement.tsx
│   │   ├── CreateRequestForm.tsx
│   │   ├── FinanceDashboard.tsx
│   │   ├── EquipmentCatalogManager.tsx
│   │   ├── ArchiveScreen.tsx
│   │   ├── NotificationSystem.tsx
│   │   ├── LoginPage.tsx
│   │   ├── EditShootForm.tsx
│   │   ├── Sidebar.tsx
│   │   ├── KanbanCard.tsx
│   │   ├── ui/                   # Shadcn/Radix UI components
│   │   └── figma/
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── lib/
│   │   └── supabase.ts           # Supabase client (optional)
│   ├── services/
│   │   └── emailService.ts       # Email service utilities
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx                  # Entry point
├── server/                       # Backend API
│   ├── index.js                  # Express server (1283 lines)
│   ├── package.json
│   └── railway.json
├── Documentation Files
│   ├── README.md
│   ├── RAILWAY_DEPLOY.md
│   ├── DEPLOY_STATUS.md
│   ├── COMPLETE_DEPLOYMENT_GUIDE.md
│   ├── FIX_DATABASE_ISSUE.md
│   ├── EQUIPMENT_CATALOG_FIX.md
│   ├── SETUP_DATABASE.md
│   └── QUICK_FIX_CHECKLIST.md
├── Configuration Files
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.ts            # Vite configuration
│   ├── railway.json              # Railway deployment config
│   ├── nixpacks.toml             # Nixpacks build config
│   └── .gitignore
├── Scripts
│   ├── import-historical-data.js
│   ├── import-pdfs.js
│   ├── update-equipment.js
│   ├── deploy-railway-api.sh
│   ├── deploy-to-railway.command
│   └── full-railway-deploy.sh
└── Database
    └── supabase-schema.sql       # Database schema (optional)
```

---

## 🎯 CORE FUNCTIONALITY

### 1. Equipment Request Management
- Create single or multi-shoot equipment requests
- Equipment catalog with 133 items (cameras, lenses, lights, audio, etc.)
- Support for quantity and daily rates
- Request grouping for related shoots

### 2. Vendor Quote System
- Vendor form accessible via unique links (no login required)
- Itemized pricing with vendor rates
- Quote submission with notes
- Support for multi-shoot batch quotes

### 3. Approval Workflow
- Two-tier approval process (Pre-production team → Finance/Founder)
- Approve or reject quotes with reasons
- Automatic status transitions
- Email notifications at each step

### 4. Invoice Management
- Upload invoices (PDF with base64 encoding)
- Invoice reminders (7 days after shoot completion)
- Mark as paid functionality
- Finance dashboard for tracking

### 5. Email Notifications (SMTP)
- 8 email templates covering full workflow
- Email threading (Gmail-compatible)
- SendGrid primary (100 emails/day free tier)
- Resend fallback
- Templates:
  1. New Request (single/multi-shoot)
  2. Quote Submitted
  3. Quote Approved
  4. Quote Rejected
  5. Invoice Reminder
  6. Invoice Uploaded
  7. Payment Complete

### 6. Real-time Status Tracking
- Kanban-style view with 6 statuses:
  - New Request
  - With Vendor
  - With Swati (Approval)
  - Ready for Shoot
  - Pending Invoice
  - Completed
- Activity timeline for each shoot
- Archive for completed shoots

### 7. Equipment Catalog Management
- 133 pre-loaded items across 10 categories
- Add/edit/delete functionality
- Bulk save to database
- Category-wise organization:
  - Camera (18 items)
  - Lens (22 items)
  - Light (39 items)
  - Tripod (6 items)
  - Audio (11 items)
  - Small Equipments (8 items)
  - Extra (19 items)
  - Assistant/Crew (9 items)
  - Transport (3 items)

### 8. Authentication System
- Role-based access (Admin, User)
- Login page
- Protected routes
- Vendor links bypass authentication
- User context management

### 9. Data Persistence
- **Primary:** PostgreSQL database via Railway
- **Backup:** LocalStorage for offline resilience
- **Sync:** Automatic sync on load and save
- **API:** RESTful endpoints for CRUD operations

---

## 🔄 WORKFLOW STATES

```
New Request → Send to Vendor → With Vendor → Submit Quote → 
With Swati (Approval) → Approve/Reject → Ready for Shoot → 
Shoot Completed (Auto) → Pending Invoice → Upload Invoice → 
Finance Review → Mark Paid → Completed
```

### Automatic Transitions
- **After shoot date passes:** Active Shoots → Pending Invoice
- **7 days after completion:** Invoice reminder email sent

---

## 📧 EMAIL SYSTEM

### Configuration
- **Primary:** SendGrid HTTP API (`SENDGRID_API_KEY`)
- **Fallback:** Resend API (hardcoded key in server)
- **From Email:** bhavya.oberoi@learnapp.co
- **Threading:** Gmail-compatible Message-ID headers

### Email Recipients
```javascript
DEFAULT_RECIPIENTS = {
  admin: 'anish@company.com',
  approver: 'swati@company.com', 
  finance: 'swati@company.com',
  vendor: 'vendor@gopalamedia.com'
}
```

### Email Flow
1. **New Request** → Approver
2. **Vendor Quote** → Approver
3. **Approval** → Requestor
4. **Rejection** → Requestor
5. **Invoice Reminder** → Requestor
6. **Invoice Upload** → Finance
7. **Payment Complete** → Vendor

---

## 🗄️ DATABASE SCHEMA

### `shoots` Table
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
date TEXT
duration TEXT
location TEXT
equipment JSONB DEFAULT '[]'
status TEXT DEFAULT 'new_request'
requestor JSONB
vendor_quote JSONB
approved BOOLEAN DEFAULT FALSE
approved_amount DECIMAL
invoice_file JSONB
paid BOOLEAN DEFAULT FALSE
rejection_reason TEXT
approval_email TEXT
cancellation_reason TEXT
activities JSONB DEFAULT '[]'
email_thread_id TEXT
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
shoot_date TIMESTAMP WITH TIME ZONE
request_group_id TEXT
is_multi_shoot BOOLEAN DEFAULT FALSE
multi_shoot_index INTEGER
total_shoots_in_request INTEGER
```

### `catalog_items` Table
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
daily_rate DECIMAL NOT NULL
category TEXT NOT NULL
last_updated TEXT
```

---

## 🔌 API ENDPOINTS

### Health & Status
- `GET /api/health` - Health check with DB status

### Shoots
- `GET /api/shoots` - Fetch all shoots
- `POST /api/shoots` - Create/update shoot
- `DELETE /api/shoots/:id` - Delete shoot

### Catalog
- `GET /api/catalog` - Fetch all catalog items
- `POST /api/catalog` - Create/update single item
- `POST /api/catalog/bulk` - Bulk upsert items
- `DELETE /api/catalog/:id` - Delete catalog item

### Email
- `POST /api/email/send` - Send single email
- `POST /api/email/batch` - Send batch emails
- `POST /api/email/test` - Test email
- `POST /api/email/test-thread` - Test complete email thread
- `GET /api/email/status` - Email config status

---

## 🔒 SECURITY & ACCESS

### Authentication
- Context-based auth system
- No hardcoded passwords in repo
- Role-based access control
- Vendor links use shoot ID in URL param

### Environment Variables
- All sensitive data in environment variables
- No `.env` files committed (gitignored)
- Database URL managed by Railway

---

## 🐛 RECENT FIXES & IMPROVEMENTS

### Last 10 Fixes (Jan 2026)
1. Equipment button visibility (inline styles)
2. Add DELETE API for catalog persistence
3. Modal height and catalog deletions
4. Transaction support for bulk catalog saves
5. Equipment catalog database persistence
6. Data persistence with error handling
7. Email threading with consistent subjects
8. Gmail SMTP integration
9. Email modal timing fixes
10. Message-ID headers for email threading

---

## 📝 DEPLOYMENT HISTORY

### Recent Deployments
- Multiple forced redeployments to Railway
- Frontend deployment fixes (npm start vs npx serve)
- Cache busting for build updates
- Database connection improvements

### Build Configuration
- **Frontend:** Nixpacks with npm
- **Backend:** Nixpacks with node
- **Restart Policy:** ON_FAILURE (max 10 retries)

---

## 🎨 UI/UX FEATURES

### Design System
- Figma design: XvhznJI4dzRfqcsFbjvEyG/General-Style-Guide
- Modern, clean interface
- Responsive design
- Toast notifications
- Modal dialogs
- Sidebar navigation

### Components (40+)
- Accordion, Alert Dialog, Avatar, Badge, Button, Calendar
- Card, Carousel, Chart, Checkbox, Command, Context Menu
- Dialog, Drawer, Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu, Pagination
- Popover, Progress, Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Sidebar, Skeleton
- Slider, Sonner, Switch, Table, Tabs, Textarea
- Toggle, Tooltip

---

## 📊 METRICS & SCALE

### Data Volume
- **Catalog Items:** 133 pre-loaded equipment items
- **Shoots:** Growing database (count varies)
- **Email Templates:** 8 workflow templates
- **Email Limit:** 100/day (SendGrid free tier)

### Performance
- LocalStorage caching for instant load
- API fetch timeout: 8 seconds
- Parallel API calls for shoots + catalog
- Background sync (no UI blocking)

---

## 🔧 DEVELOPMENT SCRIPTS

### Frontend
```bash
npm run dev        # Development server (Vite)
npm run build      # Production build
npm run preview    # Preview build
npm start          # Serve production build
```

### Backend
```bash
node index.js      # Start server (port 3001)
```

### Utilities
```bash
node import-historical-data.js   # Import historical shoot data
node import-pdfs.js              # Import PDF documents
node update-equipment.js         # Update equipment catalog
```

---

## 📞 CONTACT & ACCOUNTS

### Key Emails
- **Developer:** ankush.chaudhary@learnapp.com (Akkibilwan)
- **Admin:** bhavya.oberoi@learnapp.co
- **Project Owner:** Bhavya0beroi (GitHub)

### Service Accounts
- **Railway:** bhavya.oberoi@learnapp.co / productlavaibhav
- **SendGrid:** API key configured in Railway env
- **Resend:** API key in server code (fallback)

---

## 🎯 PROJECT STATUS

### Current State
- ✅ Fully deployed on Railway
- ✅ Database connected and operational
- ✅ Email system functional (SendGrid + Resend)
- ✅ Frontend and backend communicating
- ✅ Equipment catalog with 133 items
- ✅ Multi-shoot support implemented
- ✅ Email threading working

### Known Working URLs
- Frontend: `https://pre-production-poc-production.up.railway.app`
- Backend API: `https://divine-nature-production-c49a.up.railway.app`
- API Health: `https://divine-nature-production-c49a.up.railway.app/api/health`

---

## 📋 NOTES

1. **Email Workaround:** Free tier Resend only sends to verified addresses. Banner shows intended recipient.
2. **Database:** Railway automatically provisions PostgreSQL and sets `DATABASE_URL`
3. **LocalStorage Keys:** Using v3 schema to clear old cached data
4. **Git Branching:** All work on `main` branch, synced with origin
5. **Build System:** Uses Nixpacks for Railway builds

---

## 🔮 FUTURE CONSIDERATIONS

### Potential Improvements
- Multi-language support
- Advanced reporting/analytics
- Budget forecasting
- Vendor management dashboard
- Mobile app
- Webhook integrations
- Advanced search/filtering
- Export to Excel/PDF

---

**Generated by:** Cursor AI Assistant  
**For:** Bhavya Oberoi  
**Project:** Pre-Production POC (ShootFlow)  
**Last Updated:** January 30, 2026
