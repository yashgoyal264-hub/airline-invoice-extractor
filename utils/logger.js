// Logger Module for Google Sheets Integration
class Logger {
    constructor() {
        this.scriptUrl = CONFIG.APPS_SCRIPT_URL;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Log usage data to Google Sheets
     * @param {object} sessionData - Session data to log
     * @returns {Promise<boolean>} - Success status
     */
    async logUsageData(sessionData) {
        if (!sessionData || !this.scriptUrl || this.scriptUrl.includes('YOUR_DEPLOYMENT_ID')) {
            console.warn('Logger: Google Apps Script URL not configured');
            return false;
        }

        const logData = {
            userEmail: sessionData.userEmail,
            numberOfFiles: sessionData.numberOfFiles || sessionData.filesProcessed || 0,
            processingTime: sessionData.processingTime || 0,
            llmCost: sessionData.llmCost || this.calculateLLMCost(sessionData.numberOfFiles || sessionData.filesProcessed),
            successRate: sessionData.successRate || 0,
            errorCount: sessionData.errorCount || 0,
            sessionId: sessionData.sessionId,
            toolVersion: CONFIG.TOOL_VERSION,
            errorDetails: this.formatErrorDetails(sessionData.errors),
            totalAmount: sessionData.totalAmount || 0,  // Add totalAmount field
            timestamp: new Date().toISOString(),
            event: 'process_complete'  // Add event type
        };

        // Debug logging
        console.log('Sending to Google Sheets:', logData);

        return await this.sendToGoogleSheets(logData);
    }

    /**
     * Send data to Google Sheets via Apps Script
     * @param {object} data - Data to send
     * @returns {Promise<boolean>} - Success status
     */
    async sendToGoogleSheets(data) {
        let attempts = 0;

        while (attempts < this.retryAttempts) {
            try {
                const response = await fetch(this.scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors', // Google Apps Script doesn't support CORS
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                // With no-cors, we can't read the response
                // Assume success if no exception was thrown
                console.log('Logger: Usage data sent successfully');
                return true;

            } catch (error) {
                attempts++;
                console.error(`Logger: Attempt ${attempts} failed:`, error);

                if (attempts < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempts);
                } else {
                    console.error('Logger: Failed to log usage data after all retries');
                    // Don't throw error - logging failure shouldn't break main functionality
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Log session start
     * @param {object} session - Session object
     */
    async logSessionStart(session) {
        const startData = {
            userEmail: session.userEmail,
            sessionId: session.sessionId,
            event: 'session_start',
            timestamp: new Date().toISOString(),
            toolVersion: CONFIG.TOOL_VERSION
        };

        return await this.sendToGoogleSheets(startData);
    }

    /**
     * Log session end with summary
     * @param {object} sessionSummary - Session summary data
     */
    async logSessionEnd(sessionSummary) {
        // Ensure event type is set for session end
        const endData = {
            ...sessionSummary,
            event: 'session_end'
        };
        return await this.logUsageData(endData);
    }

    /**
     * Log error event
     * @param {string} sessionId - Session ID
     * @param {string} userEmail - User email
     * @param {object} error - Error details
     */
    async logError(sessionId, userEmail, error) {
        const errorData = {
            userEmail: userEmail,
            sessionId: sessionId,
            event: 'error',
            errorType: error.type || 'unknown',
            errorMessage: error.message || 'Unknown error',
            errorFile: error.fileName || '',
            timestamp: new Date().toISOString(),
            toolVersion: CONFIG.TOOL_VERSION
        };

        return await this.sendToGoogleSheets(errorData);
    }

    /**
     * Calculate estimated LLM cost
     * @param {number} fileCount - Number of files processed
     * @returns {number} - Estimated cost
     */
    calculateLLMCost(fileCount) {
        // Estimated cost per file (in USD)
        // This is a rough estimate and should be adjusted based on actual usage
        const costPerFile = 0.01; // $0.01 per file
        return Math.round(fileCount * costPerFile * 100) / 100;
    }

    /**
     * Format error details for logging
     * @param {array} errors - Array of error objects
     * @returns {string} - Formatted error string
     */
    formatErrorDetails(errors) {
        if (!errors || errors.length === 0) {
            return '';
        }

        return errors
            .slice(0, 5) // Limit to first 5 errors
            .map(err => `${err.file || 'Unknown'}: ${err.error || 'Unknown error'}`)
            .join('; ');
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test connection to Google Sheets
     * @returns {Promise<boolean>} - Connection status
     */
    async testConnection() {
        const testData = {
            test: true,
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            console.log('Logger: Test connection successful');
            return true;
        } catch (error) {
            console.error('Logger: Test connection failed:', error);
            return false;
        }
    }
}

// Create singleton instance
const logger = new Logger();