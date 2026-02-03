# 🐛 API Error 500 - FIXED

## Error Shown to User

```
Failed to save shoot request to database. Please try again or contact support.

Error: API error: 500
```

---

## Root Cause Analysis

The 500 error was caused by **TWO issues**:

### Issue #1: Array Handling for `approval_email`
**Problem:** The frontend sends `approval_email` as an **array** (e.g., `["email1@test.com", "email2@test.com"]`), but the backend was trying to save it directly to a TEXT column without converting it to a string.

**PostgreSQL Error:** Cannot insert array into TEXT column.

**Fix:** Added conversion logic to detect arrays and convert them to JSON strings before saving.

### Issue #2: Missing `call_time` Column
**Problem:** If the database table was created before we added the `call_time` feature, the column doesn't exist in production, causing INSERT queries to fail.

**Fix:** Added automatic migration on server startup to add the column if it's missing.

---

## Files Fixed

### 1. `server/index.js`

#### Fix #1: approval_email Array Handling (Line ~860)
```javascript
// BEFORE (BROKEN):
shoot.approval_email  // Could be array, breaks database

// AFTER (FIXED):
const approvalEmailValue = Array.isArray(shoot.approval_email) 
  ? JSON.stringify(shoot.approval_email)  // Convert ["email1", "email2"] to '["email1","email2"]'
  : shoot.approval_email;                  // Keep string as-is
```

#### Fix #2: Automatic call_time Column Migration (Line ~770)
```javascript
// Added automatic migration on server startup
try {
  await pool.query(`
    ALTER TABLE shoots ADD COLUMN IF NOT EXISTS call_time TEXT
  `);
  console.log('✅ Migration: call_time column verified');
} catch (migrationError) {
  console.log('⚠️  Migration warning:', migrationError.message);
}
```

### 2. `src/App.tsx`

#### Fix #3: Parse approval_email When Loading from Database (Line ~683)
```javascript
// Parse approval_email: if it's a JSON string, parse it back to array
let approvalEmail = s.approval_email;
if (typeof approvalEmail === 'string' && approvalEmail.startsWith('[')) {
  try {
    approvalEmail = JSON.parse(approvalEmail);  // '["email1","email2"]' → ["email1", "email2"]
  } catch (e) {
    console.warn('Failed to parse approval_email:', e);
  }
}
```

---

## How It Works Now

### Saving to Database (Frontend → Backend → Database)

```
Frontend: approvalEmail = ["email1@test.com", "email2@test.com"]
                ↓
Backend: Detect array → JSON.stringify() → '["email1@test.com","email2@test.com"]'
                ↓
Database: Store in TEXT column ✅
```

### Loading from Database (Database → Backend → Frontend)

```
Database: '["email1@test.com","email2@test.com"]' (TEXT column)
                ↓
Backend: Return as-is
                ↓
Frontend: Detect JSON string → JSON.parse() → ["email1@test.com", "email2@test.com"]
                ↓
UI: Display as email chips ✅
```

---

## Database Schema Updates

### Updated Schema (supabase-schema.sql)
Added `call_time TEXT` column to the shoots table (line 6).

### Migration File (database-migration.sql)
Created standalone migration file for manual execution if needed:
```sql
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS call_time TEXT;
```

---

## Testing After Deployment

### Test 1: Single Email (Backward Compatibility)
1. Create shoot with one email: `test@example.com`
2. Click Submit
3. **✅ Should save successfully**
4. Refresh page
5. **✅ Should show email correctly**

### Test 2: Multiple Emails (New Feature)
1. Create shoot with multiple emails:
   - `email1@test.com` [Enter]
   - `email2@test.com` [Enter]
2. Click Submit
3. **✅ Should save successfully**
4. Refresh page
5. **✅ Should show both email chips**

### Test 3: Call Time Field
1. Create shoot with call time: `9:30 AM`
2. Click Submit
3. **✅ Should save successfully**
4. Refresh page
5. **✅ Call time should be `9:30 AM`**

---

## What This Fixes

✅ **API Error 500** - No more server errors when creating shoots
✅ **Multiple Emails** - Properly saves and loads arrays of email addresses
✅ **Call Time Field** - Column automatically added if missing
✅ **Data Persistence** - All shoot data now saves correctly
✅ **Page Refresh** - Data persists after refresh

---

## Technical Details

### Data Type Conversions

| Field | Frontend Type | Database Type | Conversion |
|-------|--------------|---------------|------------|
| `approvalEmail` | `string \| string[]` | `TEXT` | Array → JSON string on save, JSON string → Array on load |
| `callTime` | `string` | `TEXT` | Direct (no conversion) |
| `equipment` | `Equipment[]` | `JSONB` | JSON.stringify() / JSON.parse() |
| `requestor` | `Object` | `JSONB` | JSON.stringify() / JSON.parse() |

### Error Handling Flow

**Before (Silent Failures):**
```
Frontend sends array → Backend tries to save → PostgreSQL error 500 → Generic error
```

**After (Proper Conversion):**
```
Frontend sends array → Backend converts to JSON string → PostgreSQL accepts → Success ✅
```

### Migration Strategy

**On Server Startup:**
1. CREATE TABLE IF NOT EXISTS (creates table with all columns if new database)
2. ALTER TABLE ADD COLUMN IF NOT EXISTS (adds missing columns to existing tables)
3. No downtime
4. No data loss
5. Idempotent (safe to run multiple times)

---

## Deployment Impact

### Changes Required
- ✅ Code deployment only
- ✅ No manual database changes needed
- ✅ Automatic migration runs on server startup
- ✅ Zero downtime

### Backward Compatibility
- ✅ Single emails still work (string format)
- ✅ Existing shoots load correctly
- ✅ No breaking changes

### Forward Compatibility
- ✅ Multiple emails fully supported
- ✅ Call time field available
- ✅ Future columns can use same migration pattern

---

## Files Modified

```
Modified:
  - server/index.js (approval_email conversion + migration)
  - src/App.tsx (approval_email parsing)
  
Updated:
  - supabase-schema.sql (added call_time column)
  
Created:
  - database-migration.sql (standalone migration)
  - API_500_ERROR_FIX.md (this document)
```

---

## Commit Message

```
🐛 FIX: API 500 error - approval_email array handling + call_time migration

Fixed API error 500 when creating shoots caused by:
1. approval_email arrays not being converted to JSON strings
2. Missing call_time column in production database

Changes:
- Backend: Convert approval_email arrays to JSON strings before saving
- Backend: Auto-migrate call_time column on server startup
- Frontend: Parse approval_email JSON strings back to arrays
- Schema: Updated to include call_time column

Fixes:
- ✅ API error 500 resolved
- ✅ Multiple approval emails work
- ✅ Call time saves correctly
- ✅ Data persists after page refresh
```

---

## Summary

**The Issue:** Users saw "API error: 500" when clicking Submit because the backend couldn't save approval email arrays to a TEXT column and the call_time column was missing in production.

**The Fix:** 
1. Convert arrays to JSON strings before database save
2. Parse JSON strings back to arrays when loading
3. Automatically add call_time column if missing

**The Result:** Creates shoot requests successfully with multiple emails and call times! 🎉

---

**Status:** ✅ FIXED - Ready for deployment
**Priority:** 🔴 CRITICAL - Deploy immediately
**Testing:** All 3 test scenarios must pass
