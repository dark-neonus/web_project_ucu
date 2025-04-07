document.addEventListener('DOMContentLoaded', function() {
  // Get references to key elements
  const postsContainer = document.querySelector('.posts-container');
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  // Current tag filter
  let currentTagFilter = null;
  
  // Function to load events including those from localStorage
  async function fetchEventsData() {
    try {
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
    if (!postsContainer) return;
    
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
        eventElement.dataset.id = event.id || `event-${Date.now()}`;
        
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
        if (e.target.closest('.post-tag') || 
            e.target.closest('button') ||
            e.target.closest('.post-stats')) {
          return;
        }
        
        // Store the event ID in localStorage
        const eventId = this.dataset.id;
        localStorage.setItem('currentEventId', eventId);
        
        // Navigate to the event details page
        window.location.href = `/events/view/${eventId}`;
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
  
  // Initial render
  if (postsContainer) {
    renderEvents();
  }
});