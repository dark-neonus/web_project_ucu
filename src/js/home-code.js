document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    
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
    
    setupSearch();
    setupFeatureCards();
  });