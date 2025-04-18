// This is the content for /src/js/registration-code.js
document.addEventListener('DOMContentLoaded', function() {
  
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
      console.log('Password input changed:', this.value); // Debugging
      validatePassword(this.value);
    });
    
    // Password validation function
    function validatePassword(password) {
      // Password requirements
      const minLength = 8;
      const maxLength = 64;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
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
      } else {
        strength += 1;
      }
      
      if (!hasLowercase) {
        feedback.push('Add lowercase letters');
      } else {
        strength += 1;
      }
      
      if (!hasNumbers) {
        feedback.push('Add numbers');
      } else {
        strength += 1;
      }
      
      if (!hasSpecialChars) {
        feedback.push('Add special characters');
      } else {
        strength += 1;
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
      } else if (strength <= 3) {
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
            <div style="height: 100%; width: ${strength * 20}%; background-color: ${strengthColor}; border-radius: 2px; transition: width 0.3s;"></div>
          </div>
        </div>
        ${feedback.length > 0 ? `<ul style="margin: 0; padding-left: 20px; color: #666;">${feedback.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
      `;
      
      return {
        isValid: password.length >= minLength && password.length <= maxLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars,
        feedback: feedback
      };
    }
  }
  
  // Form validation
  const form = document.querySelector('form');
  console.log('Form element:', form); // Debugging
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent default form submission
      console.log('Form submitted'); // Debugging

      // Collect form data
      const formData = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      };

      console.log('Form data collected:', { ...formData, password: '****' }); // Debugging (hide password)

      // Validate all fields
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
        alert('Please fill in all fields');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Password validation - only if the password field exists
      if (passwordInput) {
        const validatePassword = function(password) {
          // Password requirements
          const minLength = 8;
          const maxLength = 64;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumbers = /[0-9]/.test(password);
          const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
          
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
          
          if (!hasSpecialChars) {
            feedback.push('Add special characters');
          }
          
          return {
            isValid: password.length >= minLength && password.length <= maxLength && 
                     hasUppercase && hasLowercase && hasNumbers && hasSpecialChars,
            feedback: feedback
          };
        };
        
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          alert('Password does not meet requirements:\n' + passwordValidation.feedback.join('\n'));
          return;
        }
      }

      // Send POST request to the backend
      try {
        console.log('Sending data to server...'); // Debugging
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          console.log('Registration successful!'); // Debugging
          alert('Registration successful!');
          window.location.href = '/auth/login'; // Redirect to login page
        } else {
          const errorData = await response.json();
          console.error('Server error:', errorData); // Debugging
          alert(`Error: ${errorData.detail}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});