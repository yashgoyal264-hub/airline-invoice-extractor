# TravelPlus Invoice Extractor - Complete Setup Guide

## 📋 Prerequisites
- Google account with access to Google Sheets and Apps Script
- The TravelPlus Invoice Extractor application files
- Web browser (Chrome/Firefox/Safari)

## 🚀 Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Blank"** to create a new spreadsheet
3. Name it: **"TravelPlus Invoice Logs"**
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SPREADSHEET_ID]/edit
   ```
   Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123XYZ789/edit`
   Your ID is: `1abc123XYZ789`

5. Keep this ID handy - you'll need it in Step 2

## 🔧 Step 2: Deploy Google Apps Script

### A. Open Apps Script Editor

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy ALL the code from `GOOGLE_APPS_SCRIPT_FINAL.js`
4. Paste it into the Apps Script editor

### B. Configure the Script

1. Find line 13 in the code:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // <-- REPLACE THIS!
   ```

2. Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID from Step 1:
   ```javascript
   const SPREADSHEET_ID = '1abc123XYZ789'; // Your actual ID
   ```

3. Click **💾 Save** (Ctrl+S or Cmd+S)
4. Name the project: **"TravelPlus Logger"**

### C. Deploy as Web App

1. Click **Deploy → New Deployment** button (top right)

2. In the deployment dialog:
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **"Web app"**

3. Configure deployment settings:
   - **Description**: "TravelPlus Invoice Logger v1.0"
   - **Execute as**: "Me" (your email)
   - **Who has access**: "Anyone" ⚠️ (Required for the app to work)

4. Click **Deploy**

5. **IMPORTANT**: Copy the Web App URL that appears:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
   This is your deployment URL - save it!

6. Click **Done**

## 🔗 Step 3: Configure the Application

1. Open the file: `config/constants.js`

2. Find this line (around line 4):
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```

3. Replace it with your Web App URL from Step 2.C.5:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
   ```

4. Save the file

## ✅ Step 4: Test the Connection

### A. Test from Apps Script

1. In Apps Script editor, click **Run** button
2. Select function: `testLogging`
3. Click **Run**
4. Check your Google Sheet - you should see test data in "Usage Log" sheet

### B. Test from Application

1. Open `index.html` in your browser
2. Open Developer Console (F12)
3. Enter your email (@fabhotels.com or @travelplusapp.com)
4. Process a test PDF
5. Check your Google Sheet for new log entries

## 📊 Step 5: Verify Sheet Structure

After first run, your Google Sheet should have:

### "Usage Log" Sheet
- Headers: Timestamp, User Email, Session ID, Event Type, etc.
- Automatically formatted with colors and column widths
- Data validation on Event Type column

### "Summary" Sheet  
- Overall statistics
- Top users by sessions
- Auto-calculated metrics

## 🛠️ Troubleshooting

### Issue: "Script not found" error
**Solution**: Check that the Web App URL in constants.js is correct and ends with `/exec`

### Issue: No data appearing in Sheet
**Solution**: 
1. Check browser console for errors
2. Verify SPREADSHEET_ID is correct
3. Ensure Web App is deployed with "Anyone" access

### Issue: "Permission denied" error
**Solution**: 
1. In Apps Script, click **Deploy → Manage Deployments**
2. Ensure "Who has access" is set to "Anyone"
3. Create a new deployment if needed

### Issue: Test connection fails
**Solution**:
1. In Apps Script editor, go to **View → Executions**
2. Check for any error messages
3. Verify the SPREADSHEET_ID matches your sheet

## 🔄 Updating the Script

If you need to update the Apps Script:

1. Make changes in Apps Script editor
2. Click **Save**
3. Click **Deploy → Manage Deployments**
4. Click **Edit** ✏️ on active deployment
5. **Version**: Select "New version"
6. **Description**: Add update notes
7. Click **Deploy**
8. The URL remains the same - no need to update constants.js

## 📝 Manual Operations

### View Logs
- Open your Google Sheet directly to see all logged data
- Summary sheet auto-updates with statistics

### Clean Old Logs (Optional)
1. In Apps Script editor
2. Select function: `cleanupOldLogs`
3. Click **Run**
4. This removes logs older than 30 days

### Export Data
- In Google Sheets: **File → Download → CSV**
- Or use Sheets API for programmatic access

## 🎯 Quick Checklist

- [ ] Created Google Sheet
- [ ] Copied Spreadsheet ID
- [ ] Pasted Apps Script code
- [ ] Replaced SPREADSHEET_ID in script
- [ ] Deployed as Web App
- [ ] Copied deployment URL
- [ ] Updated constants.js with URL
- [ ] Tested connection
- [ ] Verified data logging

## 📞 Need Help?

1. Check browser console for detailed error messages
2. Verify all IDs and URLs are correctly copied
3. Ensure you're logged into correct Google account
4. Try redeploying the Web App with a new version

---

**Note**: The Google Sheet will automatically create required sheets and formatting on first use. No manual sheet setup needed!