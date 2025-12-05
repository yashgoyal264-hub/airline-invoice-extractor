// Data Extractor Module for Invoice Processing
class DataExtractor {
    constructor() {
        this.patterns = CONFIG.PATTERNS;
    }

    /**
     * Extract invoice data from parsed PDF text
     * @param {object} pdfData - Parsed PDF data
     * @param {string} fileName - Original file name
     * @returns {object} - Extracted invoice data
     */
    async extractInvoiceData(pdfData, fileName = '') {
        try {
            if (!pdfData.success || !pdfData.text) {
                throw new Error('Invalid PDF data');
            }

            const text = pdfData.text;
            const structured = pdfData.pages[0]?.structured || [];

            // Extract all fields
            const invoiceData = {
                documentType: this.extractDocumentType(text),
                airlineInvoiceNo: this.extractInvoiceNumber(text, structured),
                airlineInvoiceDate: this.extractInvoiceDate(text, structured),
                airlineGSTNo: this.extractAirlineGST(text, structured),
                passengerName: this.extractPassengerName(text, structured),
                pnr: this.extractPNR(text, structured),
                flightNo: this.extractFlightNumber(text, structured),
                from: this.extractFromLocation(text, structured),
                to: this.extractToLocation(text, structured),
                placeOfSupply: this.extractPlaceOfSupply(text, structured),
                clientGSTNo: this.extractClientGST(text, structured),
                gstinCustomerName: this.extractCustomerName(text, structured),
                taxableValue: this.extractTaxableValue(text, structured),
                nonTaxableValue: this.extractNonTaxableValue(text, structured),
                cgstAmount: this.extractCGSTAmount(text, structured),
                cgstPercent: this.extractCGSTPercent(text, structured),
                sgstAmount: this.extractSGSTAmount(text, structured),
                sgstPercent: this.extractSGSTPercent(text, structured),
                igstAmount: this.extractIGSTAmount(text, structured),
                igstPercent: this.extractIGSTPercent(text, structured),
                meal: this.extractMealAmount(text, structured),
                mealCGSTAmount: this.extractMealCGSTAmount(text, structured),
                mealCGSTPercent: this.extractMealCGSTPercent(text, structured),
                mealSGSTAmount: this.extractMealSGSTAmount(text, structured),
                mealSGSTPercent: this.extractMealSGSTPercent(text, structured),
                mealIGSTAmount: this.extractMealIGSTAmount(text, structured),
                mealIGSTPercent: this.extractMealIGSTPercent(text, structured),
                grandTotal: this.extractGrandTotal(text, structured),
                fileName: fileName
            };

            // Validate and clean data
            const cleanedData = this.cleanAndValidateData(invoiceData);
            
            return {
                success: true,
                data: cleanedData
            };

        } catch (error) {
            console.error('Data extraction error:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Extract document type
     */
    extractDocumentType(text) {
        // Check for Credit Note first
        if (text.match(/GST\s*Credit\s*Note/i) || text.match(/Credit\s*Note/i)) {
            return 'Credit Note';
        }
        // Default to Invoice
        return 'Invoice';
    }

    /**
     * Extract invoice number
     */
    extractInvoiceNumber(text, structured) {
        // Primary pattern for IndiGo format: Number : XX1234567ABCDEF
        const primaryPattern = /Number\s*:\s*([A-Z]{2}\d{7}[A-Z0-9]+)/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1];
        }

        // Try other patterns
        const patterns = [
            /Invoice\s*Number\s*[:#]?\s*([A-Z0-9]+)/i,
            /Invoice\s*No\s*[:#]?\s*([A-Z0-9]+)/i,
            /Tax\s*Invoice\s*No\s*[:#]?\s*([A-Z0-9]+)/i,
            /Document\s*No\s*[:#]?\s*([A-Z0-9]+)/i,
            /([A-Z]{2}\d{7}[A-Z0-9]+)/  // State code + numbers pattern
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Try structured text
        for (const line of structured) {
            if (line.text.toLowerCase().includes('invoice')) {
                const numbers = line.text.match(/([A-Z0-9]{10,})/);
                if (numbers) {
                    return numbers[1];
                }
            }
        }

        return '';
    }

    /**
     * Extract invoice date
     */
    extractInvoiceDate(text, structured) {
        // Primary pattern for IndiGo format: Date : DD-MMM-YYYY
        const primaryPattern = /Date\s*:\s*(\d{1,2}-[A-Za-z]{3}-\d{4})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1];
        }

        // Look for other date patterns
        const datePatterns = [
            /Date\s*[:#]?\s*(\d{1,2}[-\/]\w{3}[-\/]\d{4})/i,
            /Invoice\s*Date\s*[:#]?\s*(\d{1,2}[-\/]\w{3}[-\/]\d{4})/i,
            /(\d{1,2}-\w{3}-\d{4})/,
            /(\d{1,2}\/\d{1,2}\/\d{4})/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return '';
    }

    /**
     * Extract airline GST number
     */
    extractAirlineGST(text, structured) {
        // InterGlobe Aviation GST patterns
        const patterns = [
            /GSTIN\s*[:#]?\s*([A-Z0-9]{15})/i,
            /GST\s*No\s*[:#]?\s*([A-Z0-9]{15})/i,
            /GST\s*Registration\s*[:#]?\s*([A-Z0-9]{15})/i,
            /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/  // GST format
        ];

        for (const pattern of patterns) {
            const matches = text.matchAll(new RegExp(pattern, 'g'));
            for (const match of matches) {
                // First GST is usually airline's
                if (match[1] && this.isValidGST(match[1])) {
                    return match[1];
                }
            }
        }

        return '';
    }

    /**
     * Extract passenger name
     */
    extractPassengerName(text, structured) {
        const patterns = [
            /Passenger\s*Name\s*[:#]?\s*([A-Za-z\s]+)/i,
            /Guest\s*Name\s*[:#]?\s*([A-Za-z\s]+)/i,
            /Name\s*[:#]?\s*([A-Za-z\s]+)(?=\s*PNR)/i,
            /Traveller\s*[:#]?\s*([A-Za-z\s]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const name = match[1].trim();
                // Validate it's a name (not other text)
                if (name.length > 2 && name.length < 50 && !name.match(/\d/)) {
                    return name;
                }
            }
        }

        return '';
    }

    /**
     * Extract PNR
     */
    extractPNR(text, structured) {
        // Primary pattern for IndiGo format: PNR : XXXXXX
        const primaryPattern = /PNR\s*:\s*([A-Z0-9]{6})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1].toUpperCase();
        }

        const patterns = [
            /PNR\s*[:#]?\s*([A-Z0-9]{6})/i,
            /Booking\s*Reference\s*[:#]?\s*([A-Z0-9]{6})/i,
            /Record\s*Locator\s*[:#]?\s*([A-Z0-9]{6})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].toUpperCase();
            }
        }

        return '';
    }

    /**
     * Extract flight number
     */
    extractFlightNumber(text, structured) {
        // Primary pattern for IndiGo format: Flight No : 6E - 123
        const primaryPattern = /Flight\s*No\s*:\s*(6E\s*-\s*\d{3,4})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1].replace(/\s+/g, '');
        }

        const patterns = [
            /Flight\s*No\s*[:#]?\s*(6E[-\s]?\d{3,4})/i,
            /Flight\s*[:#]?\s*(6E[-\s]?\d{3,4})/i,
            /(6E\s*-\s*\d{3,4})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].replace(/\s/g, '-');
            }
        }

        return '';
    }

    /**
     * Extract from location
     */
    extractFromLocation(text, structured) {
        // Primary pattern for IndiGo format: From : XXX
        const primaryPattern = /From\s*:\s*([A-Z]{3})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1].toUpperCase();
        }

        const patterns = [
            /From\s*[:#]?\s*([A-Z]{3})/i,
            /Origin\s*[:#]?\s*([A-Z]{3})/i,
            /Departure\s*[:#]?\s*([A-Z]{3})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Try city name lookup
        return this.extractAirportCodeFromCity(text, 'from');
    }

    /**
     * Extract to location
     */
    extractToLocation(text, structured) {
        // Primary pattern for IndiGo format: To : XXX
        const primaryPattern = /To\s*:\s*([A-Z]{3})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1].toUpperCase();
        }

        const patterns = [
            /To\s*[:#]?\s*([A-Z]{3})/i,
            /Destination\s*[:#]?\s*([A-Z]{3})/i,
            /Arrival\s*[:#]?\s*([A-Z]{3})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Try city name lookup
        return this.extractAirportCodeFromCity(text, 'to');
    }

    /**
     * Extract place of supply
     */
    extractPlaceOfSupply(text, structured) {
        // Primary pattern for IndiGo format: Place of Supply : State Name
        const primaryPattern = /Place\s*of\s*Supply\s*:\s*([A-Za-z\s]+?)(?=\s*(?:GSTIN|\n|$))/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            return primaryMatch[1].trim();
        }

        const patterns = [
            /Place\s*of\s*Supply\s*[:#]?\s*([A-Za-z\s]+)/i,
            /Supply\s*State\s*[:#]?\s*([A-Za-z\s]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const place = match[1].trim();
                // Clean up common additions
                return place.split(/[,\n]/)[0].trim();
            }
        }

        return '';
    }

    /**
     * Extract client GST number
     */
    extractClientGST(text, structured) {
        // Primary pattern - exact match for IndiGo invoice format
        const primaryPattern = /GSTIN\s+of\s+Customer\s*:\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch && this.isValidGST(primaryMatch[1])) {
            return primaryMatch[1];
        }

        // Secondary patterns for other formats
        const clientGSTPatterns = [
            /GSTIN\s*of\s*Customer\s*[:#]\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/i,
            /Customer\s*GSTIN?[:#]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/i,
            /Client\s*GSTIN?[:#]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/i
        ];

        // First try specific patterns
        for (const pattern of clientGSTPatterns) {
            const match = text.match(pattern);
            if (match && this.isValidGST(match[1])) {
                return match[1];
            }
        }

        // Fallback: Find all GST numbers and return the second one (first is usually airline's)
        const gstPattern = /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/g;
        const matches = [...text.matchAll(gstPattern)];
        
        if (matches.length > 1) {
            // Try to identify which is the client's GST
            for (let i = 1; i < matches.length; i++) {
                const gst = matches[i][1];
                const index = matches[i].index;
                
                // Check if this GST appears near customer-related keywords
                const contextStart = Math.max(0, index - 100);
                const contextEnd = Math.min(text.length, index + 100);
                const context = text.substring(contextStart, contextEnd).toLowerCase();
                
                if (context.includes('customer') || 
                    context.includes('client') || 
                    context.includes('bill to') ||
                    context.includes('billed to') ||
                    context.includes('buyer') ||
                    context.includes('sold to')) {
                    return gst;
                }
            }
            
            // If no context found, return the second GST (usually client's)
            return matches[1][1];
        }

        // Try structured text approach
        for (let i = 0; i < structured.length; i++) {
            const line = structured[i];
            if (line.text.match(/customer|client|bill to|buyer/i)) {
                // Look at next few lines for GST
                for (let j = i; j < Math.min(i + 5, structured.length); j++) {
                    const gstMatch = structured[j].text.match(/([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/);
                    if (gstMatch && this.isValidGST(gstMatch[1])) {
                        return gstMatch[1];
                    }
                }
            }
        }

        return '';
    }

    /**
     * Extract customer name
     */
    extractCustomerName(text, structured) {
        // Primary pattern - exact match for IndiGo invoice format
        const primaryPattern = /GSTIN\s+Customer\s+Name\s*:\s*([A-Z0-9\s&.,\-()]+?)(?=\s*(?:Currency|\n\n|$))/i;
        const primaryMatch = text.match(primaryPattern);
        
        if (primaryMatch) {
            const name = primaryMatch[1].trim();
            if (name && name.length > 3) {
                return name;
            }
        }

        // Secondary patterns for other formats
        const patterns = [
            /GSTIN\s*Customer\s*Name\s*[:#]\s*([^\n]+)/i,
            /Bill\s*To\s*[:#]?\s*([A-Za-z0-9\s&.,\-()]+?)(?=\s*(?:GSTIN|GST|Address|Phone|Email|Tel|Fax|\n\n|\d{2}[A-Z]{5}))/is,
            /Billed\s*To\s*[:#]?\s*([A-Za-z0-9\s&.,\-()]+?)(?=\s*(?:GSTIN|GST|Address|Phone|Email|Tel|Fax|\n\n|\d{2}[A-Z]{5}))/is,
            /Customer\s*Name\s*[:#]?\s*([A-Za-z0-9\s&.,\-()]+?)(?=\s*(?:GSTIN|GST|Address|Phone|Email|Tel|Fax|\n\n|\d{2}[A-Z]{5}))/is,
            /Customer\s*[:#]?\s*([A-Za-z0-9\s&.,\-()]+?)(?=\s*(?:GSTIN|GST|Address|Phone|Email|Tel|Fax|\n\n|\d{2}[A-Z]{5}))/is
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let name = match[1].trim();
                
                // Clean up the extracted name
                name = name
                    .replace(/\s+/g, ' ')           // Multiple spaces to single
                    .replace(/\n/g, ' ')             // Newlines to spaces
                    .replace(/[,.]$/, '')            // Remove trailing punctuation
                    .trim();
                
                // Validate and clean
                if (name.length > 3 && name.length < 200) {
                    // Additional cleanup for common patterns
                    if (name.includes(',')) {
                        name = name.split(',')[0].trim();
                    }
                    
                    // Check if it's not just numbers or special chars
                    if (!/^\d+$/.test(name) && !/^[^A-Za-z]+$/.test(name)) {
                        return name;
                    }
                }
            }
        }

        // Fallback: Try to find customer name near client GST number
        const gstPattern = /([A-Za-z0-9\s&.,\-()]+?)\s*(?:GSTIN|GST\s*No|GST\s*Number)[:#]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2})/i;
        const gstMatch = text.match(gstPattern);
        if (gstMatch && gstMatch[1]) {
            let name = gstMatch[1].trim();
            
            // Remove common prefixes
            name = name.replace(/^(Bill\s*To|Customer|Company|Invoice\s*To)[:#]?\s*/i, '').trim();
            
            if (name.length > 3 && name.length < 200 && !/^\d+$/.test(name)) {
                return name;
            }
        }

        // Another fallback: Look between "Bill To" and next section
        const billToMatch = text.match(/(?:Bill\s*To|Billed\s*To|Customer|Sold\s*To)[:#]?\s*\n?\s*([^\n]{3,100})/i);
        if (billToMatch) {
            let name = billToMatch[1].trim();
            
            // Clean up
            name = name
                .replace(/^[:#\s]+/, '')        // Remove leading colons/spaces
                .replace(/\s*GSTIN.*$/i, '')    // Remove GSTIN and everything after
                .replace(/\s*GST.*$/i, '')      // Remove GST and everything after
                .replace(/\s*Address.*$/i, '')  // Remove Address and everything after
                .trim();
            
            if (name.length > 3 && name.length < 200 && !/^\d+$/.test(name) && !/^[^A-Za-z]+$/.test(name)) {
                return name;
            }
        }

        // Try structured text approach
        for (const line of structured) {
            const lineText = line.text.toLowerCase();
            if (lineText.includes('bill to') || lineText.includes('customer') || lineText.includes('sold to')) {
                // Look at the next few lines
                const lineIndex = structured.indexOf(line);
                for (let i = 1; i <= 3; i++) {
                    if (lineIndex + i < structured.length) {
                        const nextLine = structured[lineIndex + i].text.trim();
                        
                        // Check if this looks like a company name
                        if (nextLine.length > 3 && 
                            nextLine.length < 200 && 
                            !/^\d+$/.test(nextLine) && 
                            !/^[^A-Za-z]+$/.test(nextLine) &&
                            !nextLine.match(/^(GSTIN|GST|Phone|Email|Tel|Fax|Address)/i)) {
                            
                            return nextLine.split(/[,\n]/)[0].trim();
                        }
                    }
                }
            }
        }

        return '';
    }

    /**
     * Extract air travel taxable amount specifically
     */
    extractAirTravelTaxable(text, structured) {
        // Pattern to match Air Travel line with taxable value
        // Handles: "Air Travel and\nrelated charges 996425 11,598.00"
        const pattern = /Air\s*Travel\s*and[\s\n]*related\s*charges\s+996425\s+([\d,]+\.?\d*)/i;
        const match = text.match(pattern);
        
        if (match) {
            return this.parseAmount(match[1]);
        }

        return 0;
    }

    /**
     * Extract taxable value
     */
    extractTaxableValue(text, structured) {
        // Get Air Travel taxable amount
        const airTravelTaxable = this.extractAirTravelTaxable(text, structured);
        
        // Get Meal taxable amount if present
        const mealAmount = this.extractMealAmount(text, structured);
        
        // Return total taxable value
        return airTravelTaxable + mealAmount;
    }

    /**
     * Extract non-taxable value
     */
    extractNonTaxableValue(text, structured) {
        // Look for Airport Charges line: Airport Charges 0.00 [non_taxable_value] [total]
        const airportChargesPattern = /Airport\s*Charges\s+[\d.]+\s+([\d,]+\.\d{2})\s+[\d,]+\.\d{2}/i;
        const airportMatch = text.match(airportChargesPattern);
        
        if (airportMatch) {
            return this.parseAmount(airportMatch[1]);
        }

        return 0;
    }

    /**
     * Extract CGST amount
     */
    extractCGSTAmount(text, structured) {
        const patterns = [
            /CGST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i,
            /Central\s*GST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return this.parseAmount(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extract CGST percent
     */
    extractCGSTPercent(text, structured) {
        const patterns = [
            /CGST\s*@?\s*(\d+\.?\d*)%/i,
            /CGST.*?(\d+\.?\d*)%/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1]);
            }
        }

        // Default for interstate is 0
        return 0;
    }

    /**
     * Extract SGST amount
     */
    extractSGSTAmount(text, structured) {
        const patterns = [
            /SGST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i,
            /State\s*GST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return this.parseAmount(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extract SGST percent
     */
    extractSGSTPercent(text, structured) {
        const patterns = [
            /SGST\s*@?\s*(\d+\.?\d*)%/i,
            /SGST.*?(\d+\.?\d*)%/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extract IGST amount
     */
    extractIGSTAmount(text, structured) {
        // Simple pattern: Look for "5.00 [IGST_amount]" where 5.00 is IGST %
        const igstPattern = /5\.00\s+([\d,]+\.?\d*)/;
        const match = text.match(igstPattern);
        
        if (match) {
            const airTravelIGST = this.parseAmount(match[1]);
            
            // Check for meal IGST (18%)
            let mealIGST = 0;
            const mealPattern = /18\.00\s+([\d,]+\.?\d*)/;
            const mealMatch = text.match(mealPattern);
            if (mealMatch) {
                mealIGST = this.parseAmount(mealMatch[1]);
            }
            
            return airTravelIGST + mealIGST;
        }
        
        // Fallback: Extract from Grand Total row
        const gtPattern = /Grand\s*Total[\s\S]{0,100}?([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/;
        const gtMatch = text.match(gtPattern);
        if (gtMatch) {
            // The 4th number should be IGST amount
            return this.parseAmount(gtMatch[4]);
        }

        return 0;
    }

    /**
     * Extract IGST percent
     */
    extractIGSTPercent(text, structured) {
        // For Air Travel, IGST is usually 5%
        const airTravelPattern = /Air\s*Travel[\s\S]*?996425[\s\S]*?(\d+\.?\d{2})\s+[\d,]+\.?\d*/i;
        const airMatch = text.match(airTravelPattern);
        
        if (airMatch) {
            return 5; // Standard rate for air travel
        }

        // Default for flights is usually 5%
        return 5;
    }

    /**
     * Extract meal amount
     */
    extractMealAmount(text, structured) {
        // Look for Meal line: Meal 996335 [taxable_value] [non_taxable]
        const mealPattern = /Meal\s+996335\s+([\d,]+\.\d{2})\s+[\d.]+/i;
        const mealMatch = text.match(mealPattern);
        
        if (mealMatch) {
            return this.parseAmount(mealMatch[1]);
        }

        return 0;
    }

    /**
     * Extract meal CGST amount
     */
    extractMealCGSTAmount(text, structured) {
        // Look for CGST specifically related to meals
        const mealSection = this.findMealSection(text);
        if (mealSection) {
            const match = mealSection.match(/CGST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i);
            if (match) {
                return this.parseAmount(match[1]);
            }
        }
        return 0;
    }

    /**
     * Extract meal CGST percent
     */
    extractMealCGSTPercent(text, structured) {
        const mealSection = this.findMealSection(text);
        if (mealSection) {
            const match = mealSection.match(/CGST\s*@?\s*(\d+\.?\d*)%/i);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return 0;
    }

    /**
     * Extract meal SGST amount
     */
    extractMealSGSTAmount(text, structured) {
        const mealSection = this.findMealSection(text);
        if (mealSection) {
            const match = mealSection.match(/SGST\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i);
            if (match) {
                return this.parseAmount(match[1]);
            }
        }
        return 0;
    }

    /**
     * Extract meal SGST percent
     */
    extractMealSGSTPercent(text, structured) {
        const mealSection = this.findMealSection(text);
        if (mealSection) {
            const match = mealSection.match(/SGST\s*@?\s*(\d+\.?\d*)%/i);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return 0;
    }

    /**
     * Extract meal IGST amount
     */
    extractMealIGSTAmount(text, structured) {
        // Look for Meal line with IGST amount (18% tax pattern)
        const mealIGSTPattern = /Meal\s+996335\s+[\d,]+\.?\d*\s+[\d.]+\s+[\d,]+\.?\d*\s+18\.00\s+([\d,]+\.?\d*)/i;
        const mealMatch = text.match(mealIGSTPattern);
        
        if (mealMatch) {
            return this.parseAmount(mealMatch[1]);
        }

        // Alternative: Look for meal amount and calculate 18% IGST
        const mealAmount = this.extractMealAmount(text, structured);
        if (mealAmount > 0) {
            // Check if there's an explicit 18% IGST mentioned
            const igst18Pattern = /Meal[\s\S]*?18\.00\s+([\d,]+\.?\d*)/i;
            const match = text.match(igst18Pattern);
            if (match) {
                return this.parseAmount(match[1]);
            }
        }
        
        return 0;
    }

    /**
     * Extract meal IGST percent
     */
    extractMealIGSTPercent(text, structured) {
        // Check if meal exists
        const mealPattern = /Meal\s+996335\s+[\d,]+\.?\d*/i;
        const mealExists = text.match(mealPattern);
        
        if (mealExists) {
            // Meal GST is always 18%
            return 18;
        }
        
        return 0;
    }

    /**
     * Extract grand total
     */
    extractGrandTotal(text, structured) {
        // Look for all numbers in Grand Total row and take the last one
        const gtPattern = /Grand\s*Total[\s\S]{0,150}/i;
        const gtMatch = text.match(gtPattern);
        
        if (gtMatch) {
            // Find all decimal numbers in the Grand Total section
            const numbers = gtMatch[0].match(/[\d,]+\.\d{2}/g);
            if (numbers && numbers.length > 0) {
                // The last number should be the grand total
                return this.parseAmount(numbers[numbers.length - 1]);
            }
        }

        // Fallback patterns
        const patterns = [
            /Total\s*\(Incl\s*Taxes\)\s*[\d,]+\.?\d*\s*([\d,]+\.?\d*)/i,
            /Grand\s*Total\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i,
            /Total\s*Amount\s*[:#]?\s*₹?\s*([\d,]+\.?\d*)/i
        ];

        let maxAmount = 0;
        for (const pattern of patterns) {
            const matches = text.matchAll(new RegExp(pattern, 'g'));
            for (const match of matches) {
                const amount = this.parseAmount(match[1]);
                if (amount > maxAmount) {
                    maxAmount = amount;
                }
            }
        }

        return maxAmount;
    }

    /**
     * Helper: Find meal section in text
     */
    findMealSection(text) {
        const mealIndex = text.search(/meal|food|refreshment/i);
        if (mealIndex > -1) {
            // Extract section around meal (200 chars)
            return text.substring(mealIndex, mealIndex + 200);
        }
        return '';
    }

    /**
     * Helper: Extract airport code from city name
     */
    extractAirportCodeFromCity(text, direction) {
        for (const [city, code] of Object.entries(CONFIG.AIRPORT_CODES)) {
            const pattern = new RegExp(
                direction === 'from' 
                    ? `(From|Origin|Departure).*?${city}` 
                    : `(To|Destination|Arrival).*?${city}`,
                'i'
            );
            if (text.match(pattern)) {
                return code;
            }
        }
        return '';
    }

    /**
     * Helper: Parse amount string to number
     */
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        const cleaned = amountStr.toString().replace(/[,₹]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    /**
     * Helper: Validate GST number
     */
    isValidGST(gst) {
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z0-9]{2}$/;
        return gstPattern.test(gst);
    }

    /**
     * Clean and validate extracted data
     */
    cleanAndValidateData(data) {
        // Ensure all fields exist
        const cleaned = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                cleaned[key] = value.trim();
            } else if (typeof value === 'number') {
                cleaned[key] = Math.round(value * 100) / 100; // Round to 2 decimals
            } else {
                cleaned[key] = value || '';
            }
        }

        // Additional validation
        if (!cleaned.pnr && !cleaned.airlineInvoiceNo) {
            console.warn('Missing critical identifiers (PNR/Invoice No)');
        }

        return cleaned;
    }
}

// Create singleton instance
const dataExtractor = new DataExtractor();