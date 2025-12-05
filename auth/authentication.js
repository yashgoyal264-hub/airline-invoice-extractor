// Authentication Module
class Authentication {
    constructor() {
        this.storageKey = 'travelplus_user_email';
        this.sessionKey = 'travelplus_session';
    }

    /**
     * Initialize authentication
     */
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Setup event listeners for authentication modal
     */
    setupEventListeners() {
        const emailInput = document.getElementById('emailInput');
        const authSubmit = document.getElementById('authSubmit');
        const logoutBtn = document.getElementById('logoutBtn');

        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                this.handleEmailInput(e.target.value);
            });

            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !authSubmit.disabled) {
                    this.handleAuthSubmit();
                }
            });
        }

        if (authSubmit) {
            authSubmit.addEventListener('click', () => {
                this.handleAuthSubmit();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    /**
     * Handle email input changes
     * @param {string} email - Email value from input
     */
    handleEmailInput(email) {
        const validation = emailValidator.getValidationFeedback(email);
        const validationDiv = document.getElementById('emailValidation');
        const submitBtn = document.getElementById('authSubmit');

        if (validationDiv) {
            validationDiv.textContent = validation.message;
            validationDiv.className = 'validation-feedback ' + (validation.valid ? 'valid' : 'invalid');
        }

        if (submitBtn) {
            submitBtn.disabled = !validation.valid;
        }
    }

    /**
     * Handle authentication submit
     */
    handleAuthSubmit() {
        const emailInput = document.getElementById('emailInput');
        const email = emailInput ? emailInput.value.trim() : '';

        if (emailValidator.validateEmail(email)) {
            this.authenticate(email);
        } else {
            this.showAuthError(CONFIG.ERRORS.INVALID_EMAIL);
        }
    }

    /**
     * Authenticate user and store credentials
     * @param {string} email - Validated email address
     */
    authenticate(email) {
        try {
            const sanitizedEmail = emailValidator.sanitizeEmail(email);
            
            // Store email in localStorage
            localStorage.setItem(this.storageKey, sanitizedEmail);
            
            // Create session
            const session = {
                email: sanitizedEmail,
                loginTime: new Date().toISOString(),
                domain: emailValidator.getDomain(sanitizedEmail)
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));

            // Hide auth modal and show main app
            this.showMainApp(sanitizedEmail);

            // Log successful authentication
            console.log('User authenticated:', sanitizedEmail);
            
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAuthError('Authentication failed. Please try again.');
        }
    }

    /**
     * Check authentication status on page load
     */
    checkAuthStatus() {
        const storedEmail = localStorage.getItem(this.storageKey);

        if (storedEmail && emailValidator.validateEmail(storedEmail)) {
            // Valid stored email, show main app
            this.showMainApp(storedEmail);
            
            // Restore session
            const session = {
                email: storedEmail,
                loginTime: new Date().toISOString(),
                domain: emailValidator.getDomain(storedEmail)
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
        } else {
            // No valid email, show auth modal
            this.showAuthModal();
        }
    }

    /**
     * Show authentication modal
     */
    showAuthModal() {
        const authModal = document.getElementById('authModal');
        const mainApp = document.getElementById('mainApp');

        if (authModal) {
            authModal.classList.remove('hidden');
        }
        if (mainApp) {
            mainApp.classList.add('hidden');
        }
    }

    /**
     * Show main application
     * @param {string} email - Authenticated user email
     */
    showMainApp(email) {
        const authModal = document.getElementById('authModal');
        const mainApp = document.getElementById('mainApp');
        const userEmailSpan = document.getElementById('userEmail');

        if (authModal) {
            authModal.classList.add('hidden');
        }
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
        if (userEmailSpan) {
            userEmailSpan.textContent = email;
        }

        // Initialize the main application
        if (typeof initializeApp === 'function') {
            initializeApp(email);
        }
    }

    /**
     * Show authentication error
     * @param {string} message - Error message
     */
    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Get current authenticated user
     * @returns {string|null} - User email or null
     */
    getCurrentUser() {
        return localStorage.getItem(this.storageKey);
    }

    /**
     * Get current session
     * @returns {object|null} - Session object or null
     */
    getSession() {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated
     */
    isAuthenticated() {
        const email = this.getCurrentUser();
        return email && emailValidator.validateEmail(email);
    }

    /**
     * Logout user
     */
    logout() {
        // Clear storage
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);

        // Clear any app data
        if (typeof clearAppData === 'function') {
            clearAppData();
        }

        // Show auth modal
        this.showAuthModal();

        // Clear form
        const emailInput = document.getElementById('emailInput');
        if (emailInput) {
            emailInput.value = '';
        }

        console.log('User logged out');
    }
}

// Create singleton instance
const auth = new Authentication();