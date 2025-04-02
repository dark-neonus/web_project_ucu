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
    
    // Form validation
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form inputs
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!email || !password) {
          alert('Please fill in all fields');
          return;
        }
        
        if (!email.includes('@')) {
          alert('Please enter a valid email address');
          return;
        }
        
        // Additional validation for registration page
        const username = document.getElementById('username');
        if (username && !username.value) {
          alert('Please enter a username');
          return;
        }
        
        // Submit the form if validation passes
        console.log('Form submitted successfully');
        // form.submit();
      });
    }
    
    // Navigation links
    const loginLink = document.querySelector('.login-link');
    if (loginLink) {
      loginLink.addEventListener('click', function() {
        window.location.href = 'login-page.html';
      });
    }
    
    const signupLink = document.querySelector('.signup-link');
    if (signupLink) {
      signupLink.addEventListener('click', function() {
        window.location.href = 'registration-page.html';
      });
    }
  });