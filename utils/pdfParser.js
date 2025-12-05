// PDF Parser Module using PDF.js
class PDFParser {
    constructor() {
        // Set PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Parse PDF file and extract text
     * @param {File|ArrayBuffer} file - PDF file or buffer
     * @returns {Promise<object>} - Extracted text and metadata
     */
    async parsePDF(file) {
        try {
            let arrayBuffer;
            
            if (file instanceof File) {
                arrayBuffer = await this.fileToArrayBuffer(file);
            } else {
                arrayBuffer = file;
            }

            // Load PDF document
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Extract text from all pages
            const textContent = await this.extractTextFromPages(pdf);
            
            // Get metadata
            const metadata = await pdf.getMetadata();
            
            return {
                success: true,
                text: textContent.text,
                pages: textContent.pages,
                metadata: metadata.info,
                pageCount: pdf.numPages
            };
            
        } catch (error) {
            console.error('PDF parsing error:', error);
            return {
                success: false,
                error: `Failed to parse PDF: ${error.message}`,
                text: '',
                pages: []
            };
        }
    }

    /**
     * Convert File to ArrayBuffer
     * @param {File} file - File object
     * @returns {Promise<ArrayBuffer>} - ArrayBuffer
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract text from all pages
     * @param {PDFDocument} pdf - PDF document object
     * @returns {Promise<object>} - Combined text and page array
     */
    async extractTextFromPages(pdf) {
        const pages = [];
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Extract text items and combine
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                pages.push({
                    pageNumber: pageNum,
                    text: pageText
                });

                fullText += pageText + '\n\n';

                // Also try to extract structured text with positions
                const structuredText = await this.extractStructuredText(textContent);
                pages[pageNum - 1].structured = structuredText;

            } catch (error) {
                console.error(`Error extracting text from page ${pageNum}:`, error);
                pages.push({
                    pageNumber: pageNum,
                    text: '',
                    error: error.message
                });
            }
        }

        return {
            text: fullText,
            pages: pages
        };
    }

    /**
     * Extract structured text with positions
     * @param {object} textContent - PDF.js text content
     * @returns {array} - Structured text items
     */
    extractStructuredText(textContent) {
        const structured = [];
        let currentLine = [];
        let lastY = null;

        textContent.items.forEach(item => {
            const y = item.transform[5];
            
            // Check if this is a new line (different Y position)
            if (lastY !== null && Math.abs(y - lastY) > 2) {
                if (currentLine.length > 0) {
                    structured.push({
                        text: currentLine.map(i => i.str).join(' '),
                        y: lastY,
                        items: currentLine
                    });
                    currentLine = [];
                }
            }

            currentLine.push(item);
            lastY = y;
        });

        // Add the last line
        if (currentLine.length > 0) {
            structured.push({
                text: currentLine.map(i => i.str).join(' '),
                y: lastY,
                items: currentLine
            });
        }

        // Sort by Y position (top to bottom)
        structured.sort((a, b) => b.y - a.y);

        return structured;
    }

    /**
     * Find text in specific region
     * @param {array} structured - Structured text array
     * @param {string} label - Label to search for
     * @returns {string} - Found value or empty string
     */
    findValueAfterLabel(structured, label) {
        for (let i = 0; i < structured.length; i++) {
            const line = structured[i].text;
            if (line.toLowerCase().includes(label.toLowerCase())) {
                // Check the same line first
                const sameLine = line.split(label)[1];
                if (sameLine && sameLine.trim()) {
                    return sameLine.trim();
                }
                
                // Check next line
                if (i + 1 < structured.length) {
                    return structured[i + 1].text.trim();
                }
            }
        }
        return '';
    }

    /**
     * Extract tables from PDF text
     * @param {string} text - PDF text content
     * @returns {array} - Extracted tables
     */
    extractTables(text) {
        const tables = [];
        const lines = text.split('\n');
        let currentTable = [];
        let inTable = false;

        lines.forEach(line => {
            // Detect table-like content (multiple columns separated by spaces)
            const columns = line.trim().split(/\s{2,}/);
            
            if (columns.length >= 3) {
                inTable = true;
                currentTable.push(columns);
            } else if (inTable && line.trim() === '') {
                // Empty line might signal end of table
                if (currentTable.length > 0) {
                    tables.push(currentTable);
                    currentTable = [];
                    inTable = false;
                }
            }
        });

        // Add the last table if exists
        if (currentTable.length > 0) {
            tables.push(currentTable);
        }

        return tables;
    }

    /**
     * Clean and normalize extracted text
     * @param {string} text - Raw text
     * @returns {string} - Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/[\r\n]+/g, '\n')      // Normalize line breaks
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .trim();
    }

    /**
     * Extract amount from text
     * @param {string} text - Text containing amount
     * @returns {number} - Extracted amount or 0
     */
    extractAmount(text) {
        const amountMatch = text.match(/₹?\s*([\d,]+\.?\d*)/);
        if (amountMatch) {
            return parseFloat(amountMatch[1].replace(/,/g, '')) || 0;
        }
        return 0;
    }

    /**
     * Extract date from text
     * @param {string} text - Text containing date
     * @returns {string} - Extracted date or empty string
     */
    extractDate(text) {
        // Common date formats in invoices
        const patterns = [
            /(\d{1,2}[-\/]\w{3}[-\/]\d{4})/,  // 01-Jan-2024
            /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/, // 01/01/2024 or 01-01-2024
            /(\w{3} \d{1,2}, \d{4})/,          // Jan 01, 2024
            /(\d{1,2} \w{3} \d{4})/             // 01 Jan 2024
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return '';
    }

    /**
     * Validate PDF file
     * @param {File} file - File to validate
     * @returns {object} - Validation result
     */
    validatePDFFile(file) {
        // Check file type
        if (!file.type.includes('pdf')) {
            return {
                valid: false,
                error: 'File is not a PDF'
            };
        }

        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: CONFIG.ERRORS.FILE_TOO_LARGE
            };
        }

        return {
            valid: true
        };
    }
}

// Create singleton instance
const pdfParser = new PDFParser();