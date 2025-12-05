/**
 * TravelPlus Invoice Extractor - Google Apps Script Logger
 * Version: 1.0.0
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace YOUR_SPREADSHEET_ID with your actual Google Sheets ID
 * 2. Deploy as Web App with "Anyone" access
 * 3. Copy the deployment URL to your config/constants.js file
 */

// ============= CONFIGURATION =============
// Replace this with your Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // <-- REPLACE THIS!

// Sheet names
const USAGE_LOG_SHEET = 'Usage Log';
const SUMMARY_SHEET = 'Summary';

// ============= MAIN FUNCTIONS =============

/**
 * Handle POST requests from the invoice extractor app
 */
function doPost(e) {
    try {
        // Parse incoming data
        const data = JSON.parse(e.postData.contents);
        
        // Open spreadsheet
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        
        // Initialize sheets if they don't exist
        initializeSheets(spreadsheet);
        
        // Handle test connection
        if (data.test) {
            return createResponse({
                status: 'success',
                message: 'Connection successful',
                timestamp: new Date().toISOString()
            });
        }
        
        // Log the data
        logUsageData(spreadsheet, data);
        
        // Update summary if it's a completed session
        if (data.event === 'session_end' || data.event === 'process_complete' || !data.event) {
            updateSummary(spreadsheet, data);
        }
        
        return createResponse({
            status: 'success',
            message: 'Data logged successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in doPost:', error);
        return createResponse({
            status: 'error',
            message: error.toString(),
            stack: error.stack
        }, 500);
    }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const stats = getUsageStatistics(spreadsheet);
        
        return createResponse({
            status: 'success',
            message: 'TravelPlus Invoice Extractor Logger is running',
            version: '1.0.0',
            stats: stats
        });
        
    } catch (error) {
        return createResponse({
            status: 'error',
            message: 'Please check SPREADSHEET_ID configuration',
            error: error.toString()
        }, 500);
    }
}

// ============= INITIALIZATION =============

/**
 * Initialize sheets if they don't exist
 */
function initializeSheets(spreadsheet) {
    // Initialize Usage Log sheet
    let usageSheet = spreadsheet.getSheetByName(USAGE_LOG_SHEET);
    if (!usageSheet) {
        usageSheet = createUsageLogSheet(spreadsheet);
    }
    
    // Initialize Summary sheet
    let summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET);
    if (!summarySheet) {
        summarySheet = createSummarySheet(spreadsheet);
    }
}

/**
 * Create Usage Log sheet with headers
 */
function createUsageLogSheet(spreadsheet) {
    const sheet = spreadsheet.insertSheet(USAGE_LOG_SHEET);
    
    // Define headers
    const headers = [
        'Timestamp',
        'User Email',
        'Session ID',
        'Event Type',
        'Number of Files',
        'Processing Time (sec)',
        'LLM Cost ($)',
        'Success Rate (%)',
        'Error Count',
        'Tool Version',
        'Error Details',
        'Total Amount (₹)',
        'IP Address',
        'User Agent'
    ];
    
    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A5568');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    
    // Set column widths
    const columnWidths = [
        180, // Timestamp
        200, // User Email
        150, // Session ID
        120, // Event Type
        120, // Number of Files
        150, // Processing Time
        100, // LLM Cost
        120, // Success Rate
        100, // Error Count
        100, // Tool Version
        300, // Error Details
        120, // Total Amount
        120, // IP Address
        200  // User Agent
    ];
    
    columnWidths.forEach((width, index) => {
        sheet.setColumnWidth(index + 1, width);
    });
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Add data validation for Event Type column
    const eventTypeRange = sheet.getRange(2, 4, sheet.getMaxRows() - 1);
    const eventTypeRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['session_start', 'session_end', 'process_complete', 'error', 'test'])
        .setAllowInvalid(true)
        .build();
    eventTypeRange.setDataValidation(eventTypeRule);
    
    return sheet;
}

/**
 * Create Summary sheet with statistics
 */
function createSummarySheet(spreadsheet) {
    const sheet = spreadsheet.insertSheet(SUMMARY_SHEET);
    
    // Set up summary structure
    const summaryData = [
        ['TravelPlus Invoice Extractor - Usage Summary', '', '', ''],
        ['', '', '', ''],
        ['Metric', 'Value', 'Last Updated', ''],
        ['Total Sessions', '0', new Date(), ''],
        ['Total Files Processed', '0', new Date(), ''],
        ['Total Users', '0', new Date(), ''],
        ['Average Success Rate', '0%', new Date(), ''],
        ['Total Processing Time (hours)', '0', new Date(), ''],
        ['Total Estimated Cost ($)', '0.00', new Date(), ''],
        ['', '', '', ''],
        ['Top Users (by sessions)', '', '', ''],
        ['Email', 'Sessions', 'Files', 'Success Rate'],
    ];
    
    sheet.getRange(1, 1, summaryData.length, 4).setValues(summaryData);
    
    // Format title
    sheet.getRange(1, 1, 1, 4).merge();
    sheet.getRange(1, 1).setFontSize(18);
    sheet.getRange(1, 1).setFontWeight('bold');
    sheet.getRange(1, 1).setHorizontalAlignment('center');
    sheet.getRange(1, 1).setBackground('#667eea');
    sheet.getRange(1, 1).setFontColor('#FFFFFF');
    
    // Format headers
    sheet.getRange(3, 1, 1, 3).setFontWeight('bold');
    sheet.getRange(3, 1, 1, 3).setBackground('#e2e8f0');
    sheet.getRange(12, 1, 1, 4).setFontWeight('bold');
    sheet.getRange(12, 1, 1, 4).setBackground('#e2e8f0');
    
    // Set column widths
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 180);
    sheet.setColumnWidth(4, 150);
    
    return sheet;
}

// ============= LOGGING FUNCTIONS =============

/**
 * Log usage data to the sheet
 */
function logUsageData(spreadsheet, data) {
    const sheet = spreadsheet.getSheetByName(USAGE_LOG_SHEET);
    
    // Prepare row data
    const row = [
        new Date().toISOString(),                    // Timestamp
        data.userEmail || '',                        // User Email
        data.sessionId || '',                        // Session ID
        data.event || 'process_complete',            // Event Type
        data.numberOfFiles || 0,                     // Number of Files
        data.processingTime || 0,                    // Processing Time
        data.llmCost || 0,                          // LLM Cost
        data.successRate || 0,                      // Success Rate
        data.errorCount || 0,                       // Error Count
        data.toolVersion || '1.0.0',                // Tool Version
        data.errorDetails || '',                    // Error Details
        data.totalAmount || 0,                      // Total Amount
        data.ipAddress || '',                       // IP Address
        data.userAgent || ''                        // User Agent
    ];
    
    // Append row
    sheet.appendRow(row);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    const newRowRange = sheet.getRange(lastRow, 1, 1, row.length);
    
    // Alternate row colors
    if (lastRow % 2 === 0) {
        newRowRange.setBackground('#f7fafc');
    }
    
    // Format currency columns
    sheet.getRange(lastRow, 7).setNumberFormat('$#,##0.00'); // LLM Cost
    sheet.getRange(lastRow, 12).setNumberFormat('₹#,##0.00'); // Total Amount
    
    // Format percentage
    sheet.getRange(lastRow, 8).setNumberFormat('0%'); // Success Rate
}

/**
 * Update summary statistics
 */
function updateSummary(spreadsheet, data) {
    const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET);
    const usageSheet = spreadsheet.getSheetByName(USAGE_LOG_SHEET);
    
    if (!usageSheet || !summarySheet) return;
    
    // Get all data from usage log
    const dataRange = usageSheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) return; // No data besides headers
    
    // Skip header row
    const logData = values.slice(1);
    
    // Calculate statistics
    const stats = calculateStatistics(logData);
    
    // Update summary sheet
    const now = new Date();
    summarySheet.getRange(4, 2).setValue(stats.totalSessions);
    summarySheet.getRange(4, 3).setValue(now);
    
    summarySheet.getRange(5, 2).setValue(stats.totalFiles);
    summarySheet.getRange(5, 3).setValue(now);
    
    summarySheet.getRange(6, 2).setValue(stats.uniqueUsers);
    summarySheet.getRange(6, 3).setValue(now);
    
    summarySheet.getRange(7, 2).setValue(stats.avgSuccessRate + '%');
    summarySheet.getRange(7, 3).setValue(now);
    
    summarySheet.getRange(8, 2).setValue((stats.totalProcessingTime / 3600).toFixed(2));
    summarySheet.getRange(8, 3).setValue(now);
    
    summarySheet.getRange(9, 2).setValue(stats.totalCost.toFixed(2));
    summarySheet.getRange(9, 3).setValue(now);
    
    // Update top users
    updateTopUsers(summarySheet, logData);
}

// ============= STATISTICS FUNCTIONS =============

/**
 * Calculate usage statistics
 */
function calculateStatistics(logData) {
    const sessions = logData.filter(row => 
        row[3] === 'process_complete' || row[3] === 'session_end'
    );
    
    const uniqueUsers = [...new Set(logData.map(row => row[1]).filter(Boolean))];
    const totalFiles = logData.reduce((sum, row) => sum + (row[4] || 0), 0);
    const totalProcessingTime = logData.reduce((sum, row) => sum + (row[5] || 0), 0);
    const totalCost = logData.reduce((sum, row) => sum + (row[6] || 0), 0);
    
    let avgSuccessRate = 0;
    if (sessions.length > 0) {
        const totalSuccessRate = sessions.reduce((sum, row) => sum + (row[7] || 0), 0);
        avgSuccessRate = Math.round(totalSuccessRate / sessions.length);
    }
    
    return {
        totalSessions: sessions.length,
        totalFiles: totalFiles,
        uniqueUsers: uniqueUsers.length,
        avgSuccessRate: avgSuccessRate,
        totalProcessingTime: totalProcessingTime,
        totalCost: totalCost
    };
}

/**
 * Update top users list
 */
function updateTopUsers(summarySheet, logData) {
    // Group by user email
    const userStats = {};
    
    logData.forEach(row => {
        const email = row[1];
        if (!email) return;
        
        if (!userStats[email]) {
            userStats[email] = {
                sessions: 0,
                files: 0,
                successRates: []
            };
        }
        
        if (row[3] === 'process_complete' || row[3] === 'session_end') {
            userStats[email].sessions++;
            userStats[email].files += row[4] || 0;
            if (row[7] !== null && row[7] !== '') {
                userStats[email].successRates.push(row[7]);
            }
        }
    });
    
    // Calculate average success rate for each user
    Object.keys(userStats).forEach(email => {
        const rates = userStats[email].successRates;
        if (rates.length > 0) {
            userStats[email].avgSuccessRate = 
                Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
        } else {
            userStats[email].avgSuccessRate = 0;
        }
    });
    
    // Sort by number of sessions
    const sortedUsers = Object.entries(userStats)
        .sort((a, b) => b[1].sessions - a[1].sessions)
        .slice(0, 10); // Top 10 users
    
    // Clear old data
    const startRow = 13;
    const clearRange = summarySheet.getRange(startRow, 1, 20, 4);
    clearRange.clear();
    
    // Write new data
    sortedUsers.forEach((entry, index) => {
        const row = startRow + index;
        summarySheet.getRange(row, 1).setValue(entry[0]);
        summarySheet.getRange(row, 2).setValue(entry[1].sessions);
        summarySheet.getRange(row, 3).setValue(entry[1].files);
        summarySheet.getRange(row, 4).setValue(entry[1].avgSuccessRate + '%');
    });
}

/**
 * Get usage statistics for GET request
 */
function getUsageStatistics(spreadsheet) {
    try {
        const usageSheet = spreadsheet.getSheetByName(USAGE_LOG_SHEET);
        if (!usageSheet) {
            return { error: 'Usage log sheet not found' };
        }
        
        const dataRange = usageSheet.getDataRange();
        const values = dataRange.getValues();
        
        if (values.length <= 1) {
            return {
                totalSessions: 0,
                totalFiles: 0,
                uniqueUsers: 0,
                avgSuccessRate: 0,
                totalProcessingTime: 0,
                totalCost: 0
            };
        }
        
        const logData = values.slice(1);
        return calculateStatistics(logData);
        
    } catch (error) {
        return { error: error.toString() };
    }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Create JSON response
 */
function createResponse(data, status = 200) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manual cleanup function - Run this from Apps Script editor
 */
function cleanupOldLogs(daysToKeep = 30) {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(USAGE_LOG_SHEET);
    
    if (!sheet) {
        console.log('Usage log sheet not found');
        return;
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
        console.log('No data to cleanup');
        return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let rowsDeleted = 0;
    
    // Work backwards to avoid index issues
    for (let i = values.length - 1; i > 0; i--) {
        const timestamp = new Date(values[i][0]);
        if (timestamp < cutoffDate) {
            sheet.deleteRow(i + 1);
            rowsDeleted++;
        }
    }
    
    console.log(`Deleted ${rowsDeleted} old log entries`);
    
    // Update summary after cleanup
    updateSummary(spreadsheet, {});
}

/**
 * Manual test function - Run this from Apps Script editor
 */
function testLogging() {
    const testData = {
        userEmail: 'test@fabhotels.com',
        sessionId: 'test-' + new Date().getTime(),
        event: 'test',
        numberOfFiles: 5,
        processingTime: 30,
        llmCost: 0.05,
        successRate: 80,
        errorCount: 1,
        toolVersion: '1.0.0',
        errorDetails: 'Test error',
        totalAmount: 25000
    };
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    initializeSheets(spreadsheet);
    logUsageData(spreadsheet, testData);
    updateSummary(spreadsheet, testData);
    
    console.log('Test data logged successfully');
}