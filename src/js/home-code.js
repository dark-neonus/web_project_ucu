
document.addEventListener('DOMContentLoaded', function() {
  // Get references to UI elements
  const loginButton = document.querySelector('.login-button');
  const registerButton = document.querySelector('.register-button');
  const searchInput = document.querySelector('.search-input');
  const featureButtons = document.querySelectorAll('.feature-button');

  // Handle search input - when user presses enter
  if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              const query = this.value.trim();
              if (query) {
                  // Redirect to forum page with search query
                  window.location.href = `forum-page.html?search=${encodeURIComponent(query)}`;
              }
          }
      });
  }

  // Enhance feature card interactions
  document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-10px)';
      });

      card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(-5px)';
      });
  });

  // Update the search functionality in code.js for the forum page
  function enhanceSearchFunctionality() {
      // Check if there's a search query in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search');

      if (searchQuery && postsContainer) {
          // Set the search input value
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
              searchInput.value = searchQuery;
          }

          // Filter posts based on search query
          const filteredPosts = posts.filter(post => 
              post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          posts = filteredPosts;

          // Show a heading with current search filter
          const searchHeading = document.createElement('div');
          searchHeading.className = 'search-filter-heading';
          searchHeading.innerHTML = `
              <h3>Search results for: ${searchQuery}</h3>
              <button class="clear-search-filter">Clear search</button>
          `;

          // Remove existing search heading if any
          const existingHeading = document.querySelector('.search-filter-heading');
          if (existingHeading) {
              existingHeading.remove();
          }

          // Insert heading before posts container
          postsContainer.parentNode.insertBefore(searchHeading, postsContainer);

          // Add event listener to clear search filter button
          document.querySelector('.clear-search-filter').addEventListener('click', function() {
              window.location.href = 'forum-page.html';
          });
      }
  }
});