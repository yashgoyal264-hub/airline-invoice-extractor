/**
 * Google Apps Script for TravelPlus Invoice Extractor
 * Deploy this as a Web App with "Anyone" access
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Copy and paste this entire code
 * 4. Replace 'YOUR_SPREADSHEET_ID' with your Google Sheets ID
 * 5. Click Deploy > New Deployment
 * 6. Choose type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Deploy and copy the Web App URL
 * 10. Update CONFIG.APPS_SCRIPT_URL in constants.js with the URL
 */

// Replace with your Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Usage Log'; // Name of the sheet

/**
 * Handle POST requests
 */
function doPost(e) {
    try {
        // Parse request data
        const data = JSON.parse(e.postData.contents);
        
        // Open the spreadsheet
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = createSheet(spreadsheet);
        }
        
        // Check if this is a test connection
        if (data.test) {
            return ContentService
                .createTextOutput(JSON.stringify({
                    status: 'success',
                    message: 'Test connection successful'
                }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        
        // Add row to the sheet
        const row = createRowFromData(data);
        sheet.appendRow(row);
        
        // Return success response
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                message: 'Data logged successfully',
                rowAdded: row
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        // Log error
        console.error('Error in doPost:', error);
        
        // Return error response
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'error',
                message: error.toString(),
                stack: error.stack
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 'success',
            message: 'TravelPlus Invoice Extractor Logger is running',
            version: '1.0.0'
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create the sheet with headers if it doesn't exist
 */
function createSheet(spreadsheet) {
    const sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // Add headers
    const headers = [
        'Timestamp',
        'User Email',
        'Session ID',
        'Event Type',
        'Number of Files',
        'Processing Time (seconds)',
        'LLM Cost ($)',
        'Success Rate (%)',
        'Error Count',
        'Tool Version',
        'Error Details',
        'Total Amount (₹)'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A5568');
    headerRange.setFontColor('#FFFFFF');
    
    // Set column widths
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 200); // User Email
    sheet.setColumnWidth(3, 150); // Session ID
    sheet.setColumnWidth(4, 100); // Event Type
    sheet.setColumnWidth(5, 100); // Number of Files
    sheet.setColumnWidth(6, 150); // Processing Time
    sheet.setColumnWidth(7, 100); // LLM Cost
    sheet.setColumnWidth(8, 120); // Success Rate
    sheet.setColumnWidth(9, 100); // Error Count
    sheet.setColumnWidth(10, 100); // Tool Version
    sheet.setColumnWidth(11, 300); // Error Details
    sheet.setColumnWidth(12, 120); // Total Amount
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    return sheet;
}

/**
 * Create a row array from the data object
 */
function createRowFromData(data) {
    const timestamp = data.timestamp || new Date().toISOString();
    const eventType = data.event || 'process_complete';
    
    return [
        timestamp,
        data.userEmail || '',
        data.sessionId || '',
        eventType,
        data.numberOfFiles || 0,
        data.processingTime || 0,
        data.llmCost || 0,
        data.successRate || 0,
        data.errorCount || 0,
        data.toolVersion || '',
        data.errorDetails || '',
        data.totalAmount || 0
    ];
}

/**
 * Get usage statistics (optional utility function)
 */
function getUsageStats() {
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            return {
                error: 'Sheet not found'
            };
        }
        
        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        
        if (values.length <= 1) {
            return {
                totalSessions: 0,
                totalFiles: 0,
                totalUsers: 0
            };
        }
        
        // Skip header row
        const data = values.slice(1);
        
        // Calculate statistics
        const totalSessions = data.filter(row => row[3] === 'process_complete').length;
        const totalFiles = data.reduce((sum, row) => sum + (row[4] || 0), 0);
        const uniqueUsers = [...new Set(data.map(row => row[1]).filter(Boolean))].length;
        const totalProcessingTime = data.reduce((sum, row) => sum + (row[5] || 0), 0);
        const totalCost = data.reduce((sum, row) => sum + (row[6] || 0), 0);
        const averageSuccessRate = data.reduce((sum, row) => sum + (row[7] || 0), 0) / (totalSessions || 1);
        
        return {
            totalSessions: totalSessions,
            totalFiles: totalFiles,
            uniqueUsers: uniqueUsers,
            totalProcessingTime: Math.round(totalProcessingTime),
            totalCost: Math.round(totalCost * 100) / 100,
            averageSuccessRate: Math.round(averageSuccessRate)
        };
        
    } catch (error) {
        return {
            error: error.toString()
        };
    }
}

/**
 * Clear old logs (optional maintenance function)
 */
function clearOldLogs(daysToKeep = 30) {
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            return {
                error: 'Sheet not found'
            };
        }
        
        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        
        if (values.length <= 1) {
            return {
                message: 'No data to clear'
            };
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        let rowsDeleted = 0;
        
        // Start from the last row and work backwards
        for (let i = values.length - 1; i > 0; i--) {
            const timestamp = values[i][0];
            if (timestamp && new Date(timestamp) < cutoffDate) {
                sheet.deleteRow(i + 1);
                rowsDeleted++;
            }
        }
        
        return {
            message: `Deleted ${rowsDeleted} old log entries`
        };
        
    } catch (error) {
        return {
            error: error.toString()
        };
    }
}