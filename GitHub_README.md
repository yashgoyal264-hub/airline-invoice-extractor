# 🧾 TravelPlus Invoice Extractor

A web-based tool for extracting structured data from airline invoices (PDF files) and converting them to CSV format.

## 🌐 Live Application

**Access the tool here**: [https://fabhotels.github.io/travelplus-invoice-extractor](https://fabhotels.github.io/travelplus-invoice-extractor)

## 🔐 Access Requirements

- Must use official email addresses: `@fabhotels.com` or `@travelplusapp.com`
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## ✨ Features

- **Batch Processing**: Handle up to 50 invoices simultaneously
- **Multiple Input Methods**: File upload + Google Drive links
- **Automated Extraction**: Extract all invoice fields automatically  
- **CSV Export**: Generate CSV with required column format
- **Real-time Progress**: Track processing status
- **Usage Logging**: Comprehensive tracking via Google Sheets

## 🚀 Quick Start

1. Go to the live application URL
2. Enter your official email address
3. Upload PDF invoices or paste Google Drive links
4. Click "Process Invoices"
5. Download the generated CSV file

## 📋 CSV Output Columns

- Document Type, Airline Invoice no., Airline Invoice Date
- Airline GST No., Passenger Name, PNR, Flight No.
- From, To, Place of Supply, Client GST No.
- GSTIN Customer Name, Taxable Value, Non Taxable Value
- CGST Amount & %, SGST Amount & %, IGST Amount & %
- Meal charges and taxes, Grand Total

## 🛠️ Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PDF Processing**: PDF.js (client-side)
- **Hosting**: GitHub Pages (static hosting)
- **Authentication**: Email domain validation
- **Logging**: Google Sheets API integration

## 🔒 Security & Privacy

- All PDF processing happens client-side in your browser
- No sensitive data is sent to external servers  
- Only usage metadata is logged to Google Sheets
- Files are not stored or transmitted anywhere

## 📞 Support

For technical issues:
1. Check browser console for error messages
2. Ensure you're using a supported browser
3. Verify email domain is correct
4. Contact the development team with specific error details

---

**For Internal Use Only - FabHotels and TravelPlus**