document.addEventListener('DOMContentLoaded', function() {
  
  // Toast notification system
  const createToast = (message, type = 'error') => {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast container
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Set icon based on type
    let icon = '';
    if (type === 'success') {
      icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'info') {
      icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    // Create toast content
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Add toast to body
    document.body.insertBefore(toast, document.body.firstChild);
    
    // Add event listener to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-hidden');
      setTimeout(() => {
        toast.remove();
      }, 300);
    });
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);
    
    // Auto-dismiss after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        toast.classList.add('toast-hidden');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 5000);
    }
    
    return toast;
  };
  
  // Toggle password visibility
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.form-input');
      
      if (input.type === 'password') {
        input.type = 'text';
        this.querySelector('svg').innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
      } else {
        input.type = 'password';
        this.querySelector('svg').innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
      }
    });
  });
  
  // Add animation to form elements
  const formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach((input, index) => {
    input.style.opacity = '0';
    input.style.transform = 'translateY(10px)';
    input.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    setTimeout(() => {
      input.style.opacity = '1';
      input.style.transform = 'translateY(0)';
    }, 200 + (index * 100));
  });
  
  // Clear error styling when input changes
  formInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('form-input-error');
      const errorEl = this.parentElement.querySelector('.form-error');
      if (errorEl) {
        errorEl.remove();
      }
    });
  });
  
  // Password strength indicator
  const passwordInput = document.getElementById('password');
  
  if (passwordInput) {
    const passwordFeedback = document.createElement('div');
    passwordFeedback.classList.add('password-feedback');
    passwordFeedback.style.marginTop = '5px';
    passwordFeedback.style.fontSize = '0.8rem';
    
    // Insert feedback element after the password field's parent div
    passwordInput.closest('.form-group').insertAdjacentElement('afterend', passwordFeedback);
    
    passwordInput.addEventListener('input', function() {
      validatePassword(this.value);
    });
    
    // Updated password validation function to match settings page
    function validatePassword(password) {
      // Password requirements - updated to match settings page requirements
      const minLength = 8;
      const maxLength = 64;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecialChars = /[^A-Za-z0-9]/.test(password); // Optional check for special characters
      
      // Calculate strength
      let strength = 0;
      let feedback = [];
      
      // Check length
      if (password.length < minLength) {
        feedback.push(`Password must be at least ${minLength} characters`);
      } else if (password.length > maxLength) {
        feedback.push(`Password must be less than ${maxLength} characters`);
      } else {
        strength += 1;
      }
      
      // Check for diverse character types
      if (!hasUppercase) {
        feedback.push('Add uppercase letters');
        strength -= 0.5;
      } else {
        strength += 1;
      }
      
      if (!hasLowercase) {
        feedback.push('Add lowercase letters');
        strength -= 0.5;
      } else {
        strength += 1;
      }
      
      if (!hasNumbers) {
        feedback.push('Add numbers');
        strength -= 0.5;
      } else {
        strength += 1;
      }
      
      // Optional check for special characters (not required but increases strength)
      if (hasSpecialChars) {
        strength += 0.5;
      }
      
      // Check for common patterns
      if (/(.)\1{2,}/.test(password)) { // Repeated characters
        feedback.push('Avoid repeated characters');
        strength -= 1;
      }
      
      if (/^(password|123456|qwerty)/i.test(password)) { // Common passwords
        feedback.push('Avoid common passwords');
        strength -= 1;
      }
      
      // Update the password feedback element
      let strengthText = '';
      let strengthColor = '';
      
      if (strength <= 1) {
        strengthText = 'Weak';
        strengthColor = '#ff3860';
      } else if (strength <= 2) {
        strengthText = 'Moderate';
        strengthColor = '#ffdd57';
      } else {
        strengthText = 'Strong';
        strengthColor = '#23d160';
      }
      
      // Display feedback
      passwordFeedback.innerHTML = `
        <div style="margin-bottom: 5px;">
          <span style="color: ${strengthColor}; font-weight: 600;">${strengthText}</span>
          <div style="height: 5px; background-color: #e0e0e0; border-radius: 2px; margin-top: 4px;">
            <div style="height: 100%; width: ${(strength / 4) * 100}%; background-color: ${strengthColor}; border-radius: 2px; transition: width 0.3s;"></div>
          </div>
        </div>
        ${feedback.length > 0 ? `<ul style="margin: 0; padding-left: 20px; color: #666;">${feedback.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
      `;
      
      return {
        isValid: password.length >= minLength && password.length <= maxLength && 
                 hasUppercase && hasLowercase && hasNumbers,
        feedback: feedback
      };
    }
  }
  
  // Form validation
  const form = document.querySelector('form');
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent default form submission
      
      // Clear previous errors
      document.querySelectorAll('.form-error').forEach(el => el.remove());
      document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));

      // Validate all fields
      let isValid = true;
      const formData = {
        first_name: document.getElementById('first_name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      };
      
      // Get confirm password value
      const confirmPassword = document.getElementById('confirm_password').value;
      
      // First name validation - match settings page (2-50 chars)
      if (!formData.first_name) {
        const firstNameInput = document.getElementById('first_name');
        firstNameInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'First name is required';
        firstNameInput.parentElement.appendChild(errorEl);
        isValid = false;
      } else if (formData.first_name.length < 2 || formData.first_name.length > 50) {
        const firstNameInput = document.getElementById('first_name');
        firstNameInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'First name must be between 2 and 50 characters';
        firstNameInput.parentElement.appendChild(errorEl);
        isValid = false;
      }
      
      // Last name validation - match settings page (2-50 chars)
      if (!formData.last_name) {
        const lastNameInput = document.getElementById('last_name');
        lastNameInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Last name is required';
        lastNameInput.parentElement.appendChild(errorEl);
        isValid = false;
      } else if (formData.last_name.length < 2 || formData.last_name.length > 50) {
        const lastNameInput = document.getElementById('last_name');
        lastNameInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Last name must be between 2 and 50 characters';
        lastNameInput.parentElement.appendChild(errorEl);
        isValid = false;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        const emailInput = document.getElementById('email');
        emailInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Email is required';
        emailInput.parentElement.appendChild(errorEl);
        isValid = false;
      } else if (!emailRegex.test(formData.email)) {
        const emailInput = document.getElementById('email');
        emailInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Please enter a valid email address';
        emailInput.parentElement.appendChild(errorEl);
        isValid = false;
      }
      
      // Password validation - updated to match settings page
      if (passwordInput) {
        // Create a validate function that matches settings page requirements
        const validatePassword = function(password) {
          // Password requirements
          const minLength = 8;
          const maxLength = 64;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumbers = /[0-9]/.test(password);
          
          // Create feedback
          let feedback = [];
          
          // Check length
          if (password.length < minLength) {
            feedback.push(`Password must be at least ${minLength} characters`);
          } else if (password.length > maxLength) {
            feedback.push(`Password must be less than ${maxLength} characters`);
          }
          
          // Check for diverse character types
          if (!hasUppercase) {
            feedback.push('Add uppercase letters');
          }
          
          if (!hasLowercase) {
            feedback.push('Add lowercase letters');
          }
          
          if (!hasNumbers) {
            feedback.push('Add numbers');
          }
          
          return {
            isValid: password.length >= minLength && password.length <= maxLength && 
                     hasUppercase && hasLowercase && hasNumbers,
            feedback: feedback
          };
        };
        
        
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          const passwordInput = document.getElementById('password');
          passwordInput.classList.add('form-input-error');
          
          // Create error message for password requirements
          const errorEl = document.createElement('span');
          errorEl.className = 'form-error';
          errorEl.textContent = 'Password must be at least 8 characters and include uppercase, lowercase, and numbers';
          passwordInput.parentElement.appendChild(errorEl);
          
          isValid = false;
          
          // Show toast with password requirements
          createToast('Password does not meet requirements. Please check the guidelines below.', 'error');
        }
      }
      
      // Password confirmation validation
      if (formData.password !== confirmPassword) {
        const confirmPasswordInput = document.getElementById('confirm_password');
        confirmPasswordInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Passwords do not match';
        confirmPasswordInput.parentElement.appendChild(errorEl);
        isValid = false;
      }
      
      if (!isValid) {
        // Scroll to the first error
        const firstError = document.querySelector('.form-input-error');
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      // Send POST request to the backend
      try {
        console.log('Sending data to server...'); // Debugging
        
        // Show loading state on button
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke-dasharray="32" stroke-dashoffset="0"></circle>
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
          </svg>
          Processing...
        `;
        
        // Add spinner animation
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
        `;
        document.head.appendChild(spinnerStyle);
        
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        if (response.ok) {
          console.log('Registration successful!'); // Debugging
          
          // Show success message
          createToast('Registration successful! Redirecting to login...', 'success');
          
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          const errorData = await response.json();
          console.error('Server error:', errorData); // Debugging
          
          // Show error toast with server message
          createToast(`Registration failed: ${errorData.detail || 'An error occurred'}`, 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        createToast('Connection error. Please check your internet connection and try again.', 'error');
      }
    });
  }
});