document.addEventListener('DOMContentLoaded', function() {
  // Get references to key elements
  const postsContainer = document.querySelector('.posts-container');
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  // Current tag filter
  let currentTagFilter = null;
  
  // Function to load questions including those from localStorage
  async function fetchForumData() {
    try {
      // Try to fetch from server first
      let serverData = { questions: [] };
      try {
        const response = await fetch('/src/json/data.json');
        if (response.ok) {
          serverData = await response.json();
        }
      } catch (error) {
        console.log('Could not fetch from server, using local data only');
      }
      
      // Get locally stored questions
      const localQuestions = JSON.parse(localStorage.getItem('forumQuestions')) || [];
      
      // Combine server and local data
      return {
        questions: [...localQuestions, ...serverData.questions]
      };
    } catch (error) {
      console.error('Error fetching forum data:', error);
      return { questions: [] };
    }
  }
  
  // Function to render posts based on filters
  async function renderPosts() {
    if (!postsContainer) return; // Exit if not on the forum page
    
    postsContainer.innerHTML = '<div class="loading-state">Loading...</div>';
    
    try {
      const forumData = await fetchForumData();
      postsContainer.innerHTML = '';
      
      // Get and filter data
      let posts = forumData.questions;
      
      // Apply tag filter if set
      if (currentTagFilter) {
        posts = posts.filter(post => post.tag === currentTagFilter);
      }
      
      // Apply sorting based on active filter tab
      const activeFilterTab = document.querySelector('.filter-tab.active');
      const filterType = activeFilterTab?.querySelector('span:last-child')?.textContent.toLowerCase() || 
                          activeFilterTab?.textContent.trim().toLowerCase();
                          
      if (filterType === 'top') {
        posts = posts.sort((a, b) => b.votes - a.votes);
      } else if (filterType === 'closed') {
        posts = posts.filter(post => post.closed);
      } else {
        // Default 'new' sorting
        posts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state">No questions available</div>';
        return;
      }
      
      // Create and append post elements
      posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        // Post content
        let postContent = `
          <div class="post-header">
            <div class="user-info">
              <div class="avatar">
                <img src="https://via.placeholder.com/40" alt="User avatar">
              </div>
              <div class="user-meta">
                <p class="username">${post.username}</p>
                <p class="time">${post.timeAgo}</p>
              </div>
            </div>
            <button>
              <span class="icon icon-more"></span>
            </button>
          </div>
          <h3 class="post-title">${post.title}</h3>
        `;
        
        if (post.content || post.excerpt) {
          postContent += `<p class="post-excerpt">${post.content || post.excerpt}</p>`;
        }
        
        postContent += `
          <div class="post-footer">
            <span class="post-tag" data-tag="${post.tag}">${post.tag}</span>
            <div class="post-stats">
              <div class="stat">
                <span class="icon icon-eye"></span>
                <span>${post.views}</span>
              </div>
              <div class="stat">
                <span class="icon icon-message"></span>
                <span>${post.comments}</span>
              </div>
              <div class="stat">
                <span class="icon icon-arrow-up"></span>
                <span>${post.votes}</span>
              </div>
            </div>
          </div>
        `;
        
        postElement.innerHTML = postContent;
        postsContainer.appendChild(postElement);
      });
      
      // Add event listeners to tag elements
      document.querySelectorAll('.post-tag').forEach(tagElement => {
        tagElement.addEventListener('click', function() {
          const tag = this.getAttribute('data-tag');
          filterPostsByTag(tag);
        });
      });
      
      makePostsClickable();
    } catch (error) {
      console.error('Error rendering posts:', error);
      postsContainer.innerHTML = '<div class="error-state">Failed to load questions</div>';
    }
  }

  // Simplified function to make posts clickable to view details
  function makePostsClickable() {
    const posts = document.querySelectorAll('.post');
    
    posts.forEach(post => {
      post.addEventListener('click', function(e) {
        // Don't navigate if clicking on tag, buttons, or stats
        if (e.target.closest('.post-tag') || 
            e.target.closest('button') ||
            e.target.closest('.post-stats')) {
          return;
        }
        
        // Get minimal required post data for navigation
        const postData = {
          title: post.querySelector('.post-title').textContent,
          content: post.querySelector('.post-excerpt')?.textContent || '',
          username: post.querySelector('.username').textContent,
          tag: post.querySelector('.post-tag').textContent
        };
        
        // Store minimal post data in localStorage
        localStorage.setItem('currentPost', JSON.stringify(postData));
        
        // Navigate to post details page (you would add the actual navigation here)
        // window.location.href = `/forum/post/${encodeURIComponent(postData.title)}`;
      });
    });
  }
  
  // Function to filter posts by tag
  function filterPostsByTag(tag) {
    if (!postsContainer) return; // Exit if not on the forum page
    
    currentTagFilter = tag;
    
    // Show a heading with current tag filter
    const tagHeading = document.createElement('div');
    tagHeading.className = 'tag-filter-heading';
    tagHeading.innerHTML = `
      <h3>Questions tagged: ${tag}</h3>
      <button class="clear-tag-filter">Clear filter</button>
    `;
    
    // Remove existing tag heading if any
    const existingHeading = document.querySelector('.tag-filter-heading');
    if (existingHeading) {
      existingHeading.remove();
    }
    
    // Insert heading before posts container
    postsContainer.parentNode.insertBefore(tagHeading, postsContainer);
    
    // Add event listener to clear tag filter button
    document.querySelector('.clear-tag-filter').addEventListener('click', function() {
      currentTagFilter = null;
      tagHeading.remove();
      renderPosts();
    });
    
    // Render filtered posts
    renderPosts();
  }
  
  // Handle filter tab clicks
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        renderPosts(); // Re-render with new filter
      });
    });
  }
  
  // Initial render
  if (postsContainer) {
    renderPosts();
  }
});