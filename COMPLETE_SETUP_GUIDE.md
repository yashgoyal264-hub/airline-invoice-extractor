# 🚀 TravelPlus Invoice Extractor - Complete Setup Guide

## ✅ Full Google Drive Support Now Available!

With the Python backend, you can now:
- Download files directly from Google Drive links
- Process multiple Drive files at once
- No need to manually download files first

## 📋 Quick Start (2 Servers Required)

### Step 1: Start the Python Backend (for Google Drive)
```bash
cd backend
./start_backend.sh
```
Or manually:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Backend will run on: **http://localhost:5555**

### Step 2: Start the Frontend Server
```bash
# In main directory
npm start
```

Frontend will run on: **http://localhost:8888**

### Step 3: Access the Application
Open your browser and go to:
- **Local**: http://localhost:8888
- **Network**: http://192.168.98.216:8888

## 🌐 Current Running Services

| Service | URL | Status | Purpose |
|---------|-----|--------|---------|
| Frontend | http://localhost:8888 | ✅ Running | Main application |
| Python Backend | http://localhost:5555 | ✅ Running | Google Drive downloads |
| Network Access | http://192.168.98.216:8888 | ✅ Available | Share with colleagues |

## 📁 How to Use Google Drive Links

### With Backend Running:
1. The app will show **"✅ Backend Connected"**
2. Paste Google Drive links in the text area
3. Click "Add Drive Links"
4. Files will be downloaded automatically
5. Process as normal

### Without Backend:
1. The app will show **"⚠️ Backend Not Running"**
2. Drive links will be disabled
3. Use direct file upload instead

## 🔍 Google Drive Link Formats Supported

All these formats work:
```
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/open?id=FILE_ID
https://drive.google.com/uc?id=FILE_ID
https://docs.google.com/document/d/FILE_ID/edit
```

## 📝 Complete Feature List

### ✅ Working Features:
- **Direct PDF Upload**: Drag & drop or browse
- **Google Drive Links**: With Python backend
- **Batch Processing**: Up to 50 files
- **Data Extraction**: All invoice fields
- **CSV Export**: 28-column format
- **Google Sheets Logging**: Usage tracking
- **Network Sharing**: Access from any device on network

### 🎯 Requirements:
- **Node.js**: For frontend server
- **Python 3**: For backend server
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## 🛠️ Troubleshooting

### Issue: "Backend Not Connected" message
**Solution**: 
```bash
cd backend
./start_backend.sh
```

### Issue: Google Drive file won't download
**Solutions**:
1. Ensure file is publicly shared (Anyone with link)
2. Check if file ID is correct
3. Try copying the share link again

### Issue: Port already in use
**Solution**: 
- Frontend: Edit `server.js` and change PORT
- Backend: Edit `backend/app.py` and change port from 5555

## 📊 Architecture

```
┌─────────────────────┐
│   Browser (User)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Frontend Server    │
│  (Node.js - :8888)  │
└──────────┬──────────┘
           │
           ├──────────────┐
           ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│ Python Backend  │  │  Google Sheets  │
│ (Flask - :5555) │  │   (Logging)     │
└────────┬────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Google Drive   │
│     (Files)     │
└─────────────────┘
```

## 🚦 Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ✅ Backend Connected | Google Drive downloads enabled |
| ⚠️ Backend Not Running | Only direct upload available |
| 🔄 Processing | Files being processed |
| ✅ Complete | All files processed |

## 💻 Commands Reference

### Start Everything:
```bash
# Terminal 1 - Backend
cd backend && ./start_backend.sh

# Terminal 2 - Frontend  
npm start
```

### Stop Services:
- Press `Ctrl+C` in each terminal

### Check Status:
- Frontend: http://localhost:8888
- Backend: http://localhost:5555
- Logs: Check terminal outputs

## 📤 Sharing with Team

Share these URLs with your team:
- **Application**: http://192.168.98.216:8888
- **Requirements**: Must be on same network
- **Login**: Use @fabhotels.com or @travelplusapp.com email

## 🎉 You're All Set!

Both servers are running and ready to:
1. Process PDF invoices
2. Download from Google Drive
3. Extract data to CSV
4. Log usage to Google Sheets

---

**Note**: Keep both terminal windows open while using the application. The Python backend enables Google Drive functionality.