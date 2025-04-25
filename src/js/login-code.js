document.addEventListener('DOMContentLoaded', () => {
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
    
    // Ensure toast is the first child
    if (document.body.firstChild) {
      document.body.insertBefore(toast, document.body.firstChild);
    } else {
      document.body.appendChild(toast);
    }
    
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

  // Rest of the code remains the same
  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.form-input');
      const svg = this.querySelector('svg');
      
      if (input.type === 'password') {
        input.type = 'text';
        svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
      } else {
        input.type = 'password';
        svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  });
  
  // Add animation to form inputs
  document.querySelectorAll('.form-input').forEach((input, index) => {
    input.style.cssText = 'opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => input.style.cssText = 'opacity: 1; transform: translateY(0); transition: opacity 0.3s ease, transform 0.3s ease', 200 + (index * 100));
    
    // Clear error styling when input changes
    input.addEventListener('input', function() {
      this.classList.remove('form-input-error');
      const errorEl = this.parentElement.querySelector('.form-error');
      if (errorEl) {
        errorEl.remove();
      }
    });
  });
  
  // Form validation and submission
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous errors
      document.querySelectorAll('.form-error').forEach(el => el.remove());
      document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));

      // Validate fields
      let isValid = true;
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      // Email validation
      if (!email) {
        const emailInput = document.getElementById('email');
        emailInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Email is required';
        emailInput.parentElement.appendChild(errorEl);
        isValid = false;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          const emailInput = document.getElementById('email');
          emailInput.classList.add('form-input-error');
          const errorEl = document.createElement('span');
          errorEl.className = 'form-error';
          errorEl.textContent = 'Please enter a valid email address';
          emailInput.parentElement.appendChild(errorEl);
          isValid = false;
        }
      }
      
      // Password validation
      if (!password) {
        const passwordInput = document.getElementById('password');
        passwordInput.classList.add('form-input-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = 'Password is required';
        passwordInput.parentElement.appendChild(errorEl);
        isValid = false;
      }

      if (!isValid) {
        // Focus on the first error
        const firstError = document.querySelector('.form-input-error');
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      try {
        // Show loading state on button
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke-dasharray="32" stroke-dashoffset="0"></circle>
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
          </svg>
          Logging in...
        `;

        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        if (response.ok) {
          const data = await response.json();
          // Show success message
          createToast('Login successful! Redirecting...', 'success');
          
          // Store token and redirect
          localStorage.setItem('access_token', data.access_token);
          
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          const errorData = await response.json();
          createToast(`Login failed: ${errorData.detail || 'Invalid credentials'}`, 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        createToast('Connection error. Please check your internet connection and try again.', 'error');
      }
    });
  }
});