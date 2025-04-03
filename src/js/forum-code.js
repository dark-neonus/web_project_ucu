document.addEventListener('DOMContentLoaded', function() {
  // Get references to key elements
  const postsContainer = document.querySelector('.posts-container');
  const navButtons = document.querySelectorAll('.nav-links button');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const askButton = document.querySelector('.ask-button');
  const menuItems = document.querySelectorAll('.menu-item');
  
  // Current active content type and tag filter
  let activeContentType = postsContainer ? 
    (postsContainer.getAttribute('data-content-type') || 'questions') : 
    'questions';
  let currentTagFilter = null;
  
  // Determine current page based on URL path
  const currentPath = window.location.pathname;
  const currentPage = currentPath.includes('new-post-page.html') ? 'new-question' : 
                     (currentPath.includes('forum-page.html') ? 'forum' : 'other');
  
  // Connect "Ask a question" or "Create an event" button to the appropriate form page
  if (askButton) {
    askButton.addEventListener('click', function() {
      // Determine which content type is active
      const contentType = activeContentType || 'questions';
      window.location.href = '/src/pages/new-post-page.html?type=' + contentType;
    });
  }
  
  // Update ask button text based on content type
  function updateAskButtonText(contentType) {
    if (askButton) {
      const askButtonText = askButton.querySelector('span:last-child');
      if (askButtonText) {
        askButtonText.textContent = contentType === 'events' ? 'Create an event' : 'Ask a question';
      }
    }
  }
  
  // Update menu items based on content type
  function updateMenuItems(contentType) {
    menuItems.forEach(item => {
      const itemText = item.querySelector('span:last-child').textContent.trim();
      item.classList.remove('active');
      
      if ((contentType === 'questions' && itemText === 'Questions') ||
          (contentType === 'events' && itemText === 'Events')) {
        item.classList.add('active');
      }
    });
  }
  
  // Function to load questions including those from localStorage
  async function fetchForumData() {
    try {
      // Try to fetch from server first
      let serverData = { questions: [], events: [] };
      try {
        const response = await fetch('/src/json/data.json');
        if (response.ok) {
          serverData = await response.json();
        }
      } catch (error) {
        console.log('Could not fetch from server, using local data only');
      }
      
      // Get locally stored questions and events
      const localQuestions = JSON.parse(localStorage.getItem('forumQuestions')) || [];
      const localEvents = JSON.parse(localStorage.getItem('forumEvents')) || [];
      
      // Combine server and local data
      return {
        questions: [...localQuestions, ...serverData.questions],
        events: [...localEvents, ...serverData.events]
      };
    } catch (error) {
      console.error('Error fetching forum data:', error);
      return { questions: [], events: [] };
    }
  }
  
  // Function to render posts based on content type and filters
  async function renderPosts(contentType) {
    if (!postsContainer) return; // Exit if not on the forum page
    
    postsContainer.innerHTML = '<div class="loading-state">Loading...</div>';
    
    try {
      const forumData = await fetchForumData();
      postsContainer.innerHTML = '';
      
      // Get and filter data
      let posts = forumData[contentType];
      
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
        postsContainer.innerHTML = '<div class="empty-state">No posts available</div>';
        return;
      }
      
      // Create and append post elements
      posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        // Common post content
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
        
        if (contentType === 'events' && (post.date || post.location)) {
          postContent += `<div class="event-details">`;
          if (post.date) {
            postContent += `<div class="event-date"><span class="icon icon-calendar"></span> ${post.date}</div>`;
          }
          if (post.location) {
            postContent += `<div class="event-location"><span class="icon icon-location"></span> ${post.location}</div>`;
          }
          postContent += `</div>`;
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
      postsContainer.innerHTML = '<div class="error-state">Failed to load content</div>';
    }
  }

  // Update the makePostsClickable function to handle both questions and events
  function makePostsClickable() {
    const posts = document.querySelectorAll('.post');
    const contentType = document.querySelector('.posts-container').getAttribute('data-content-type');
    
    posts.forEach(post => {
      // Make the whole post clickable except for specific elements
      post.addEventListener('click', function(e) {
        // Don't navigate if clicking on tag, buttons, or stats
        if (e.target.closest('.post-tag') || 
            e.target.closest('button') ||
            e.target.closest('.post-stats')) {
          return;
        }
        
        // Get common post data
        const title = post.querySelector('.post-title').textContent;
        const content = post.querySelector('.post-excerpt')?.textContent || '';
        const username = post.querySelector('.username').textContent;
        const timeAgo = post.querySelector('.time').textContent;
        const tag = post.querySelector('.post-tag').textContent;
        const votes = post.querySelector('.post-stats .icon-arrow-up + span').textContent;
        const views = post.querySelector('.post-stats .icon-eye + span').textContent;
        const comments = post.querySelector('.post-stats .icon-message + span').textContent;
        
        // Create base post data object
        const postData = {
          type: contentType, // Store whether this is a question or event
          title,
          content,
          username,
          timeAgo,
          tag,
          votes,
          views,
          comments
        };
        
        // Add event-specific data if this is an event
        if (contentType === 'events') {
          const eventDate = post.querySelector('.event-date')?.textContent || '';
          const eventLocation = post.querySelector('.event-location')?.textContent || '';
          
          postData.date = eventDate;
          postData.location = eventLocation;
        }
        
        // Store post data in localStorage
        localStorage.setItem('currentPost', JSON.stringify(postData));
        
        // Navigate to the appropriate view page
        window.location.href = `/src/pages/post-view-page.html?type=${contentType}` // Using the same view page for both types
      });
    });
  }
  
  // Function to filter posts by tag
  function filterPostsByTag(tag) {
    if (!postsContainer) return; // Exit if not on the forum page
    
    currentTagFilter = tag;
    
    // Highlight Tags menu item when a tag is selected
    menuItems.forEach(item => {
      if (item.querySelector('span:last-child').textContent === 'Tags') {
        menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');
      }
    });
    
    // Show a heading with current tag filter
    const tagHeading = document.createElement('div');
    tagHeading.className = 'tag-filter-heading';
    tagHeading.innerHTML = `
      <h3>Posts tagged: ${tag}</h3>
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
      renderPosts(activeContentType);
    });
    
    // Render filtered posts
    renderPosts(activeContentType);
  }
  
  // Toggle between different content types
  function toggleContentType(contentType) {
    if (contentType === activeContentType) return;
    
    activeContentType = contentType;
    
    // Update data attribute on posts container
    if (postsContainer) {
      postsContainer.setAttribute('data-content-type', contentType);
    }
    
    // Update nav buttons in header
    updateNavButtons(contentType);
    
    // Update menu items in left sidebar
    updateMenuItems(contentType);
    
    // Update Ask button text
    updateAskButtonText(contentType);
    
    // Reset filter tabs to "New"
    if (filterTabs.length > 0) {
      filterTabs.forEach(tab => {
        tab.classList.remove('active');
        const tabText = tab.querySelector('span:last-child')?.textContent || tab.textContent.trim();
        if (tabText === 'New') {
          tab.classList.add('active');
        }
      });
    }
    
    // Clear any active tag filter
    currentTagFilter = null;
    const tagHeading = document.querySelector('.tag-filter-heading');
    if (tagHeading) {
      tagHeading.remove();
    }
    
    // Render posts if on forum page
    if (postsContainer) {
      renderPosts(contentType);
    }
  }
  
  // Update nav buttons based on content type
  function updateNavButtons(contentType) {
    navButtons.forEach(button => {
      const buttonText = button.textContent.trim();
      button.classList.remove('active');
      
      if ((contentType === 'questions' && buttonText === 'Forum') ||
          (contentType === 'events' && buttonText === 'Events')) {
        button.classList.add('active');
      }
    });
  }
  
  // Fix for header navigation buttons
  function setupHeaderNavigation() {
    // Select all header navigation buttons
    const headerNavButtons = document.querySelectorAll('.nav-links button');
    
    headerNavButtons.forEach(button => {
      button.addEventListener('click', function() {
        const buttonText = this.textContent.trim();
        
        // Remove the active class from all buttons
        headerNavButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to the clicked button
        this.classList.add('active');
        
        // Handle navigation based on button text
        if (buttonText === 'Forum') {
          // If we're not already on the forum page, navigate there
          if (!window.location.href.includes('forum-page.html') || 
              window.location.href.includes('content=events')) {
            window.location.href = '/src/pages/forum-page.html?content=questions';
          } else {
            // Otherwise just update the content type
            toggleContentType('questions');
          }
        } else if (buttonText === 'Events') {
          // If we're not already on the events page, navigate there
          if (!window.location.href.includes('forum-page.html') || 
              !window.location.href.includes('content=events')) {
            window.location.href = '/src/pages/forum-page.html?content=events';
          } else {
            // Otherwise just update the content type
            toggleContentType('events');
          }
        }
      });
    });
    
    // Set the initial active state based on the current URL
    const currentUrl = window.location.href;
    headerNavButtons.forEach(button => {
      const buttonText = button.textContent.trim();
      
      if ((buttonText === 'Forum' && 
           (currentUrl.includes('forum-page.html') && !currentUrl.includes('content=events'))) ||
          (buttonText === 'Events' && currentUrl.includes('content=events'))) {
        button.classList.add('active');
      }
    });
  }
  
  // Handle menu item clicks
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const itemText = this.querySelector('span:last-child').textContent.trim();
      
      // Handle "Questions" and "Events" menu items
      if (itemText === 'Questions') {
        if (currentPage === 'new-question') {
          window.location.href = '/src/pages/forum-page.html';
        } else {
          toggleContentType('questions');
        }
      } else if (itemText === 'Events') {
        if (currentPage === 'new-question') {
          window.location.href = '/src/pages/forum-page.html?content=events';
        } else {
          toggleContentType('events');
        }
      } else if (itemText === 'Tags') {
        // Handle Tags menu item - show all tags or reset filter
        currentTagFilter = null;
        const tagHeading = document.querySelector('.tag-filter-heading');
        if (tagHeading) {
          tagHeading.remove();
        }
        if (postsContainer) {
          renderPosts(activeContentType);
        }
      } else if (itemText === 'Your questions' || itemText === 'Your answers') {
        // These would typically filter based on user login
        alert('This feature requires you to be logged in.');
      }
      
      // Update active state for menu items
      menuItems.forEach(mi => mi.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Handle filter tab clicks
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        renderPosts(activeContentType); // Re-render with new filter
      });
    });
  }
  
  // Handle URL parameters on page load
  function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle content type parameter for forum page
    if (currentPage === 'forum') {
      const contentParam = urlParams.get('content');
      if (contentParam === 'events') {
        toggleContentType('events');
      } else {
        toggleContentType('questions');
      }
    }
  }
  
  // Initial setup based on current page
  handleURLParameters();
  
  // Set up header navigation
  setupHeaderNavigation();
  
  // Initial render if on forum page
  if (postsContainer) {
    renderPosts(activeContentType);
  }
  
  // NEW CODE: Add event listener for direct click on forum button in header
  const forumButton = document.querySelector('.nav-links button:first-child');
  if (forumButton) {
    forumButton.addEventListener('click', function() {
      // Update menu items to make Questions active in the sidebar
      if (menuItems) {
        menuItems.forEach(item => {
          const itemText = item.querySelector('span:last-child').textContent.trim();
          item.classList.remove('active');
          
          if (itemText === 'Questions') {
            item.classList.add('active');
          }
        });
      }
    });
  }
  
  // NEW CODE: Ensure sidebar menu items are properly set on initial page load
  const urlParams = new URLSearchParams(window.location.search);
  const contentParam = urlParams.get('content');
  if (contentParam === 'events') {
    updateMenuItems('events');
  } else {
    updateMenuItems('questions');
  }
});