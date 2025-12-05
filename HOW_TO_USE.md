# 📖 How to Use TravelPlus Invoice Extractor

## 🚀 Quick Start

### Step 1: Access the Application
Open your browser and go to:
- **Local**: http://localhost:8888
- **Network**: http://192.168.98.216:8888 (share this with colleagues)

### Step 2: Login
Enter your email address:
- Must be `@fabhotels.com` or `@travelplusapp.com`

### Step 3: Upload PDF Files

#### ✅ Method 1: Direct Upload (RECOMMENDED)
1. **Drag & Drop**: Simply drag PDF files onto the upload area
2. **Click to Browse**: Click the upload area to select files
3. **Multiple Files**: You can select/drop multiple PDFs at once (up to 50)

#### ⚠️ Method 2: Google Drive (NOT WORKING)
- **Currently disabled** due to browser security restrictions
- **Workaround**: Download PDFs from Drive first, then upload them

### Step 4: Process Invoices
1. Click **"Process Invoices"** button
2. Wait for processing to complete
3. View the progress for each file

### Step 5: Download Results
1. Review the extracted data in the preview table
2. Click **"Download CSV"** to get your data
3. The CSV will have all 28 required columns

## 📊 What Data is Extracted?

The tool extracts:
- Invoice numbers and dates
- GST details
- Passenger names and PNR
- Flight information
- Tax breakdowns (CGST, SGST, IGST)
- Meal charges
- Grand totals

## 🔄 Processing Multiple Files

1. You can process up to **50 PDFs** in one batch
2. Each file is processed independently
3. Failed files won't affect successful ones
4. Error details are shown for troubleshooting

## 📈 Usage Tracking

All usage is automatically logged to Google Sheets:
- Number of files processed
- Success rate
- Processing time
- Total invoice amounts

## ⚠️ Common Issues & Solutions

### Issue: Google Drive links not working
**Solution**: Download PDFs from Drive to your computer first, then upload directly

### Issue: PDF not extracting correctly
**Solutions**:
- Ensure PDF is an IndiGo invoice
- Check if PDF is text-based (not scanned image)
- Try downloading the PDF again if corrupted

### Issue: Missing data in CSV
**Solutions**:
- Check the invoice format matches IndiGo standard
- Some fields may be genuinely missing from invoice
- Review error messages for specific issues

## 💡 Tips for Best Results

1. **Batch Processing**: Process multiple invoices at once to save time
2. **File Names**: Keep original file names for easier tracking
3. **Check Preview**: Review the preview table before downloading CSV
4. **Error Handling**: Files with errors are listed separately

## 🛟 Need Help?

1. Check the error messages in the app
2. Ensure you're using IndiGo invoices
3. Try with a smaller batch if having issues
4. Contact IT support if persistent problems

---

**Note**: This tool is optimized for IndiGo airline invoices. Other airline formats may not work correctly.