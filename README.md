# 🧾 TravelPlus Invoice Extractor

A comprehensive web application for extracting structured data from airline invoices (PDF files) and exporting to CSV format. Designed for FabHotels and TravelPlus employees to automate invoice data extraction for accounting/finance teams.

## 🌐 Live Application

**🚀 Access the tool here**: [https://yashgoyal264-hub.github.io/airline-invoice-extractor/](https://yashgoyal264-hub.github.io/airline-invoice-extractor/)

*This is a permanent, free URL that never expires!*

## ✨ Features

✅ **User Authentication**: Email-based access control with domain validation (@fabhotels.com, @travelplusapp.com)  
✅ **Usage Logging**: Comprehensive tracking via Google Sheets integration  
✅ **Dual Input Support**: File upload + Google Drive links  
✅ **Batch Processing**: Handle up to 50 invoices simultaneously  
✅ **Data Extraction**: Automated extraction of all invoice fields  
✅ **CSV Export**: Generate CSV with exact column format required  
✅ **Progress Tracking**: Real-time processing status updates  
✅ **Error Handling**: Detailed error reporting and validation  

## 🚀 Quick Start

1. **Go to**: [https://yashgoyal264-hub.github.io/airline-invoice-extractor/](https://yashgoyal264-hub.github.io/airline-invoice-extractor/)
2. **Enter your official email** (@fabhotels.com or @travelplusapp.com)
3. **Upload PDF invoices** or paste Google Drive links
4. **Click "Process Invoices"**
5. **Download the generated CSV file**

## Setup Instructions

### 1. Google Sheets Integration Setup

#### Create Google Sheet
1. Create a new Google Sheet for logging
2. Note the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

#### Deploy Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the entire content from `google-apps-script.js`
4. Replace `YOUR_SPREADSHEET_ID` with your Sheet ID
5. Save the project

#### Deploy as Web App
1. Click **Deploy > New Deployment**
2. Choose type: **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web App URL

#### Update Configuration
1. Open `config/constants.js`
2. Replace `YOUR_DEPLOYMENT_ID` in `APPS_SCRIPT_URL` with your Web App URL
3. Save the file

### 2. Local Setup

#### Option A: Direct File Opening
1. Simply open `index.html` in any modern web browser
2. No server required for basic functionality

#### Option B: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### 3. Deployment Options

#### Option A: Static Hosting
Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Google Firebase Hosting

#### Option B: Web Server
Upload all files to your web server's public directory.

## File Structure

```
travelplus-invoice-extractor/
├── index.html                 # Main HTML file
├── styles.css                 # Application styles
├── app.js                     # Main application logic
├── auth/
│   ├── authentication.js      # Authentication logic
│   └── emailValidation.js     # Email validation
├── utils/
│   ├── pdfParser.js          # PDF parsing using PDF.js
│   ├── dataExtractor.js      # Invoice data extraction
│   ├── csvGenerator.js       # CSV generation
│   ├── driveHandler.js       # Google Drive integration
│   ├── logger.js             # Google Sheets logging
│   └── sessionManager.js     # Session management
├── config/
│   └── constants.js          # Configuration constants
├── google-apps-script.js     # Google Apps Script code
└── README.md                 # This file
```

## CSV Output Format

The generated CSV includes the following columns:
- Document Type
- Airline Invoice no.
- Airline Invoice Date
- Airline GST No.
- Passenger Name
- PNR
- Flight No.
- From
- To
- Place of Supply
- Client GST No.
- GSTIN Customer Name
- Taxable Value
- Non Taxable Value
- CGST Amount & %
- SGST Amount & %
- IGST Amount & %
- Meal charges and taxes
- Grand Total

## Usage Tracking

The application logs the following data to Google Sheets:
- User Email
- Session ID
- Timestamp
- Number of Files Processed
- Processing Time
- Success Rate
- Error Count
- Tool Version

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- All PDF processing happens client-side
- No sensitive data is sent to external servers
- Only usage metadata is logged to Google Sheets
- Email validation is for access control only

## Troubleshooting

### Google Drive Links Not Working
- Ensure the PDF files are publicly accessible or shared with "Anyone with the link"
- Try using the direct download URL format: `https://drive.google.com/uc?id=FILE_ID&export=download`

### Google Sheets Logging Not Working
1. Verify the Google Apps Script is deployed correctly
2. Check that the Web App URL is updated in `config/constants.js`
3. Ensure "Anyone" access is enabled in deployment settings

### PDF Extraction Issues
- Ensure PDFs are text-based (not scanned images)
- For scanned PDFs, OCR processing would be needed (not currently implemented)
- Check that invoice format matches expected IndiGo format

### Authentication Issues
- Clear browser localStorage and try again
- Ensure email domain is exactly @fabhotels.com or @travelplusapp.com

## 🚀 Hosting & Deployment

### Current Deployment
- **Platform**: GitHub Pages (Free, Permanent)
- **Live URL**: [https://yashgoyal264-hub.github.io/airline-invoice-extractor/](https://yashgoyal264-hub.github.io/airline-invoice-extractor/)
- **Repository**: [https://github.com/yashgoyal264-hub/airline-invoice-extractor](https://github.com/yashgoyal264-hub/airline-invoice-extractor)
- **Hosting Type**: Static Site (Client-side processing)
- **SSL Certificate**: ✅ Automatic HTTPS
- **Uptime**: 99.9% (GitHub Infrastructure)
- **Cost**: 100% Free Forever

### Benefits of GitHub Pages Hosting
✅ **Permanent URL**: Never expires  
✅ **Global CDN**: Fast worldwide access  
✅ **Zero Maintenance**: Auto-updates on code push  
✅ **Professional**: Custom domain support available  
✅ **Reliable**: Enterprise-grade infrastructure  
✅ **Secure**: Automatic SSL/TLS encryption  

### Making Updates
To update the application:
```bash
# Make your changes to the code
git add .
git commit -m "Update description"
git push origin main
# Changes will be live in 1-2 minutes automatically
```

## 📱 Browser Requirements

- **Chrome**: 90+ (Recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

*All PDF processing happens client-side in your browser for security and privacy.*

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Contact the development team with specific error details

## 📋 Version History

**Current Version: 2.0.0** (December 5, 2025)

### v2.0.0 - Permanent Hosting Update
- ✅ **NEW**: Deployed to GitHub Pages for permanent hosting
- ✅ **NEW**: Permanent URL that never expires
- ✅ **IMPROVED**: Enhanced README with deployment information
- ✅ **IMPROVED**: Added comprehensive hosting documentation
- 🔧 **TECHNICAL**: Migrated from temporary Cloudflare tunnels

### v1.0.0 - Initial Release
- ✅ User authentication with domain validation
- ✅ PDF upload and Google Drive integration
- ✅ Batch processing up to 50 invoices
- ✅ Automated data extraction from IndiGo invoices
- ✅ CSV export functionality
- ✅ Google Sheets usage logging

## 📄 License

Internal use only - FabHotels and TravelPlus

---

**Note**: This tool is designed specifically for IndiGo airline invoices but can be adapted for other airlines by modifying the extraction patterns in `dataExtractor.js`.