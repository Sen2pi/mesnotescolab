document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const loginBtn = document.querySelector('.login-btn');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Form submission handling
    loginForm.addEventListener('submit', function(e) {
        // Add loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        // Remove any previous error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    });

    // Input validation and styling
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            validateInput(this);
        });

        input.addEventListener('input', function() {
            clearInputError(this);
        });
    });

    // Input validation function
    function validateInput(input) {
        const value = input.value.trim();
        
        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                showInputError(input, 'Veuillez entrer une adresse email valide');
                return false;
            }
        }
        
        if (input.type === 'password') {
            if (value && value.length < 6) {
                showInputError(input, 'Le mot de passe doit contenir au moins 6 caractères');
                return false;
            }
        }
        
        return true;
    }

    // Show input error
    function showInputError(input, message) {
        clearInputError(input);
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'input-error';
        errorDiv.textContent = message;
        
        input.parentElement.appendChild(errorDiv);
    }

    // Clear input error
    function clearInputError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement.querySelector('.input-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Form validation before submission
    loginForm.addEventListener('submit', function(e) {
        const isEmailValid = validateInput(emailInput);
        const isPasswordValid = validateInput(passwordInput);
        
        if (!isEmailValid || !isPasswordValid) {
            e.preventDefault();
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            return false;
        }
    });

    // Auto-hide messages after 5 seconds
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit form
        if (e.key === 'Enter' && (emailInput.matches(':focus') || passwordInput.matches(':focus'))) {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Focus management
    if (emailInput.value === '') {
        emailInput.focus();
    } else if (passwordInput.value === '') {
        passwordInput.focus();
    }
});

// Additional CSS for input errors
const style = document.createElement('style');
style.textContent = `
    .form-input.error {
        border-color: #dc2626;
        background-color: #fef2f2;
    }
    
    .input-error {
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        padding-left: 4px;
    }
    
    .form-group.focused label {
        color: #667eea;
    }
`;
document.head.appendChild(style);