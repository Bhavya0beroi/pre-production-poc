# Fix Existing Shoots with PDFs

## Problem
Shoots that had PDFs uploaded BEFORE the fix was deployed are stuck in "Shoot Completed" status and don't appear in Finance & Invoices section.

## Solution
Run the SQL script to update their status to `pending_invoice`.

---

## Step-by-Step Instructions:

### Step 1: Go to Railway Database
1. Open **Railway**: https://railway.app
2. Click your project: **pre-production-poc**
3. Click on **Postgres** database service
4. Click **"Data"** tab at the top

### Step 2: Check Which Shoots Need Fixing
Copy and paste this query to see which shoots have PDFs but wrong status:

```sql
SELECT id, name, status, 
       CASE WHEN invoice_file IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pdf_status,
       paid
FROM shoots 
WHERE invoice_file IS NOT NULL 
  AND status NOT IN ('pending_invoice', 'completed')
ORDER BY name;
```

Click **Execute** or press Enter.

This will show you all the shoots that need to be fixed.

---

### Step 3: Fix Unpaid Shoots (Move to Finance & Invoices)
Copy and paste this to fix shoots with PDFs that are NOT paid:

```sql
UPDATE shoots 
SET status = 'pending_invoice'
WHERE invoice_file IS NOT NULL 
  AND status NOT IN ('pending_invoice', 'completed')
  AND paid = FALSE;
```

Click **Execute**.

---

### Step 4: Fix Paid Shoots
Copy and paste this to fix shoots that are already paid:

```sql
UPDATE shoots 
SET status = 'completed'
WHERE invoice_file IS NOT NULL 
  AND paid = TRUE
  AND status != 'completed';
```

Click **Execute**.

---

### Step 5: Verify the Fix
Copy and paste this to verify all shoots are now correct:

```sql
SELECT id, name, status, paid,
       CASE WHEN invoice_file IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pdf_status
FROM shoots 
WHERE invoice_file IS NOT NULL
ORDER BY name;
```

All shoots with PDFs should now have either:
- Status: `pending_invoice` (if not paid yet)
- Status: `completed` (if already paid)

---

### Step 6: Refresh Your App
1. Go to your app: https://pre-production-poc-production.up.railway.app
2. **Hard refresh**: Command + Shift + R
3. Go to **Finance & Invoices** section
4. You should now see all the shoots with PDFs!

---

## What This Does:

**Before Fix:**
- Shoots with PDFs: Status = "Shoot Completed" or other status
- They stay in "All Active Shoots" 
- They DON'T appear in Finance & Invoices

**After Fix:**
- Shoots with PDFs (unpaid): Status = "pending_invoice"
- They appear in Finance & Invoices
- Payment workflow buttons are visible
- They disappear from "All Active Shoots"

---

## Need Help?
If you get any errors, send me a screenshot!
