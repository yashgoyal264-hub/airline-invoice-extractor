# 🚀 TravelPlus Invoice Extractor - Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create Google Sheet (1 minute)
```
1. Open: https://sheets.google.com
2. Click: "+ Blank"
3. Name: "TravelPlus Invoice Logs"
4. Copy ID from URL: docs.google.com/spreadsheets/d/[COPY_THIS_ID]/edit
```

### Step 2: Deploy Apps Script (3 minutes)
```
1. In Sheet: Extensions → Apps Script
2. Delete existing code
3. Paste code from GOOGLE_APPS_SCRIPT_FINAL.js
4. Replace line 13: const SPREADSHEET_ID = 'YOUR_ID_HERE';
5. Save (Ctrl+S)
6. Deploy → New Deployment → Web app
   - Execute as: Me
   - Access: Anyone
7. Copy the Web App URL
```

### Step 3: Configure App (1 minute)
```
1. Open: config/constants.js
2. Replace: APPS_SCRIPT_URL: 'YOUR_WEB_APP_URL_HERE',
3. Save file
```

### Step 4: Test
```
1. Open index.html in browser
2. Login with @fabhotels.com email
3. Process a test PDF
4. Check Google Sheet for data
```

---

## 📁 Project Structure

```
travelplus-invoice-extractor/
│
├── index.html                    # Main application
├── test.html                     # Test utilities
├── debug-test.html              # Debug tools
│
├── config/
│   └── constants.js             # ← UPDATE THIS with Web App URL
│
├── auth/
│   ├── authentication.js        # User authentication
│   └── emailValidation.js       # Email domain validation
│
├── utils/
│   ├── pdfParser.js            # PDF text extraction
│   ├── dataExtractor.js        # Invoice data extraction
│   ├── csvGenerator.js         # CSV file generation
│   ├── driveHandler.js         # Google Drive integration
│   └── logger.js               # Usage logging
│
├── styles/
│   └── main.css                # Application styles
│
└── GOOGLE_APPS_SCRIPT_FINAL.js # ← COPY THIS to Apps Script
```

---

## 🔐 Security Configuration

### Email Domain Restrictions
The app only allows access to:
- `@fabhotels.com`
- `@travelplusapp.com`

To add more domains, edit `config/constants.js`:
```javascript
VALID_DOMAINS: ['@fabhotels.com', '@travelplusapp.com', '@newdomain.com']
```

### Google Apps Script Permissions
The Web App must be deployed with "Anyone" access for the application to log data. The script itself only writes to your specific Google Sheet.

---

## 📊 Google Sheets Structure

### Usage Log Sheet (Auto-created)
| Column | Description | Example |
|--------|-------------|---------|
| Timestamp | Log entry time | 2025-01-26T10:30:00Z |
| User Email | User who processed | user@fabhotels.com |
| Session ID | Unique session | uuid-1234-5678 |
| Event Type | Action type | process_complete |
| Number of Files | PDFs processed | 5 |
| Processing Time | Duration in seconds | 12.5 |
| Success Rate | % successful | 100 |
| Error Count | Failed extractions | 0 |
| Total Amount | Sum of invoices | 25000 |

### Summary Sheet (Auto-created)
- Total sessions count
- Total files processed
- Unique users count
- Average success rate
- Total processing time
- Top 10 users by activity

---

## 🧪 Testing Tools

### Test Page (`test.html`)
Access testing utilities:
1. Configuration validator
2. Email domain checker
3. PDF parser tester
4. Drive link validator
5. CSV generator test

### Debug Page (`debug-test.html`)
Deep debugging for extraction:
1. Upload any PDF
2. See raw text extraction
3. Test individual patterns
4. View extraction results
5. Identify parsing issues

---

## 🔄 Updating Process

### Update Apps Script
```bash
1. Open Apps Script editor
2. Make changes
3. Save (Ctrl+S)
4. Deploy → Manage Deployments
5. Edit → New Version → Deploy
```
*Note: URL stays the same, no app update needed*

### Update Application
```bash
1. Edit relevant JS files
2. Test locally
3. No deployment needed (client-side only)
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Script not found"
```
Fix: Verify Web App URL ends with /exec
     Check for typos in constants.js
```

### Issue 2: No data in Sheet
```
Fix: Check browser console (F12)
     Verify SPREADSHEET_ID is correct
     Ensure "Anyone" access in deployment
```

### Issue 3: Authentication fails
```
Fix: Email must end with approved domain
     Clear browser localStorage
     Check emailValidation.js
```

### Issue 4: PDF extraction errors
```
Fix: Use debug-test.html to analyze
     Check PDF is text-based (not scanned)
     Verify IndiGo invoice format
```

---

## 📈 Performance Tips

1. **Batch Processing**: Process multiple PDFs at once for better efficiency
2. **File Size**: Keep PDFs under 10MB for optimal performance
3. **Browser**: Use Chrome/Firefox for best PDF.js compatibility
4. **Network**: Stable internet required for Google Sheets logging

---

## 🔧 Advanced Configuration

### Custom Invoice Patterns
Edit `utils/dataExtractor.js` to add new airline formats:
```javascript
// Add new pattern for different airline
extractCustomAirline(text) {
    const pattern = /your-pattern-here/;
    // ... extraction logic
}
```

### Additional CSV Columns
Modify `config/constants.js`:
```javascript
CSV_HEADERS: [
    ...existing_headers,
    'New Column Name'
]
```

Then update `utils/dataExtractor.js` to extract the new field.

---

## 📱 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

---

## 💡 Pro Tips

1. **Test First**: Always use test.html before processing real invoices
2. **Monitor Logs**: Check Google Sheets Summary tab for usage patterns
3. **Debug Mode**: Use debug-test.html for problematic PDFs
4. **Backup**: Download CSV after each batch for local backup
5. **Clean Logs**: Run cleanupOldLogs monthly to maintain performance

---

## 📞 Support Checklist

Before requesting help, check:
- [ ] Correct email domain (@fabhotels.com or @travelplusapp.com)
- [ ] SPREADSHEET_ID properly set in Apps Script
- [ ] Web App URL correctly copied to constants.js
- [ ] Browser console for JavaScript errors
- [ ] Google Sheet has edit permissions
- [ ] PDF is text-based (not scanned image)
- [ ] IndiGo invoice format (other airlines may fail)

---

**Ready to Deploy!** 🎉

Follow the Quick Start section above to get running in 5 minutes.