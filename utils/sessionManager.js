// Session Manager Module
class SessionManager {
    constructor() {
        this.currentSession = null;
        this.processingData = {
            files: [],
            results: [],
            errors: [],
            startTime: null,
            endTime: null
        };
    }

    /**
     * Generate UUID for session ID
     * @returns {string} - UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Initialize a new processing session
     * @param {string} userEmail - User's email address
     * @returns {object} - Session object
     */
    initializeSession(userEmail) {
        this.currentSession = {
            sessionId: this.generateUUID(),
            userEmail: userEmail,
            startTime: Date.now(),
            endTime: null,
            filesProcessed: 0,
            successCount: 0,
            errorCount: 0,
            errors: [],
            totalAmount: 0,
            toolVersion: CONFIG.TOOL_VERSION
        };

        this.processingData = {
            files: [],
            results: [],
            errors: [],
            startTime: new Date(),
            endTime: null
        };

        console.log('Session initialized:', this.currentSession.sessionId);
        return this.currentSession;
    }

    /**
     * Add file to processing queue
     * @param {File|Object} file - File to process
     */
    addFile(file) {
        this.processingData.files.push({
            name: file.name || file.url,
            size: file.size || 0,
            type: file.type || 'application/pdf',
            status: 'pending',
            startTime: null,
            endTime: null,
            result: null,
            error: null
        });
    }

    /**
     * Update file processing status
     * @param {number} index - File index
     * @param {string} status - New status
     * @param {object} data - Additional data
     */
    updateFileStatus(index, status, data = {}) {
        if (this.processingData.files[index]) {
            const file = this.processingData.files[index];
            file.status = status;

            if (status === 'processing') {
                file.startTime = Date.now();
            } else if (status === 'completed' || status === 'error') {
                file.endTime = Date.now();
                
                if (status === 'completed') {
                    file.result = data.result;
                    this.currentSession.successCount++;
                    
                    // Update total amount if available
                    if (data.result && data.result.grandTotal) {
                        // Handle both number and string formats (with commas)
                        let amount = 0;
                        if (typeof data.result.grandTotal === 'string') {
                            // Remove commas and parse
                            amount = parseFloat(data.result.grandTotal.replace(/,/g, '')) || 0;
                        } else {
                            amount = parseFloat(data.result.grandTotal) || 0;
                        }
                        this.currentSession.totalAmount += amount;
                        console.log(`Added amount ${amount} to total. New total: ${this.currentSession.totalAmount}`);
                    }
                } else {
                    file.error = data.error;
                    this.currentSession.errorCount++;
                    this.currentSession.errors.push({
                        file: file.name,
                        error: data.error
                    });
                }

                this.currentSession.filesProcessed++;
            }
        }
    }

    /**
     * Get processing progress
     * @returns {object} - Progress information
     */
    getProgress() {
        const total = this.processingData.files.length;
        const processed = this.currentSession.filesProcessed;
        const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

        return {
            total,
            processed,
            percentage,
            success: this.currentSession.successCount,
            errors: this.currentSession.errorCount
        };
    }

    /**
     * Get successful results
     * @returns {array} - Array of successful extraction results
     */
    getSuccessfulResults() {
        return this.processingData.files
            .filter(file => file.status === 'completed' && file.result)
            .map(file => file.result);
    }

    /**
     * Get processing errors
     * @returns {array} - Array of errors
     */
    getErrors() {
        return this.processingData.files
            .filter(file => file.status === 'error')
            .map(file => ({
                fileName: file.name,
                error: file.error
            }));
    }

    /**
     * Calculate processing time
     * @returns {number} - Processing time in seconds
     */
    getProcessingTime() {
        if (!this.currentSession) return 0;
        
        const endTime = this.currentSession.endTime || Date.now();
        return Math.round((endTime - this.currentSession.startTime) / 1000);
    }

    /**
     * Calculate success rate
     * @returns {number} - Success rate percentage
     */
    getSuccessRate() {
        const total = this.currentSession.filesProcessed;
        if (total === 0) return 0;
        
        return Math.round((this.currentSession.successCount / total) * 100);
    }

    /**
     * Finalize session
     */
    finalizeSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.processingData.endTime = new Date();
        }
    }

    /**
     * Get session summary
     * @returns {object} - Session summary data
     */
    getSessionSummary() {
        return {
            sessionId: this.currentSession.sessionId,
            userEmail: this.currentSession.userEmail,
            numberOfFiles: this.currentSession.filesProcessed,
            processingTime: this.getProcessingTime(),
            successRate: this.getSuccessRate(),
            errorCount: this.currentSession.errorCount,
            totalAmount: this.currentSession.totalAmount,
            errors: this.currentSession.errors
        };
    }

    /**
     * Reset session
     */
    reset() {
        this.currentSession = null;
        this.processingData = {
            files: [],
            results: [],
            errors: [],
            startTime: null,
            endTime: null
        };
    }

    /**
     * Estimate LLM cost
     * @param {number} fileCount - Number of files processed
     * @returns {number} - Estimated cost in USD
     */
    estimateLLMCost(fileCount) {
        // Rough estimate: $0.01 per file for PDF processing
        const costPerFile = 0.01;
        return fileCount * costPerFile;
    }
}

// Create singleton instance
const sessionManager = new SessionManager();