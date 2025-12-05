// Google Drive Handler Module
class DriveHandler {
    constructor() {
        this.patterns = CONFIG.DRIVE_URL_PATTERNS;
        this.downloadCache = new Map();
    }

    /**
     * Parse Google Drive links from text
     * @param {string} text - Text containing Drive links
     * @returns {array} - Array of Drive file objects
     */
    parseDriveLinks(text) {
        if (!text) return [];

        const links = [];
        const lines = text.split(/[\n,]/);

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed) {
                const fileId = this.extractFileId(trimmed);
                if (fileId) {
                    links.push({
                        url: trimmed,
                        fileId: fileId,
                        downloadUrl: this.getDownloadUrl(fileId),
                        name: `drive_file_${fileId}.pdf`,
                        type: 'drive'
                    });
                }
            }
        });

        return links;
    }

    /**
     * Extract file ID from Google Drive URL
     * @param {string} url - Google Drive URL
     * @returns {string|null} - File ID or null
     */
    extractFileId(url) {
        for (const pattern of this.patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Try to extract ID from any URL containing /d/
        const generalPattern = /\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(generalPattern);
        if (match) {
            return match[1];
        }

        return null;
    }

    /**
     * Get direct download URL for file ID
     * @param {string} fileId - Google Drive file ID
     * @returns {string} - Direct download URL
     */
    getDownloadUrl(fileId) {
        // Direct download URL format
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
        
        // Alternative formats that might work:
        // return `https://drive.google.com/uc?id=${fileId}&export=download`;
        // return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    }

    /**
     * Download file from Google Drive
     * @param {object} driveFile - Drive file object
     * @returns {Promise<ArrayBuffer>} - File data as ArrayBuffer
     */
    async downloadFile(driveFile) {
        try {
            // Check cache first
            if (this.downloadCache.has(driveFile.fileId)) {
                console.log('Using cached file:', driveFile.fileId);
                return this.downloadCache.get(driveFile.fileId);
            }

            console.log('Downloading from Google Drive:', driveFile.downloadUrl);

            // Try direct download
            let response = await this.fetchWithRetry(driveFile.downloadUrl);

            // Check if we got an HTML page instead of PDF
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                // Might be a permission page, try alternative methods
                console.warn('Got HTML response, trying alternative download method');
                response = await this.tryAlternativeDownload(driveFile);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            // Validate it's a PDF
            if (!this.isPDF(arrayBuffer)) {
                throw new Error('Downloaded file is not a valid PDF');
            }

            // Cache the result
            this.downloadCache.set(driveFile.fileId, arrayBuffer);

            return arrayBuffer;

        } catch (error) {
            console.error('Drive download error:', error);
            throw new Error(`Failed to download file from Google Drive: ${error.message}`);
        }
    }

    /**
     * Try alternative download methods
     * @param {object} driveFile - Drive file object
     * @returns {Promise<Response>} - Fetch response
     */
    async tryAlternativeDownload(driveFile) {
        // Method 1: Try with confirm parameter
        const confirmUrl = `${driveFile.downloadUrl}&confirm=yes`;
        let response = await fetch(confirmUrl);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                return response;
            }
        }

        // Method 2: Try viewer URL
        const viewerUrl = `https://drive.google.com/viewerng/viewer?url=${encodeURIComponent(driveFile.url)}`;
        response = await fetch(viewerUrl);
        
        if (response.ok) {
            return response;
        }

        // Method 3: Use CORS proxy (fallback)
        return await this.downloadWithCORSProxy(driveFile);
    }

    /**
     * Download using CORS proxy
     * @param {object} driveFile - Drive file object
     * @returns {Promise<Response>} - Fetch response
     */
    async downloadWithCORSProxy(driveFile) {
        // Public CORS proxies (use with caution in production)
        const corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];

        for (const proxy of corsProxies) {
            try {
                const proxyUrl = proxy + encodeURIComponent(driveFile.downloadUrl);
                const response = await fetch(proxyUrl);
                
                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.warn(`CORS proxy ${proxy} failed:`, error);
            }
        }

        throw new Error('All download methods failed');
    }

    /**
     * Fetch with retry logic
     * @param {string} url - URL to fetch
     * @param {number} retries - Number of retries
     * @returns {Promise<Response>} - Fetch response
     */
    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/pdf'
                    }
                });

                if (response.ok || i === retries - 1) {
                    return response;
                }

                // Wait before retry
                await this.delay(1000 * (i + 1));

            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                await this.delay(1000 * (i + 1));
            }
        }
    }

    /**
     * Check if ArrayBuffer is a PDF
     * @param {ArrayBuffer} buffer - File buffer
     * @returns {boolean} - True if PDF
     */
    isPDF(buffer) {
        // PDF files start with %PDF
        const bytes = new Uint8Array(buffer);
        return bytes[0] === 0x25 && // %
               bytes[1] === 0x50 && // P
               bytes[2] === 0x44 && // D
               bytes[3] === 0x46;   // F
    }

    /**
     * Create a File object from Drive download
     * @param {ArrayBuffer} arrayBuffer - Downloaded file data
     * @param {object} driveFile - Drive file metadata
     * @returns {File} - File object
     */
    createFileFromArrayBuffer(arrayBuffer, driveFile) {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        return new File([blob], driveFile.name, { type: 'application/pdf' });
    }

    /**
     * Validate Drive URL
     * @param {string} url - URL to validate
     * @returns {object} - Validation result
     */
    validateDriveUrl(url) {
        if (!url || typeof url !== 'string') {
            return {
                valid: false,
                error: 'Invalid URL'
            };
        }

        const fileId = this.extractFileId(url);
        if (!fileId) {
            return {
                valid: false,
                error: 'Not a valid Google Drive link'
            };
        }

        return {
            valid: true,
            fileId: fileId
        };
    }

    /**
     * Batch download Drive files
     * @param {array} driveFiles - Array of drive file objects
     * @param {function} progressCallback - Progress callback
     * @returns {Promise<array>} - Array of downloaded files
     */
    async batchDownload(driveFiles, progressCallback) {
        const downloaded = [];
        const errors = [];

        for (let i = 0; i < driveFiles.length; i++) {
            const file = driveFiles[i];
            
            try {
                if (progressCallback) {
                    progressCallback({
                        current: i,
                        total: driveFiles.length,
                        fileName: file.name,
                        status: 'downloading'
                    });
                }

                const arrayBuffer = await this.downloadFile(file);
                const fileObj = this.createFileFromArrayBuffer(arrayBuffer, file);
                
                downloaded.push({
                    file: fileObj,
                    arrayBuffer: arrayBuffer,
                    metadata: file
                });

                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: driveFiles.length,
                        fileName: file.name,
                        status: 'completed'
                    });
                }

            } catch (error) {
                console.error(`Failed to download ${file.name}:`, error);
                errors.push({
                    file: file,
                    error: error.message
                });

                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: driveFiles.length,
                        fileName: file.name,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }

        return {
            downloaded,
            errors
        };
    }

    /**
     * Clear download cache
     */
    clearCache() {
        this.downloadCache.clear();
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get file metadata from Google Drive
     * @param {string} fileId - File ID
     * @returns {Promise<object>} - File metadata
     */
    async getFileMetadata(fileId) {
        // This would require Google Drive API access
        // For now, return basic metadata
        return {
            id: fileId,
            name: `drive_file_${fileId}.pdf`,
            mimeType: 'application/pdf'
        };
    }
}

// Create singleton instance
const driveHandler = new DriveHandler();