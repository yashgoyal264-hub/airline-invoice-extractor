// Configuration Constants
const CONFIG = {
    // Google Apps Script Web App URL (replace with your actual deployed URL)
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyjw6rK5t091HYlbh8sYn0_BU2KB1rDt9mLSZrYdDgVG6B6X9AOif3XqMkVZs7DCm1gzg/exec',
    
    // Valid email domains
    VALID_DOMAINS: ['@fabhotels.com', '@travelplusapp.com'],
    
    // Tool version
    TOOL_VERSION: '1.0.0',
    
    // CSV Column Headers
    CSV_HEADERS: [
        'Document Type',
        'Airline Invoice no.',
        'Airline Invoice Date',
        'Airline GST No.',
        'Passenger Name',
        'PNR',
        'Flight No.',
        'From',
        'To',
        'Place of Supply',
        'Client GST No.',
        'GSTIN Customer Name',
        'Taxable Value',
        'Non Taxable Value',
        'CGST Amount',
        'CGST %',
        'SGST Amount',
        'SGST %',
        'IGST Amount',
        'IGST %',
        'Meal',
        'Meal CGST Amount',
        'Meal CGST %',
        'Meal SGST Amount',
        'Meal SGST %',
        'Meal IGST Amount',
        'Meal IGST %',
        'Grand Total'
    ],
    
    // Processing limits
    MAX_FILES: 50,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    PROCESSING_TIMEOUT: 30000, // 30 seconds per file
    
    // Google Drive patterns
    DRIVE_URL_PATTERNS: [
        /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
        /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/
    ],
    
    // Regular expressions for data extraction
    PATTERNS: {
        INVOICE_NO: /(?:Invoice No[.:]?\s*|Invoice Number[.:]?\s*|Tax Invoice No[.:]?\s*)([A-Z0-9]+)/i,
        PNR: /(?:PNR[.:]?\s*|Booking Reference[.:]?\s*|Record Locator[.:]?\s*)([A-Z0-9]{6})/i,
        FLIGHT_NO: /(?:Flight No[.:]?\s*|Flight[.:]?\s*)(6E[-\s]?\d{3,4})/i,
        GST_NO: /(?:GSTIN[.:]?\s*|GST No[.:]?\s*|GST Number[.:]?\s*)([A-Z0-9]{15})/i,
        DATE: /(\d{1,2}[-\/]\w{3}[-\/]\d{4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
        AMOUNT: /₹?\s*([\d,]+\.?\d*)/,
        AIRPORT_CODE: /\b([A-Z]{3})\b/,
        PASSENGER: /(?:Passenger Name[.:]?\s*|Name[.:]?\s*|Guest Name[.:]?\s*)([A-Za-z\s]+)/i,
        DOCUMENT_TYPE: /(Tax Invoice|Credit Note|Invoice|Debit Note)/i
    },
    
    // Tax rates
    TAX_RATES: {
        FLIGHT_GST: 5,
        MEAL_GST: 18,
        DEFAULT_CGST: 2.5,
        DEFAULT_SGST: 2.5,
        DEFAULT_IGST: 5
    },
    
    // Airport codes mapping (commonly used)
    AIRPORT_CODES: {
        'Pune': 'PNQ',
        'Mumbai': 'BOM',
        'Delhi': 'DEL',
        'Bangalore': 'BLR',
        'Bengaluru': 'BLR',
        'Chennai': 'MAA',
        'Kolkata': 'CCU',
        'Hyderabad': 'HYD',
        'Goa': 'GOI',
        'Ahmedabad': 'AMD',
        'Jaipur': 'JAI',
        'Lucknow': 'LKO',
        'Chandigarh': 'IXC',
        'Guwahati': 'GAU',
        'Bhubaneswar': 'BBI',
        'Indore': 'IDR',
        'Nagpur': 'NAG',
        'Patna': 'PAT',
        'Ranchi': 'IXR',
        'Srinagar': 'SXR',
        'Vadodara': 'BDQ',
        'Varanasi': 'VNS',
        'Visakhapatnam': 'VTZ',
        'Vizag': 'VTZ'
    },
    
    // Error messages
    ERRORS: {
        INVALID_EMAIL: 'Please use your official company email address',
        NO_FILES: 'Please select at least one PDF file to process',
        FILE_TOO_LARGE: 'File size exceeds 10MB limit',
        INVALID_PDF: 'Invalid or corrupted PDF file',
        EXTRACTION_FAILED: 'Failed to extract data from PDF',
        NETWORK_ERROR: 'Network error. Please check your connection',
        DRIVE_ACCESS_ERROR: 'Unable to access Google Drive file. Please check permissions',
        LOGGING_ERROR: 'Failed to log usage data, but processing continues',
        PROCESSING_TIMEOUT: 'Processing timeout exceeded'
    }
};