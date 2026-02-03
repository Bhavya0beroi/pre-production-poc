# Quick Demo Instructions

## 🎯 How to Test the New Features

Your development server is running at: **http://localhost:3000/**

---

## Feature 1: Email Chip Input (Gmail-style)

### Steps to Test:

1. **Open the app**: http://localhost:3000/

2. **Click "Create New Request"** button

3. **In the "Approval Email(s)" field:**

   **Test 1: Add single email**
   ```
   - Type: swati@company.com
   - Press: Enter
   - Result: Blue chip appears! 💙
   ```

   **Test 2: Add multiple emails**
   ```
   - Type: anish@company.com
   - Press: Enter
   - Type: finance@company.com
   - Press: Enter
   - Result: Three chips visible! 🎉
   ```

   **Test 3: Remove email**
   ```
   - Click the X on any chip
   - Result: Chip disappears! ✨
   ```

   **Test 4: Backspace to remove**
   ```
   - Make sure input is empty
   - Press: Backspace
   - Result: Last chip removed! 🔙
   ```

   **Test 5: Invalid email (shows red)**
   ```
   - Type: invalid-email
   - Press: Enter
   - Result: Red chip appears! ❌
   ```

   **Test 6: Comma separator**
   ```
   - Type: test@test.com,
   - Result: Chip added automatically! ⚡
   ```

---

## Feature 2: Time Picker

### Steps to Test:

1. **Still in Create Request form**

2. **Find the "Call Time" field** (below Location)

3. **Test the Time Picker:**

   **Test 1: Open picker**
   ```
   - Click: The "Select time" button
   - Result: Beautiful time picker opens! 🕐
   ```

   **Test 2: Select hour**
   ```
   - Scroll or click: Hour column (try 3)
   - Result: Hour 3 highlighted in blue! 💙
   ```

   **Test 3: Select minute**
   ```
   - Scroll or click: Minute column (try 30)
   - Result: Minute 30 highlighted! ⏰
   ```

   **Test 4: Toggle AM/PM**
   ```
   - Click: PM button
   - Result: PM becomes blue! 🌙
   ```

   **Test 5: See preview**
   ```
   - Look at blue box at bottom
   - Result: Shows "3:30 PM" 👀
   ```

   **Test 6: Confirm**
   ```
   - Click: "Confirm" button
   - Result: Time set, picker closes! ✅
   ```

4. **Test Manual Input:**

   **Test 7: Switch to manual**
   ```
   - Click: "Type Manually" link
   - Type: Morning 9
   - Result: Any format accepted! ✍️
   ```

   **Test 8: Switch back**
   ```
   - Click: "Use Picker" link
   - Result: Picker mode restored! 🔄
   ```

---

## Full Workflow Test

### Complete a Shoot Request:

1. **Requestor Name**: Your Name

2. **Approval Emails**: 
   - Add: `swati@company.com` (Enter)
   - Add: `anish@company.com` (Enter)

3. **Shoot Name**: Test Shoot

4. **Location**: Mumbai Studio

5. **Call Time**: 
   - Open picker
   - Select: 9:00 AM
   - Confirm

6. **Dates**: Select start and end dates

7. **Equipment**: Add some items from catalog

8. **Submit**: Click "Submit Request"

**Expected Result**: 
- Form submits successfully! ✅
- You'll see the dashboard with your new request
- Call time displays as "9:00 AM"
- Multiple emails stored correctly

---

## Visual Indicators to Watch For

### Email Chips
- ✅ **Blue chips** = Valid emails
- ❌ **Red chips** = Invalid format (but still accepted)
- **Hover effect** on X button
- **Chips wrap** to new line if needed

### Time Picker
- **Blue highlight** on selected hour/minute
- **Smooth scrolling** in columns
- **Live preview** updates as you select
- **Gradient fade** at top/bottom of scroll areas
- **Toggle link** switches modes instantly

---

## Keyboard Shortcuts

### Email Chips
- `Enter` → Add email
- `,` (comma) → Add email
- `Backspace` → Remove last chip (when input empty)
- `Tab` → Navigate between chips

### Time Picker
- `Click` → Select value
- `Scroll` → Navigate hour/minute
- `Esc` → Close picker (click outside)

---

## Troubleshooting

### If email chip doesn't appear:
- Make sure you pressed Enter or comma
- Check if email is already added (duplicates prevented)

### If time picker doesn't open:
- Make sure you're not in "Type Manually" mode
- Click directly on the time field
- Try clicking outside first to close, then reopen

### If time picker is cut off:
- Scroll the form down slightly
- The picker is positioned absolutely

---

## Screenshots to Verify

### Email Chips Should Look Like:
```
┌─────────────────────────────────────────┐
│ [swati@company.com ×] [anish@... ×]    │
│ Type and press Enter_                   │
└─────────────────────────────────────────┘
```

### Time Picker Should Look Like:
```
┌──────────────────────────┐
│    Select Time           │
├──────────────────────────┤
│  ┌───┐ ┌───┐ ┌────┐    │
│  │ 8 │ │58 │ │ AM │    │
│  │►9◄│ │►0◄│ │────│    │
│  │10 │ │ 1 │ │ PM │    │
│  └───┘ └───┘ └────┘    │
│                          │
│  ┌──────────────────┐   │
│  │    9:00 AM       │   │
│  └──────────────────┘   │
│                          │
│  [    Confirm    ]       │
└──────────────────────────┘
```

---

## 🎬 Demo Script

**30-Second Demo:**

1. Open app → Create Request (5s)
2. Add 2 emails with Enter key (5s)
3. Open time picker → Select 9:30 AM (10s)
4. Fill remaining fields → Submit (10s)

**Expected:** Professional, smooth UX! 🚀

---

## Next Steps After Testing

If everything works:
1. ✅ Test locally (done!)
2. ✅ Commit changes
3. ✅ Push to GitHub
4. ✅ Deploy to Railway
5. 🎉 Production ready!

---

**Server Running:** http://localhost:3000/  
**Status:** Ready for Testing! 🟢  
**Last Updated:** Feb 3, 2026
