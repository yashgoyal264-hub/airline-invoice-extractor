// CSV Generator Module
class CSVGenerator {
    constructor() {
        this.headers = CONFIG.CSV_HEADERS;
    }

    /**
     * Generate CSV from invoice data array
     * @param {array} invoiceData - Array of invoice data objects
     * @returns {string} - CSV string
     */
    generateCSV(invoiceData) {
        if (!invoiceData || invoiceData.length === 0) {
            return this.generateEmptyCSV();
        }

        // Prepare data for Papa Parse
        const csvData = this.prepareDataForCSV(invoiceData);

        // Use Papa Parse to generate CSV
        const csv = Papa.unparse({
            fields: this.headers,
            data: csvData
        }, {
            header: true,
            delimiter: ',',
            quotes: true,
            quoteChar: '"',
            escapeChar: '"',
            newline: '\r\n'
        });

        return csv;
    }

    /**
     * Generate empty CSV with headers only
     * @returns {string} - Empty CSV with headers
     */
    generateEmptyCSV() {
        return this.headers.join(',') + '\r\n';
    }

    /**
     * Prepare invoice data for CSV format
     * @param {array} invoiceData - Array of invoice objects
     * @returns {array} - Array of CSV row data
     */
    prepareDataForCSV(invoiceData) {
        return invoiceData.map(invoice => {
            return {
                'Document Type': invoice.documentType || 'Invoice',
                'Airline Invoice no.': invoice.airlineInvoiceNo || '',
                'Airline Invoice Date': invoice.airlineInvoiceDate || '',
                'Airline GST No.': invoice.airlineGSTNo || '',
                'Passenger Name': invoice.passengerName || '',
                'PNR': invoice.pnr || '',
                'Flight No.': invoice.flightNo || '',
                'From': invoice.from || '',
                'To': invoice.to || '',
                'Place of Supply': invoice.placeOfSupply || '',
                'Client GST No.': invoice.clientGSTNo || '',
                'GSTIN Customer Name': invoice.gstinCustomerName || '',
                'Taxable Value': this.formatAmount(invoice.taxableValue),
                'Non Taxable Value': this.formatAmount(invoice.nonTaxableValue),
                'CGST Amount': this.formatAmount(invoice.cgstAmount),
                'CGST %': this.formatPercent(invoice.cgstPercent),
                'SGST Amount': this.formatAmount(invoice.sgstAmount),
                'SGST %': this.formatPercent(invoice.sgstPercent),
                'IGST Amount': this.formatAmount(invoice.igstAmount),
                'IGST %': this.formatPercent(invoice.igstPercent),
                'Meal': this.formatAmount(invoice.meal),
                'Meal CGST Amount': this.formatAmount(invoice.mealCGSTAmount),
                'Meal CGST %': this.formatPercent(invoice.mealCGSTPercent),
                'Meal SGST Amount': this.formatAmount(invoice.mealSGSTAmount),
                'Meal SGST %': this.formatPercent(invoice.mealSGSTPercent),
                'Meal IGST Amount': this.formatAmount(invoice.mealIGSTAmount),
                'Meal IGST %': this.formatPercent(invoice.mealIGSTPercent),
                'Grand Total': this.formatAmount(invoice.grandTotal)
            };
        });
    }

    /**
     * Format amount for CSV
     * @param {number|string} amount - Amount value
     * @returns {string} - Formatted amount
     */
    formatAmount(amount) {
        if (amount === null || amount === undefined || amount === '') {
            return '0.00';
        }
        
        const num = parseFloat(amount) || 0;
        return num.toFixed(2);
    }

    /**
     * Format percentage for CSV
     * @param {number|string} percent - Percentage value
     * @returns {string} - Formatted percentage
     */
    formatPercent(percent) {
        if (percent === null || percent === undefined || percent === '') {
            return '0';
        }
        
        const num = parseFloat(percent) || 0;
        return num.toString();
    }

    /**
     * Download CSV file
     * @param {string} csvContent - CSV content
     * @param {string} fileName - Output file name
     */
    downloadCSV(csvContent, fileName = 'invoice_data.csv') {
        // Add timestamp to filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const finalFileName = `invoice_data_${timestamp}.csv`;

        // Create blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', finalFileName);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log(`CSV downloaded: ${finalFileName}`);
        return finalFileName;
    }

    /**
     * Generate summary statistics from invoice data
     * @param {array} invoiceData - Array of invoice objects
     * @returns {object} - Summary statistics
     */
    generateSummary(invoiceData) {
        if (!invoiceData || invoiceData.length === 0) {
            return {
                totalInvoices: 0,
                totalAmount: 0,
                totalTax: 0,
                avgInvoiceAmount: 0,
                flightCount: 0,
                mealCount: 0
            };
        }

        let totalAmount = 0;
        let totalTax = 0;
        let flightCount = 0;
        let mealCount = 0;

        invoiceData.forEach(invoice => {
            const grandTotal = parseFloat(invoice.grandTotal) || 0;
            totalAmount += grandTotal;

            const cgst = parseFloat(invoice.cgstAmount) || 0;
            const sgst = parseFloat(invoice.sgstAmount) || 0;
            const igst = parseFloat(invoice.igstAmount) || 0;
            const mealCGST = parseFloat(invoice.mealCGSTAmount) || 0;
            const mealSGST = parseFloat(invoice.mealSGSTAmount) || 0;
            const mealIGST = parseFloat(invoice.mealIGSTAmount) || 0;

            totalTax += cgst + sgst + igst + mealCGST + mealSGST + mealIGST;

            if (invoice.flightNo) {
                flightCount++;
            }

            if (parseFloat(invoice.meal) > 0) {
                mealCount++;
            }
        });

        return {
            totalInvoices: invoiceData.length,
            totalAmount: Math.round(totalAmount * 100) / 100,
            totalTax: Math.round(totalTax * 100) / 100,
            avgInvoiceAmount: Math.round((totalAmount / invoiceData.length) * 100) / 100,
            flightCount: flightCount,
            mealCount: mealCount
        };
    }

    /**
     * Validate CSV data
     * @param {array} invoiceData - Array of invoice objects
     * @returns {object} - Validation result
     */
    validateData(invoiceData) {
        const errors = [];
        const warnings = [];

        invoiceData.forEach((invoice, index) => {
            // Check required fields
            if (!invoice.airlineInvoiceNo && !invoice.pnr) {
                errors.push(`Row ${index + 1}: Missing both Invoice Number and PNR`);
            }

            if (!invoice.flightNo) {
                warnings.push(`Row ${index + 1}: Missing Flight Number`);
            }

            if (!invoice.grandTotal || parseFloat(invoice.grandTotal) === 0) {
                warnings.push(`Row ${index + 1}: Grand Total is zero or missing`);
            }

            // Validate GST numbers if present
            if (invoice.airlineGSTNo && !this.isValidGST(invoice.airlineGSTNo)) {
                warnings.push(`Row ${index + 1}: Invalid Airline GST Number format`);
            }

            if (invoice.clientGSTNo && !this.isValidGST(invoice.clientGSTNo)) {
                warnings.push(`Row ${index + 1}: Invalid Client GST Number format`);
            }

            // Check tax calculations
            const taxableValue = parseFloat(invoice.taxableValue) || 0;
            const igstPercent = parseFloat(invoice.igstPercent) || 0;
            const igstAmount = parseFloat(invoice.igstAmount) || 0;

            if (taxableValue > 0 && igstPercent > 0) {
                const calculatedIGST = (taxableValue * igstPercent) / 100;
                if (Math.abs(calculatedIGST - igstAmount) > 1) {
                    warnings.push(`Row ${index + 1}: IGST calculation mismatch`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate GST number format
     * @param {string} gst - GST number
     * @returns {boolean} - True if valid
     */
    isValidGST(gst) {
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2}$/;
        return gstPattern.test(gst);
    }

    /**
     * Export to Excel format (using CSV)
     * @param {array} invoiceData - Invoice data array
     * @returns {Blob} - Excel file blob
     */
    exportToExcel(invoiceData) {
        // For true Excel support, you'd need a library like SheetJS
        // For now, we'll create a CSV that Excel can open
        const csv = this.generateCSV(invoiceData);
        
        // Add BOM for Excel UTF-8 recognition
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csv;

        return new Blob([csvWithBOM], { 
            type: 'application/vnd.ms-excel;charset=utf-8;' 
        });
    }

    /**
     * Create preview table HTML
     * @param {array} invoiceData - Invoice data array
     * @param {number} limit - Maximum rows to show
     * @returns {string} - HTML table string
     */
    createPreviewTable(invoiceData, limit = 5) {
        if (!invoiceData || invoiceData.length === 0) {
            return '<p>No data to preview</p>';
        }

        const previewData = invoiceData.slice(0, limit);
        const csvData = this.prepareDataForCSV(previewData);

        let html = '<table class="preview-table">';
        
        // Headers
        html += '<thead><tr>';
        this.headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';

        // Body
        html += '<tbody>';
        csvData.forEach(row => {
            html += '<tr>';
            this.headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';

        html += '</table>';

        if (invoiceData.length > limit) {
            html += `<p class="preview-note">Showing ${limit} of ${invoiceData.length} rows</p>`;
        }

        return html;
    }
}

// Create singleton instance
const csvGenerator = new CSVGenerator();