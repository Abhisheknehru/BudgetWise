# 🔗 BudgetWise → Google Sheets Setup Guide

## Step 1: Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a **New Blank Spreadsheet**
3. Rename it to **"BudgetWise Data"** (or anything you like)
4. In **Row 1**, add these headers (one per cell):

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Date | Type | Category | Note | Amount | Synced At |

5. **Bold** the header row and freeze it (View → Freeze → 1 row)

---

## Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. **Delete** all the existing code in the editor
3. **Paste** the following script:

```javascript
// ===== BudgetWise Google Sheets Sync Script =====
// Paste this in Extensions → Apps Script

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-create headers if missing
    if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== 'Date') {
      sheet.getRange(1, 1, 1, 6).setValues([['Date', 'Type', 'Category', 'Note', 'Amount', 'Synced At']]);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Form submission puts decoded value in e.parameter.payload
    var rawData;
    if (e.parameter && e.parameter.payload) {
      rawData = e.parameter.payload;
    } else if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    }

    if (!rawData) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'No data received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);
    var transactions = data.transactions;
    var now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    if (data.action === 'sync') {
      // Clear old data (keep headers)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn() || 6).clear();
      }

      // Group transactions by date
      var dateGroups = {};
      transactions.forEach(function(t) {
        if (!dateGroups[t.date]) dateGroups[t.date] = [];
        dateGroups[t.date].push(t);
      });

      var dates = Object.keys(dateGroups).sort();

      dates.forEach(function(date, dateIndex) {
        var group = dateGroups[date];
        var dayIncome = 0;
        var dayExpense = 0;

        // Write each transaction for this date
        group.forEach(function(t) {
          var amt = Number(t.amount);
          if (t.type === 'Income') dayIncome += amt;
          else dayExpense += amt;

          sheet.appendRow([
            t.date,
            t.type,
            t.category || '',
            t.note || '',
            (t.type === 'Income' ? '+' : '-') + amt,
            now
          ]);
        });

        // Add daily total row
        var totalRow = sheet.getLastRow() + 1;
        sheet.appendRow([
          '',
          '',
          '',
          'DAY TOTAL (' + date + ')',
          'Income: +' + dayIncome + ' | Expense: -' + dayExpense + ' | Net: ' + (dayIncome - dayExpense),
          ''
        ]);
        // Bold the total row
        sheet.getRange(totalRow, 1, 1, 6).setFontWeight('bold');
        sheet.getRange(totalRow, 1, 1, 6).setBackground('#f0f0f0');

        // Add separator line between days (not after the last day)
        if (dateIndex < dates.length - 1) {
          sheet.appendRow(['', '', '', '', '', '']);
        }
      });

      sheet.autoResizeColumns(1, 6);

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Synced ' + transactions.length + ' transactions',
          count: transactions.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// This handles GET requests - useful for testing
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'BudgetWise Sheets API is running!'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **💾 Save** (or Ctrl+S)
5. Name the project **"BudgetWise Sync"**

---

## Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the ⚙️ gear icon next to "Select type" → choose **Web app**
3. Set these options:
   - **Description**: BudgetWise Sync
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. **Authorize** the app when prompted (click through the warnings)
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/ABCDEF.../exec
   ```

---

## Step 4: Add the URL to BudgetWise

1. Open BudgetWise app
2. Go to the **Export** tab
3. Click **🔗 Connect Google Sheets**
4. Paste the Web App URL
5. Click **Save & Test**
6. Once connected, use **"☁️ Sync to Google Sheets"** to push all your data!

---

## ✅ Done!

Your data will now sync to Google Sheets. You can:
- **Download** the sheet as Excel/CSV from Google Sheets (File → Download)
- **View** your data from any device
- **Share** the sheet with anyone

---

## 🔄 Re-deploying After Script Changes

If you ever modify the Apps Script:
1. Go to **Deploy → Manage deployments**
2. Click the ✏️ edit icon
3. Under **Version**, select **New version**
4. Click **Deploy**
5. The URL stays the same!
