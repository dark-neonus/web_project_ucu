document.addEventListener('DOMContentLoaded', function() {
    // Get references to key elements
    const postsContainer = document.querySelector('.posts-container');
    const navButtons = document.querySelectorAll('.nav-links button');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const askButton = document.querySelector('.ask-button');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Current tag filter
    let currentTagFilter = null;
    
    // Connect "Create an event" button to the form page
    if (askButton) {
      askButton.addEventListener('click', function() {
        window.location.href = '/src/pages/new-post-page.html?type=events';
      });
    }
    
    // Set up menu item active states
    function updateMenuItems() {
      menuItems.forEach(item => {
        const itemText = item.querySelector('span:last-child').textContent.trim();
        if (itemText === 'Events') {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    // Function to load events including those from localStorage
    async function fetchEventsData() {
      try {
        // Try to fetch from server first
        let serverData = { events: [] };
        try {
          const response = await fetch('/src/json/data.json');
          if (response.ok) {
            serverData = await response.json();
          }
        } catch (error) {
          console.log('Could not fetch from server, using local data only');
        }
        
        // Get locally stored events
        const localEvents = JSON.parse(localStorage.getItem('forumEvents')) || [];
        
        // Combine server and local data
        return {
          events: [...localEvents, ...serverData.events]
        };
      } catch (error) {
        console.error('Error fetching events data:', error);
        return { events: [] };
      }
    }
    
    // Function to render posts based on filters
    async function renderEvents() {
      if (!postsContainer) return; // Exit if not on the events page
      
      postsContainer.innerHTML = '<div class="loading-state">Loading...</div>';
      
      try {
        const eventsData = await fetchEventsData();
        postsContainer.innerHTML = '';
        
        // Get and filter data
        let events = eventsData.events;
        
        // Apply tag filter if set
        if (currentTagFilter) {
          events = events.filter(event => event.tag === currentTagFilter);
        }
        
        // Apply sorting based on active filter tab
        const activeFilterTab = document.querySelector('.filter-tab.active');
        const filterType = activeFilterTab?.querySelector('span:last-child')?.textContent.toLowerCase() || 
                            activeFilterTab?.textContent.trim().toLowerCase();
                            
        if (filterType === 'top') {
          events = events.sort((a, b) => b.votes - a.votes);
        } else if (filterType === 'closed') {
          events = events.filter(event => event.closed);
        } else {
          // Default 'new' sorting
          events = events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        if (!events || events.length === 0) {
          postsContainer.innerHTML = '<div class="empty-state">No events available</div>';
          return;
        }
        
        // Create and append event elements
        events.forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'post';
          
          // Event content
          let eventContent = `
            <div class="post-header">
              <div class="user-info">
                <div class="avatar">
                  <img src="https://via.placeholder.com/40" alt="User avatar">
                </div>
                <div class="user-meta">
                  <p class="username">${event.username}</p>
                  <p class="time">${event.timeAgo}</p>
                </div>
              </div>
              <button>
                <span class="icon icon-more"></span>
              </button>
            </div>
            <h3 class="post-title">${event.title}</h3>
          `;
          
          if (event.content || event.excerpt) {
            eventContent += `<p class="post-excerpt">${event.content || event.excerpt}</p>`;
          }
          
          // Event date and location
          if (event.date || event.location) {
            eventContent += `<div class="event-details">`;
            if (event.date) {
              eventContent += `<div class="event-date"><span class="icon icon-calendar"></span> ${event.date}</div>`;
            }
            if (event.location) {
              eventContent += `<div class="event-location"><span class="icon icon-location"></span> ${event.location}</div>`;
            }
            eventContent += `</div>`;
          }
          
          eventContent += `
            <div class="post-footer">
              <span class="post-tag" data-tag="${event.tag}">${event.tag}</span>
              <div class="post-stats">
                <div class="stat">
                  <span class="icon icon-eye"></span>
                  <span>${event.views}</span>
                </div>
                <div class="stat">
                  <span class="icon icon-message"></span>
                  <span>${event.comments}</span>
                </div>
                <div class="stat">
                  <span class="icon icon-arrow-up"></span>
                  <span>${event.votes}</span>
                </div>
              </div>
            </div>
          `;
          
          eventElement.innerHTML = eventContent;
          postsContainer.appendChild(eventElement);
        });
        
        // Add event listeners to tag elements
        document.querySelectorAll('.post-tag').forEach(tagElement => {
          tagElement.addEventListener('click', function() {
            const tag = this.getAttribute('data-tag');
            filterEventsByTag(tag);
          });
        });
        
        makeEventsClickable();
      } catch (error) {
        console.error('Error rendering events:', error);
        postsContainer.innerHTML = '<div class="error-state">Failed to load events</div>';
      }
    }
  
    // Make events clickable to view details
    function makeEventsClickable() {
      const events = document.querySelectorAll('.post');
      
      events.forEach(event => {
        // Make the whole event clickable except for specific elements
        event.addEventListener('click', function(e) {
          // Don't navigate if clicking on tag, buttons, or stats
          if (e.target.closest('.post-tag') || 
              e.target.closest('button') ||
              e.target.closest('.post-stats')) {
            return;
          }
          
          // Get event data
          const title = event.querySelector('.post-title').textContent;
          const content = event.querySelector('.post-excerpt')?.textContent || '';
          const username = event.querySelector('.username').textContent;
          const timeAgo = event.querySelector('.time').textContent;
          const tag = event.querySelector('.post-tag').textContent;
          const votes = event.querySelector('.post-stats .icon-arrow-up + span').textContent;
          const views = event.querySelector('.post-stats .icon-eye + span').textContent;
          const comments = event.querySelector('.post-stats .icon-message + span').textContent;
          
          // Create event data object
          const eventData = {
            type: 'events',
            title,
            content,
            username,
            timeAgo,
            tag,
            votes,
            views,
            comments
          };
          
          // Add event-specific data
          const eventDate = event.querySelector('.event-date')?.textContent || '';
          const eventLocation = event.querySelector('.event-location')?.textContent || '';
          
          eventData.date = eventDate;
          eventData.location = eventLocation;
          
          // Store event data in localStorage
          localStorage.setItem('currentPost', JSON.stringify(eventData));
          
          // Navigate to view page
          window.location.href = `/src/pages/post-view-page.html?type=events`;
        });
      });
    }
    
    // Function to filter events by tag
    function filterEventsByTag(tag) {
      if (!postsContainer) return; // Exit if not on the events page
      
      currentTagFilter = tag;
      
      // Show a heading with current tag filter
      const tagHeading = document.createElement('div');
      tagHeading.className = 'tag-filter-heading';
      tagHeading.innerHTML = `
        <h3>Events tagged: ${tag}</h3>
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
        renderEvents();
      });
      
      // Render filtered events
      renderEvents();
    }
    
    // Handle menu item clicks
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        const itemText = this.querySelector('span:last-child').textContent.trim();
        
        if (itemText === 'Questions') {
          // Navigate to forum page
          window.location.href = '/src/pages/forum-page.html';
        } else if (itemText === 'Events') {
          // Already on events page, just refresh
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
          
          renderEvents(); // Re-render with new filter
        });
      });
    }
    
    // Set up header navigation
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
            // Navigate to forum page
            window.location.href = '/src/pages/forum-page.html';
          } else if (buttonText === 'Events') {
            // Already on events page, no action needed
          }
        });
      });
      
      // Set the initial active state
      headerNavButtons.forEach(button => {
        const buttonText = button.textContent.trim();
        if (buttonText === 'Events') {
            button.classList.add('active');
          }
        });
      }
      
      // Initial setup
      updateMenuItems();
      setupHeaderNavigation();
      
      // Initial render
      if (postsContainer) {
        renderEvents();
      }
});