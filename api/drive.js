// Vercel Serverless Function for Google Drive Downloads
const https = require('https');
const http = require('http');

// Extract file ID from various Google Drive URL formats
function extractFileId(url) {
    const patterns = [
        /\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/folders\/([a-zA-Z0-9_-]+)/,
        /drive.google.com\/.*[?&]id=([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    // If URL is already just the file ID
    if (/^[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }
    
    return null;
}

// Download file from Google Drive
async function downloadFile(fileId) {
    return new Promise((resolve, reject) => {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        https.get(downloadUrl, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                https.get(response.headers.location, (redirectResponse) => {
                    handleResponse(redirectResponse, resolve, reject);
                }).on('error', reject);
            } else {
                handleResponse(response, resolve, reject);
            }
        }).on('error', reject);
    });
}

function handleResponse(response, resolve, reject) {
    const chunks = [];
    
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = response.headers['content-type'] || '';
        
        // Check if it's an HTML error page
        if (contentType.includes('text/html')) {
            const html = buffer.toString();
            if (html.includes('accounts.google.com')) {
                reject(new Error('File requires Google authentication. Please make it publicly accessible.'));
            } else {
                reject(new Error('Unable to download file. Please ensure the file is publicly shared.'));
            }
        } else {
            // Get filename from headers
            let filename = 'download.pdf';
            const disposition = response.headers['content-disposition'];
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match) {
                    filename = match[1];
                }
            }
            
            resolve({
                buffer: buffer,
                filename: filename,
                contentType: contentType
            });
        }
    });
    
    response.on('error', reject);
}

// Vercel serverless function handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Health check endpoint
    if (req.url === '/api' || req.url === '/api/') {
        res.json({
            status: 'running',
            service: 'TravelPlus Invoice Extractor Backend',
            version: '1.0.0'
        });
        return;
    }
    
    // Handle download requests
    if (req.url === '/api/download-drive-file' && req.method === 'POST') {
        try {
            const { url } = req.body;
            
            if (!url) {
                res.status(400).json({ error: 'No URL provided' });
                return;
            }
            
            const fileId = extractFileId(url);
            if (!fileId) {
                res.status(400).json({ error: 'Invalid Google Drive URL' });
                return;
            }
            
            console.log(`Downloading file ID: ${fileId}`);
            
            const result = await downloadFile(fileId);
            
            // Send file as response
            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            res.send(result.buffer);
            
        } catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({ error: error.message });
        }
        return;
    }
    
    // Handle multiple downloads
    if (req.url === '/api/download-multiple' && req.method === 'POST') {
        try {
            const { urls } = req.body;
            
            if (!urls || !Array.isArray(urls)) {
                res.status(400).json({ error: 'No URLs provided' });
                return;
            }
            
            const results = [];
            
            for (const url of urls) {
                const fileId = extractFileId(url);
                if (!fileId) {
                    results.push({
                        url: url,
                        success: false,
                        error: 'Invalid Google Drive URL'
                    });
                    continue;
                }
                
                try {
                    const fileData = await downloadFile(fileId);
                    results.push({
                        url: url,
                        success: true,
                        filename: fileData.filename,
                        file_id: fileId,
                        size: fileData.buffer.length,
                        data: fileData.buffer.toString('base64')
                    });
                } catch (error) {
                    results.push({
                        url: url,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            res.json({ results: results });
            
        } catch (error) {
            console.error('Error processing batch request:', error);
            res.status(500).json({ error: error.message });
        }
        return;
    }
    
    // Default 404
    res.status(404).json({ error: 'Endpoint not found' });
};