# ⚠️ IMPORTANT: Google Drive Links Limitation

## Issue with Google Drive Links
Due to browser security restrictions (CORS policy), Google Drive files **cannot be directly downloaded** from the web application. This is a limitation enforced by Google for security reasons.

## ✅ Working Features
- **Direct PDF Upload**: Drag and drop or select PDF files directly - **THIS WORKS PERFECTLY**
- **Multiple file processing**: Process many PDFs at once
- **Data extraction**: All extraction features work correctly
- **CSV export**: Download results as CSV
- **Google Sheets logging**: Usage tracking works

## ❌ Not Working
- **Google Drive Links**: Cannot download files from Drive links due to CORS restrictions

## 🔧 Solutions

### Option 1: Direct File Upload (RECOMMENDED)
1. Download the PDF files from Google Drive to your computer first
2. Then upload them directly to the TravelPlus Invoice Extractor
3. This method works perfectly without any restrictions

### Option 2: Use Google Drive Desktop App
1. Install Google Drive for Desktop
2. Access your files locally through the synced folder
3. Upload them directly to the application

### Option 3: Server-Side Proxy (Advanced)
For production use, implement a server-side proxy that:
1. Receives the Drive link from the browser
2. Downloads the file on the server
3. Sends it back to the browser
This requires backend development.

## 📝 How to Use the App Currently

1. **Get your PDFs ready**:
   - Download them from Google Drive to your computer
   - Or have them saved locally

2. **Open the app**: http://localhost:8888

3. **Upload PDFs**:
   - Drag and drop multiple PDFs onto the upload area
   - Or click to select files

4. **Process and Download**:
   - Click "Process Invoices"
   - Download the CSV with extracted data

## 🚀 For Production Deployment

If you need Google Drive integration to work, consider:
1. Using Google Drive API with proper OAuth authentication
2. Implementing a Node.js backend to handle Drive downloads
3. Using a service like Zapier or Make to automate the workflow

---

**Note**: The core functionality of the invoice extractor works perfectly with direct file uploads. The Drive link feature is a convenience that's limited by browser security policies.