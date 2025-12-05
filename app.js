// Main Application Module
class InvoiceExtractorApp {
    constructor() {
        this.files = [];
        this.driveFiles = [];
        this.results = [];
        this.isProcessing = false;
        this.currentSession = null;
    }

    /**
     * Initialize the application
     * @param {string} userEmail - Authenticated user email
     */
    init(userEmail) {
        console.log('Initializing app for user:', userEmail);
        
        this.userEmail = userEmail;
        this.setupEventListeners();
        this.setupDragAndDrop();
        
        // Test Google Sheets connection
        logger.testConnection().then(connected => {
            if (connected) {
                console.log('Google Sheets logger connected');
            } else {
                console.warn('Google Sheets logger not configured');
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        }

        // Drive links
        const addDriveBtn = document.getElementById('addDriveLinks');
        if (addDriveBtn) {
            addDriveBtn.addEventListener('click', () => {
                this.handleDriveLinks();
            });
        }

        // Process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processInvoices();
            });
        }

        // Download CSV button
        const downloadBtn = document.getElementById('downloadCSV');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadResults();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }
    }

    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type === 'application/pdf'
            );
            
            if (files.length > 0) {
                this.handleFileSelect(files);
            } else {
                this.showError('Please drop only PDF files');
            }
        });
    }

    /**
     * Handle file selection
     * @param {FileList} files - Selected files
     */
    handleFileSelect(files) {
        const pdfFiles = Array.from(files).filter(file => {
            const validation = pdfParser.validatePDFFile(file);
            if (!validation.valid) {
                this.showError(`${file.name}: ${validation.error}`);
                return false;
            }
            return true;
        });

        if (pdfFiles.length === 0) {
            return;
        }

        // Check total file limit
        if (this.files.length + pdfFiles.length > CONFIG.MAX_FILES) {
            this.showError(`Maximum ${CONFIG.MAX_FILES} files allowed`);
            return;
        }

        this.files.push(...pdfFiles);
        this.updateFilesList();
    }

    /**
     * Handle Google Drive links
     */
    handleDriveLinks() {
        const textarea = document.getElementById('driveLinks');
        if (!textarea || !textarea.value.trim()) {
            this.showError('Please enter at least one Google Drive link');
            return;
        }

        const links = driveHandler.parseDriveLinks(textarea.value);
        if (links.length === 0) {
            this.showError('No valid Google Drive links found');
            return;
        }

        // Check total file limit
        if (this.files.length + this.driveFiles.length + links.length > CONFIG.MAX_FILES) {
            this.showError(`Maximum ${CONFIG.MAX_FILES} files allowed`);
            return;
        }

        this.driveFiles.push(...links);
        textarea.value = '';
        this.updateFilesList();

        this.showSuccess(`Added ${links.length} Drive file(s)`);
    }

    /**
     * Update files list display
     */
    updateFilesList() {
        const filesList = document.getElementById('filesList');
        const filesContainer = document.getElementById('filesContainer');
        
        if (!filesList || !filesContainer) return;

        // Clear container
        filesContainer.innerHTML = '';

        // Show regular files
        this.files.forEach((file, index) => {
            const fileItem = this.createFileItem(file, 'file', index);
            filesContainer.appendChild(fileItem);
        });

        // Show Drive files
        this.driveFiles.forEach((file, index) => {
            const fileItem = this.createFileItem(file, 'drive', index);
            filesContainer.appendChild(fileItem);
        });

        // Show/hide files list section
        const totalFiles = this.files.length + this.driveFiles.length;
        if (totalFiles > 0) {
            filesList.classList.remove('hidden');
        } else {
            filesList.classList.add('hidden');
        }
    }

    /**
     * Create file item element
     * @param {object} file - File object
     * @param {string} type - File type (file/drive)
     * @param {number} index - File index
     * @returns {HTMLElement} - File item element
     */
    createFileItem(file, type, index) {
        const div = document.createElement('div');
        div.className = 'file-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.textContent = type === 'file' ? file.name : `Drive: ${file.name}`;

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-size';
        sizeSpan.textContent = type === 'file' ? this.formatFileSize(file.size) : 'Google Drive';

        const removeBtn = document.createElement('span');
        removeBtn.className = 'file-remove';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => this.removeFile(type, index);

        div.appendChild(nameSpan);
        div.appendChild(sizeSpan);
        div.appendChild(removeBtn);

        return div;
    }

    /**
     * Remove file from list
     * @param {string} type - File type (file/drive)
     * @param {number} index - File index
     */
    removeFile(type, index) {
        if (type === 'file') {
            this.files.splice(index, 1);
        } else {
            this.driveFiles.splice(index, 1);
        }
        this.updateFilesList();
    }

    /**
     * Process all invoices
     */
    async processInvoices() {
        const totalFiles = this.files.length + this.driveFiles.length;
        
        if (totalFiles === 0) {
            this.showError(CONFIG.ERRORS.NO_FILES);
            return;
        }

        if (this.isProcessing) {
            this.showError('Processing already in progress');
            return;
        }

        this.isProcessing = true;
        this.results = [];
        
        // Initialize session
        this.currentSession = sessionManager.initializeSession(this.userEmail);
        
        // Show processing section
        this.showProcessingSection();

        try {
            // Add all files to session manager
            this.files.forEach(file => {
                sessionManager.addFile(file);
            });
            
            // Log session start
            await logger.logSessionStart(this.currentSession);

            // Download Drive files first if any
            if (this.driveFiles.length > 0) {
                await this.downloadDriveFiles();
            }

            // Process all files
            await this.processAllFiles();

            // Finalize session
            sessionManager.finalizeSession();

            // Log session end
            const summary = sessionManager.getSessionSummary();
            summary.llmCost = sessionManager.estimateLLMCost(totalFiles);
            
            // Debug logging
            console.log('Session Summary:', summary);
            console.log('Total Files:', totalFiles);
            console.log('Total Amount:', summary.totalAmount);
            
            await logger.logSessionEnd(summary);

            // Show results
            this.showResults();

        } catch (error) {
            console.error('Processing error:', error);
            this.showError(`Processing failed: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Download Google Drive files
     */
    async downloadDriveFiles() {
        this.updateProcessingStatus('Downloading files from Google Drive...');

        const downloadResult = await driveHandler.batchDownload(
            this.driveFiles,
            (progress) => {
                const percent = Math.round((progress.current / progress.total) * 100);
                this.updateProgress(percent, `Downloading: ${progress.fileName}`);
            }
        );

        // Add downloaded files to processing queue
        downloadResult.downloaded.forEach(item => {
            this.files.push(item.file);
            sessionManager.addFile(item.file);
        });

        // Handle download errors
        downloadResult.errors.forEach(error => {
            sessionManager.updateFileStatus(0, 'error', { error: error.error });
        });

        // Clear Drive files list after download
        this.driveFiles = [];
    }

    /**
     * Process all files
     */
    async processAllFiles() {
        const totalFiles = this.files.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = this.files[i];
            const progress = Math.round(((i + 1) / totalFiles) * 100);

            try {
                this.updateProgress(progress, `Processing: ${file.name}`);
                sessionManager.updateFileStatus(i, 'processing');

                // Parse PDF
                const pdfData = await pdfParser.parsePDF(file);
                
                if (!pdfData.success) {
                    throw new Error(pdfData.error || 'Failed to parse PDF');
                }

                // Extract data
                const extractionResult = await dataExtractor.extractInvoiceData(pdfData, file.name);
                
                if (!extractionResult.success) {
                    throw new Error(extractionResult.error || 'Failed to extract data');
                }

                // Add to results
                this.results.push(extractionResult.data);
                sessionManager.updateFileStatus(i, 'completed', { result: extractionResult.data });

                this.addProcessingDetail(`✓ ${file.name}`, 'success');

            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                sessionManager.updateFileStatus(i, 'error', { error: error.message });
                this.addProcessingDetail(`✗ ${file.name}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Show processing section
     */
    showProcessingSection() {
        document.getElementById('processingSection')?.classList.remove('hidden');
        document.getElementById('resultsSection')?.classList.add('hidden');
        document.getElementById('processingDetails').innerHTML = '';
        this.updateProgress(0, 'Starting processing...');
    }

    /**
     * Update processing progress
     * @param {number} percent - Progress percentage
     * @param {string} status - Status message
     */
    updateProgress(percent, status) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${percent}%`;
        }

        this.updateProcessingStatus(status);
    }

    /**
     * Update processing status
     * @param {string} status - Status message
     */
    updateProcessingStatus(status) {
        const statusDiv = document.getElementById('processingStatus');
        if (statusDiv) {
            statusDiv.textContent = status;
        }
    }

    /**
     * Add processing detail
     * @param {string} message - Detail message
     * @param {string} type - Message type (success/error/info)
     */
    addProcessingDetail(message, type = 'info') {
        const detailsDiv = document.getElementById('processingDetails');
        if (!detailsDiv) return;

        const item = document.createElement('div');
        item.className = `processing-item ${type}`;
        item.textContent = message;
        detailsDiv.appendChild(item);

        // Auto-scroll to bottom
        detailsDiv.scrollTop = detailsDiv.scrollHeight;
    }

    /**
     * Show results section
     */
    showResults() {
        // Hide processing section
        document.getElementById('processingSection')?.classList.add('hidden');
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;
        
        resultsSection.classList.remove('hidden');

        // Update summary
        const summary = csvGenerator.generateSummary(this.results);
        this.updateResultsSummary(summary);

        // Create preview table
        this.createResultsTable();

        // Show errors if any
        const errors = sessionManager.getErrors();
        if (errors.length > 0) {
            this.showErrorsList(errors);
        }
    }

    /**
     * Update results summary
     * @param {object} summary - Summary data
     */
    updateResultsSummary(summary) {
        document.getElementById('totalInvoices').textContent = summary.totalInvoices;
        document.getElementById('successCount').textContent = sessionManager.currentSession.successCount;
        document.getElementById('failedCount').textContent = sessionManager.currentSession.errorCount;
        document.getElementById('totalAmount').textContent = `₹${summary.totalAmount.toLocaleString('en-IN')}`;
    }

    /**
     * Create results table
     */
    createResultsTable() {
        const table = document.getElementById('resultsTable');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (this.results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="28" style="text-align: center;">No data to display</td></tr>';
            return;
        }

        // Create headers
        const headerRow = thead.insertRow();
        CONFIG.CSV_HEADERS.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        // Add data rows (limit to 10 for preview)
        const previewLimit = Math.min(10, this.results.length);
        const csvData = csvGenerator.prepareDataForCSV(this.results.slice(0, previewLimit));

        csvData.forEach(row => {
            const tr = tbody.insertRow();
            CONFIG.CSV_HEADERS.forEach(header => {
                const td = tr.insertCell();
                td.textContent = row[header] || '';
            });
        });

        // Add note if showing limited rows
        if (this.results.length > previewLimit) {
            const noteRow = tbody.insertRow();
            const noteCell = noteRow.insertCell();
            noteCell.colSpan = CONFIG.CSV_HEADERS.length;
            noteCell.style.textAlign = 'center';
            noteCell.style.fontStyle = 'italic';
            noteCell.textContent = `Showing ${previewLimit} of ${this.results.length} rows. Download CSV to see all data.`;
        }
    }

    /**
     * Show errors list
     * @param {array} errors - Array of error objects
     */
    showErrorsList(errors) {
        const errorsList = document.getElementById('errorsList');
        const errorsContainer = document.getElementById('errorsContainer');

        if (!errorsList || !errorsContainer) return;

        errorsContainer.innerHTML = '';

        errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-item';

            const fileDiv = document.createElement('div');
            fileDiv.className = 'error-file';
            fileDiv.textContent = error.fileName;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'error-message';
            messageDiv.textContent = error.error;

            errorDiv.appendChild(fileDiv);
            errorDiv.appendChild(messageDiv);
            errorsContainer.appendChild(errorDiv);
        });

        errorsList.classList.remove('hidden');
    }

    /**
     * Download results as CSV
     */
    downloadResults() {
        if (this.results.length === 0) {
            this.showError('No data to download');
            return;
        }

        // Validate data
        const validation = csvGenerator.validateData(this.results);
        if (validation.warnings.length > 0) {
            console.warn('CSV validation warnings:', validation.warnings);
        }

        // Generate and download CSV
        const csv = csvGenerator.generateCSV(this.results);
        const fileName = csvGenerator.downloadCSV(csv);

        this.showSuccess(`CSV downloaded: ${fileName}`);
    }

    /**
     * Reset application
     */
    reset() {
        this.files = [];
        this.driveFiles = [];
        this.results = [];
        this.isProcessing = false;
        this.currentSession = null;

        // Clear file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear Drive links
        const driveLinks = document.getElementById('driveLinks');
        if (driveLinks) {
            driveLinks.value = '';
        }

        // Hide sections
        document.getElementById('filesList')?.classList.add('hidden');
        document.getElementById('processingSection')?.classList.add('hidden');
        document.getElementById('resultsSection')?.classList.add('hidden');

        // Reset session manager
        sessionManager.reset();

        // Clear Drive cache
        driveHandler.clearCache();

        this.showSuccess('Ready to process new invoices');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error(message);
        // You can implement a toast notification here
        alert(`Error: ${message}`);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        console.log(message);
        // You can implement a toast notification here
    }

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Global app instance
let app = null;

/**
 * Initialize application
 * @param {string} userEmail - Authenticated user email
 */
function initializeApp(userEmail) {
    app = new InvoiceExtractorApp();
    app.init(userEmail);
}

/**
 * Clear app data (for logout)
 */
function clearAppData() {
    if (app) {
        app.reset();
    }
    app = null;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication
    auth.init();
});