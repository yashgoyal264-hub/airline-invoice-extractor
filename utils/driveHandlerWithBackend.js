// Google Drive Handler with Python Backend Support
class DriveHandlerWithBackend {
    constructor() {
        // Use public URL when not on localhost
        this.backendUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5555'
            : 'https://should-auckland-tommy-before.trycloudflare.com';  // Cloudflare backend URL
        this.cache = new Map();
        this.maxCacheSize = 50;
        this.isBackendAvailable = false;
        this.checkBackendConnection();
    }

    /**
     * Check if Python backend is available
     */
    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/`);
            const data = await response.json();
            this.isBackendAvailable = data.status === 'running';
            
            if (this.isBackendAvailable) {
                console.log('✅ Python backend connected for Google Drive downloads');
            } else {
                console.warn('⚠️ Python backend not available, Google Drive downloads disabled');
            }
        } catch (error) {
            this.isBackendAvailable = false;
            console.warn('⚠️ Python backend not running. Start it with: cd backend && ./start_backend.sh');
        }
        
        return this.isBackendAvailable;
    }

    /**
     * Validate Google Drive URL
     * @param {string} url - Google Drive URL
     * @returns {object} - Validation result with file ID
     */
    validateDriveUrl(url) {
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'Invalid URL' };
        }

        const patterns = CONFIG.DRIVE_URL_PATTERNS;
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return { 
                    valid: true, 
                    fileId: match[1],
                    originalUrl: url
                };
            }
        }

        return { valid: false, error: 'Not a valid Google Drive URL' };
    }

    /**
     * Parse multiple Drive links from text
     * @param {string} text - Text containing Drive links
     * @returns {array} - Array of parsed links
     */
    parseDriveLinks(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const links = [];

        lines.forEach(line => {
            const validation = this.validateDriveUrl(line.trim());
            if (validation.valid) {
                links.push({
                    url: validation.originalUrl,
                    fileId: validation.fileId,
                    name: `drive_file_${validation.fileId}.pdf`
                });
            }
        });

        return links;
    }

    /**
     * Download file from Google Drive using Python backend
     * @param {object} driveFile - Drive file object
     * @returns {Promise<File>} - Downloaded file
     */
    async downloadFile(driveFile) {
        if (!this.isBackendAvailable) {
            // Try to reconnect to backend
            await this.checkBackendConnection();
            if (!this.isBackendAvailable) {
                throw new Error('Python backend not available. Please start the backend server.');
            }
        }

        const { url, fileId, name } = driveFile;
        
        // Check cache
        if (this.cache.has(fileId)) {
            console.log(`Using cached file: ${name}`);
            return this.cache.get(fileId);
        }

        console.log(`Downloading from Google Drive via backend: ${name}`);

        try {
            const response = await fetch(`${this.backendUrl}/api/download-drive-file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to download file');
            }

            // Get the blob from response
            const blob = await response.blob();
            
            // Get filename from Content-Disposition header if available
            let filename = name;
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Create File object
            const file = new File([blob], filename, { type: 'application/pdf' });
            
            // Add to cache
            this.addToCache(fileId, file);
            
            return file;

        } catch (error) {
            console.error(`Drive download error: ${error.message}`);
            throw new Error(`Failed to download file from Google Drive: ${error.message}`);
        }
    }

    /**
     * Batch download multiple files
     * @param {array} driveFiles - Array of drive file objects
     * @param {function} onProgress - Progress callback
     * @returns {Promise<object>} - Download results
     */
    async batchDownload(driveFiles, onProgress) {
        const results = {
            downloaded: [],
            errors: []
        };

        for (let i = 0; i < driveFiles.length; i++) {
            const file = driveFiles[i];
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: driveFiles.length,
                    fileName: file.name
                });
            }

            try {
                const downloadedFile = await this.downloadFile(file);
                results.downloaded.push({
                    originalUrl: file.url,
                    file: downloadedFile
                });
            } catch (error) {
                console.error(`Failed to download ${file.name}:`, error);
                results.errors.push({
                    url: file.url,
                    name: file.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Add file to cache
     * @param {string} fileId - File ID
     * @param {File} file - File object
     */
    addToCache(fileId, file) {
        // Limit cache size
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(fileId, file);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Drive cache cleared');
    }

    /**
     * Get download URL for direct access (not used with backend)
     * @param {string} fileId - Google Drive file ID
     * @returns {string} - Download URL
     */
    getDownloadUrl(fileId) {
        return `${this.backendUrl}/api/get-file/${fileId}`;
    }
}

// Create singleton instance
const driveHandlerBackend = new DriveHandlerWithBackend();