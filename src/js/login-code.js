document.addEventListener('DOMContentLoaded', () => {
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
  });
  
  // Form validation and submission
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('Please fill in all fields');
        return;
      }

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('access_token', data.access_token);
          window.location.href = '/';
        } else {
          alert(`Error: ${data.detail}`);
        }
      } catch (error) {
        alert('An error occurred. Please try again.');
      }
    });
  }
});