// Email Validation Module
class EmailValidator {
    constructor() {
        this.validDomains = CONFIG.VALID_DOMAINS;
    }

    /**
     * Validate if email belongs to allowed domains
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailLower = email.toLowerCase().trim();
        
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLower)) {
            return false;
        }

        // Check if email ends with valid domain
        return this.validDomains.some(domain => 
            emailLower.endsWith(domain.toLowerCase())
        );
    }

    /**
     * Get validation feedback message
     * @param {string} email - Email address to validate
     * @returns {object} - Validation result with message
     */
    getValidationFeedback(email) {
        if (!email) {
            return {
                valid: false,
                message: ''
            };
        }

        const emailLower = email.toLowerCase().trim();
        
        // Check basic format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLower)) {
            return {
                valid: false,
                message: 'Please enter a valid email address'
            };
        }

        // Check domain
        const isValidDomain = this.validDomains.some(domain => 
            emailLower.endsWith(domain.toLowerCase())
        );

        if (isValidDomain) {
            return {
                valid: true,
                message: '✓ Valid email address'
            };
        } else {
            return {
                valid: false,
                message: CONFIG.ERRORS.INVALID_EMAIL
            };
        }
    }

    /**
     * Extract domain from email
     * @param {string} email - Email address
     * @returns {string} - Domain part of email
     */
    getDomain(email) {
        if (!email || !email.includes('@')) {
            return '';
        }
        return '@' + email.split('@')[1];
    }

    /**
     * Check if email is from FabHotels
     * @param {string} email - Email address
     * @returns {boolean} - True if FabHotels email
     */
    isFabHotelsEmail(email) {
        return email && email.toLowerCase().endsWith('@fabhotels.com');
    }

    /**
     * Check if email is from TravelPlus
     * @param {string} email - Email address
     * @returns {boolean} - True if TravelPlus email
     */
    isTravelPlusEmail(email) {
        return email && email.toLowerCase().endsWith('@travelplusapp.com');
    }

    /**
     * Sanitize email for storage
     * @param {string} email - Email address
     * @returns {string} - Sanitized email
     */
    sanitizeEmail(email) {
        return email ? email.toLowerCase().trim() : '';
    }
}

// Create singleton instance
const emailValidator = new EmailValidator();