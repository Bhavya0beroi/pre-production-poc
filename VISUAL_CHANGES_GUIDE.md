# Visual Changes Guide

## Feature 1: Call Time Field

### Location in UI

#### 1. Create Request Form (New)
```
┌─────────────────────────────────────────────────┐
│  Create New Request                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Requestor Name:  [Your name          ]        │
│  Approval Email(s): [email1@..., email2@...]   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ SHOOT 1                                  │  │
│  │                                          │  │
│  │  Shoot Name:  [Diwali Ad Campaign    ]  │  │
│  │  Location:    [Studio 5, Mumbai      ]  │  │
│  │  Call Time:   [9:00 AM               ]  │ ← NEW FIELD
│  │                                          │  │
│  │  Start Date:  [Jan 10]                  │  │
│  │  End Date:    [Jan 12]                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Submit Request]                               │
└─────────────────────────────────────────────────┘
```

#### 2. Vendor Quote Form (Single Shoot)
```
┌─────────────────────────────────────────────────┐
│  Quote Request                                  │
│  Brand Video Shoot                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Shoot Date: Jan 10 - Jan 12                   │
│  Location: Studio 5, Mumbai                     │
│  Call Time: 9:00 AM                             │ ← DISPLAYS HERE
│                                                 │
│  Edit Quote                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ Item           Qty    Your Price        │  │
│  │ Camera Sony    2      [₹3000]           │  │
│  │ Lens 24-70mm   1      [₹1200]           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Submit Final Quote]                           │
└─────────────────────────────────────────────────┘
```

#### 3. Vendor Quote Form (Multi-Shoot)
```
┌─────────────────────────────────────────────────┐
│  Quote Request                                  │
│  2 shoots • Pre-Production Team                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 1  Shoot 1       │  │ 2  Shoot 2       │   │
│  │ Jan 10 • Mumbai  │  │ Jan 12 • Delhi   │   │
│  │ Call Time: 9AM   │  │ Call Time: 10AM  │   │ ← DISPLAYS HERE
│  │ 5 items          │  │ 3 items          │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
│  [Submit Quote for 2 Shoots]                    │
└─────────────────────────────────────────────────┘
```

---

## Feature 2: Multiple Approval Emails

### Location in UI

#### Create Request Form (Updated)
```
┌─────────────────────────────────────────────────┐
│  Create New Request                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Requestor Name:                                │
│  [Anish Kumar                               ]   │
│                                                 │
│  Approval Email(s) (comma-separated for multiple) ← UPDATED LABEL
│  [swati@company.com, anish@company.com     ]   │ ← UPDATED PLACEHOLDER
│                                                 │
└─────────────────────────────────────────────────┘
```

### How It Works

#### Single Email (Existing Behavior)
```
Input: swati@company.com
Result: Email sent to → swati@company.com
```

#### Multiple Emails (New Feature)
```
Input: swati@company.com, anish@company.com
Result: 
  → Email sent to swati@company.com
  → Email sent to anish@company.com
```

#### With Semicolon Separator
```
Input: swati@company.com; anish@company.com
Result: 
  → Email sent to swati@company.com
  → Email sent to anish@company.com
```

#### With Extra Spaces (Automatically Cleaned)
```
Input: swati@company.com,  anish@company.com ,   finance@company.com
Result: 
  → Email sent to swati@company.com
  → Email sent to anish@company.com
  → Email sent to finance@company.com
```

---

## Email Notifications

### Email Flow with Multiple Recipients

```
┌─────────────────────────────────────────────────┐
│  New Request Created                            │
│  ↓                                              │
│  triggerEmail() called                          │
│  ↓                                              │
│  Parse approval emails:                         │
│  [swati@..., anish@..., finance@...]           │
│  ↓                                              │
│  For each email:                                │
│    → Send email to recipient                    │
│    → Add notification to UI                     │
│    → Add activity to shoot                      │
│  ↓                                              │
│  All emails sent ✓                              │
└─────────────────────────────────────────────────┘
```

### Notification UI (Example)

```
┌─────────────────────────────────────────────────┐
│  🔔 Notifications                               │
├─────────────────────────────────────────────────┤
│  ✉️  Email sent to swati@company.com           │
│      New Shoot Request - Brand Video           │
│      Just now                                   │
├─────────────────────────────────────────────────┤
│  ✉️  Email sent to anish@company.com           │
│      New Shoot Request - Brand Video           │
│      Just now                                   │
├─────────────────────────────────────────────────┤
│  ✉️  Email sent to finance@company.com         │
│      New Shoot Request - Brand Video           │
│      Just now                                   │
└─────────────────────────────────────────────────┘
```

---

## Field Validation

### Call Time Field
- **Required:** No (optional field)
- **Format:** Free text (any format accepted)
- **Examples:**
  - ✓ "9:00 AM"
  - ✓ "09:00"
  - ✓ "Morning 9"
  - ✓ "9 AM - Report time"

### Approval Email(s) Field
- **Required:** Yes
- **Format:** Email(s) separated by comma or semicolon
- **Examples:**
  - ✓ "swati@company.com"
  - ✓ "swati@company.com, anish@company.com"
  - ✓ "email1@test.com; email2@test.com"
  - ✓ "a@test.com,b@test.com,c@test.com"

---

## Database Storage

### Call Time
```sql
-- Stored as TEXT in shoots table
call_time: "9:00 AM"
```

### Approval Emails
```sql
-- Can be stored as:
-- Single email (string)
approval_email: "swati@company.com"

-- Multiple emails (comma-separated string or JSON array)
approval_email: "swati@company.com,anish@company.com"
-- OR
approval_email: ["swati@company.com", "anish@company.com"]
```

---

## Backward Compatibility

### Existing Shoots Without Call Time
- ✓ Will load normally
- ✓ Call time field shows as empty
- ✓ Vendor form handles missing call time gracefully

### Existing Shoots With Single Email
- ✓ Will continue to work exactly as before
- ✓ Single email is treated as array of one
- ✓ No migration needed

---

## User Experience Improvements

### Before Changes
```
❌ Only one approval email allowed
❌ No call time information
❌ Manual coordination needed for time
```

### After Changes
```
✅ Multiple approvers can be notified
✅ Call time clearly specified in request
✅ Vendors see exact reporting time
✅ Better coordination and clarity
```

---

## Mobile Responsiveness

Both features maintain full mobile responsiveness:
- Call time field: Full width on mobile
- Multiple emails: Text wraps naturally
- Vendor form: Call time displays below location on mobile

---

## Accessibility

- ✓ Proper label associations
- ✓ Descriptive placeholder text
- ✓ Screen reader friendly
- ✓ Keyboard navigation supported

---

**Status:** Ready for Use  
**Testing:** No breaking changes  
**Documentation:** Complete
