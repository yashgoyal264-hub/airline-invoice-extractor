#!/usr/bin/env python3
"""
TravelPlus Invoice Extractor - Python Backend
Handles Google Drive file downloads and serves them to the frontend
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import io
import re
import os
import tempfile
from urllib.parse import urlparse, parse_qs
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleDriveDownloader:
    """Handle Google Drive file downloads"""
    
    @staticmethod
    def extract_file_id(url):
        """Extract file ID from various Google Drive URL formats"""
        patterns = [
            r'/d/([a-zA-Z0-9_-]+)',  # drive.google.com/file/d/FILE_ID/view
            r'id=([a-zA-Z0-9_-]+)',  # drive.google.com/open?id=FILE_ID
            r'/folders/([a-zA-Z0-9_-]+)',  # folder links
            r'drive.google.com/.*[?&]id=([a-zA-Z0-9_-]+)'  # with parameters
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        # If URL is already just the file ID
        if re.match(r'^[a-zA-Z0-9_-]+$', url):
            return url
            
        return None
    
    @staticmethod
    def download_file(file_id):
        """Download file from Google Drive"""
        # Direct download URL for Google Drive
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        try:
            # Initial request
            session = requests.Session()
            response = session.get(download_url, stream=True)
            
            # Check for virus scan warning (for large files)
            if 'virus scan warning' in response.text.lower():
                # Extract confirmation token
                for key, value in response.cookies.items():
                    if key.startswith('download_warning'):
                        params = {'confirm': value}
                        response = session.get(download_url, params=params, stream=True)
                        break
            
            # Check if we got the actual file
            content_type = response.headers.get('content-type', '')
            
            # If it's HTML, try alternative method
            if 'text/html' in content_type:
                # Try alternative download URL
                alt_url = f"https://drive.google.com/u/0/uc?id={file_id}&export=download"
                response = session.get(alt_url, stream=True)
                
                # Check again
                content_type = response.headers.get('content-type', '')
                if 'text/html' in content_type:
                    # Check if file requires authorization
                    if 'accounts.google.com' in response.url:
                        return None, "File requires Google authentication. Please make it publicly accessible."
                    return None, "Unable to download file. Please ensure the file is publicly shared."
            
            # Get filename from headers or use default
            filename = 'download.pdf'
            if 'content-disposition' in response.headers:
                disposition = response.headers['content-disposition']
                filename_match = re.search(r'filename="?([^"]+)"?', disposition)
                if filename_match:
                    filename = filename_match.group(1)
            
            # Read file content
            file_content = response.content
            
            return file_content, filename
            
        except requests.RequestException as e:
            logger.error(f"Error downloading file: {e}")
            return None, str(e)

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'service': 'TravelPlus Invoice Extractor Backend',
        'version': '1.0.0'
    })

@app.route('/api/download-drive-file', methods=['POST'])
def download_drive_file():
    """Download file from Google Drive URL"""
    try:
        data = request.get_json()
        drive_url = data.get('url')
        
        if not drive_url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Extract file ID
        file_id = GoogleDriveDownloader.extract_file_id(drive_url)
        if not file_id:
            return jsonify({'error': 'Invalid Google Drive URL'}), 400
        
        logger.info(f"Downloading file ID: {file_id}")
        
        # Download file
        file_content, filename_or_error = GoogleDriveDownloader.download_file(file_id)
        
        if file_content is None:
            return jsonify({'error': filename_or_error}), 400
        
        # Send file as response
        return send_file(
            io.BytesIO(file_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename_or_error
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/download-multiple', methods=['POST'])
def download_multiple():
    """Download multiple files from Google Drive"""
    try:
        data = request.get_json()
        urls = data.get('urls', [])
        
        if not urls:
            return jsonify({'error': 'No URLs provided'}), 400
        
        results = []
        
        for url in urls:
            file_id = GoogleDriveDownloader.extract_file_id(url)
            if not file_id:
                results.append({
                    'url': url,
                    'success': False,
                    'error': 'Invalid Google Drive URL'
                })
                continue
            
            file_content, filename_or_error = GoogleDriveDownloader.download_file(file_id)
            
            if file_content is None:
                results.append({
                    'url': url,
                    'success': False,
                    'error': filename_or_error
                })
            else:
                # Save temporarily and return download URL
                temp_dir = tempfile.gettempdir()
                temp_path = os.path.join(temp_dir, f"{file_id}_{filename_or_error}")
                
                with open(temp_path, 'wb') as f:
                    f.write(file_content)
                
                results.append({
                    'url': url,
                    'success': True,
                    'filename': filename_or_error,
                    'file_id': file_id,
                    'size': len(file_content)
                })
        
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error processing batch request: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-file/<file_id>')
def get_file(file_id):
    """Retrieve a previously downloaded file"""
    try:
        temp_dir = tempfile.gettempdir()
        
        # Find file in temp directory
        for filename in os.listdir(temp_dir):
            if filename.startswith(f"{file_id}_"):
                file_path = os.path.join(temp_dir, filename)
                return send_file(
                    file_path,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=filename.replace(f"{file_id}_", "")
                )
        
        return jsonify({'error': 'File not found'}), 404
        
    except Exception as e:
        logger.error(f"Error retrieving file: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5555))
    app.run(host='0.0.0.0', port=port, debug=True)