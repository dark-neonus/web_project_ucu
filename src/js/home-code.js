document.addEventListener('DOMContentLoaded', function() {
    // Auth-related elements
    const loginButton = document.querySelector('.login-button');
    const registerButton = document.querySelector('.register-button');
    const logoutButton = document.querySelector('.logout-button');
    const searchInput = document.querySelector('.search-input');
    
    // Handle search functionality
    function setupSearch() {
      if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
              window.location.href = `/forum/?search=${encodeURIComponent(query)}`;
            }
          }
        });
      }
    }
    
    // Add hover effects to feature cards
    function setupFeatureCards() {
      document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(-5px)';
        });
      });
    }
    
    // Initialize all functionality
    setupSearch();
    setupFeatureCards();
  });