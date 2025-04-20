/**
 * Filter Tabs Module
 * Handles the setup and functionality of filter tabs for event listings
 */
import {formatEventDates} from './post-format-code.js';

/**
 * Sets up filter tabs functionality
 * @param {Object} options - Configuration options
 * @param {string} options.tabsSelector - CSS selector for filter tabs
 * @param {string} options.containerSelector - CSS selector for content container
 * @param {string} options.defaultFilter - Default filter to apply
 * @param {Function} options.fetchCallback - Function to call when filter changes
 * @param {Function} options.formatCallback - Optional function to run after content update
 * @param {Object} options.additionalParams - Optional additional parameters to pass to fetch callback
 */
export function setupFilterTabs({
    tabsSelector = '.filter-tab',
    containerSelector = '.posts-container',
    defaultFilter = 'new',
    fetchCallback,
    formatCallback = null,
    additionalParams = {}
  }) {
    const filterTabs = document.querySelectorAll(tabsSelector);
    const contentContainer = document.querySelector(containerSelector);
    
    // Track the active filter
    let activeFilter = defaultFilter;
    
    // Add click event listeners to all tabs
    filterTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        filterTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Get filter type from data attribute
        const filterType = this.dataset.filter;
        
        // Only fetch new data if the filter changed
        if (activeFilter !== filterType) {
          activeFilter = filterType;
          
          // Call the provided fetch callback with the new filter type
          if (typeof fetchCallback === 'function') {
            fetchCallback(filterType, contentContainer, additionalParams);
          }
        }
      });
    });
    
    // Initial load - find active tab or default to provided default
    const initialActiveTab = document.querySelector(`${tabsSelector}.active`);
    if (initialActiveTab) {
      fetchCallback(initialActiveTab.dataset.filter, contentContainer, additionalParams);
    } else {
      // If no active tab is found, set the first one as active
      const firstTab = document.querySelector(tabsSelector);
      if (firstTab) {
        firstTab.classList.add('active');
        fetchCallback(firstTab.dataset.filter, contentContainer, additionalParams);
      } else {
        fetchCallback(defaultFilter, contentContainer, additionalParams);
      }
    }
    
    return {
      getActiveFilter: () => activeFilter,
      setActiveFilter: (filterType) => {
        const targetTab = document.querySelector(`${tabsSelector}[data-filter="${filterType}"]`);
        if (targetTab) {
          targetTab.click();
        }
      },
      refresh: () => {
        fetchCallback(activeFilter, contentContainer, additionalParams);
      }
    };
  }
  
  /**
   * Creates a standard loading indicator
   * @param {string} message - Message to display
   * @returns {string} HTML for loading indicator
   */
  export function createLoadingIndicator(message = 'Loading...') {
    return `<div class="loading">${message}</div>`;
  }
  
  /**
   * Creates an error message display
   * @param {string} message - Error message to display
   * @returns {string} HTML for error state
   */
  export function createErrorState(message = 'Failed to load content. Please try again later.') {
    return `<div class="error-state">${message}</div>`;
  }
  
  /**
   * Creates an empty state display
   * @param {string} message - Message to display when no content
   * @returns {string} HTML for empty state
   */
  export function createEmptyState(message = 'No content available') {
    return `<div class="empty-state">${message}</div>`;
  }

/**
 * Fetches events based on the selected filter
 * @param {string} filterType - The type of filter (new, top, closed)
 * @param {HTMLElement} postsContainer - Container element for the posts
 * @param {Object} params - Additional parameters (e.g., user_id for user events)
 */
export function fetchFilteredEvents(filterType, postsContainer, params = {}) {
  // Show loading state
  postsContainer.innerHTML = createLoadingIndicator('Loading events...');
  
  // Check if we're on a user events page
  const isUserEvents = params.isUserEvents || false;
  const userId = params.userId || null;
  
  // Construct the API endpoint based on filter type and page context
  let endpoint = isUserEvents && userId ? `/events/user_events_api/${userId}` : '/events/api';
  
  // Ensure we're matching the API parameters defined in the backend
  switch(filterType) {
    case 'new':
      endpoint += isUserEvents ? '?sort=date_created&order=desc' : '?sort=date_created&order=desc';
      break;
    case 'top':
      endpoint += isUserEvents ? '?sort=votes&order=desc' : '?sort=votes&order=desc';
      break;
    case 'closed':
      endpoint += isUserEvents ? '?status=closed' : '?status=closed';
      break;
    default:
      endpoint += '?sort=date_created&order=desc';
  }
  
  // Fetch the filtered events
  fetch(endpoint, {
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.events) {
        updateEventsDisplay(data.events, postsContainer);
      } else {
        console.error('Invalid data format received:', data);
        postsContainer.innerHTML = createErrorState('Failed to parse events data. Please try again later.');
      }
    })
    .catch(error => {
      console.error('Error fetching filtered events:', error);
      postsContainer.innerHTML = createErrorState('Failed to load events. Please try again later.');
    });
}

/**
 * Updates the events display with the fetched data
 * @param {Array} events - The events to display
 * @param {HTMLElement} postsContainer - Container element for the posts
 */
export function updateEventsDisplay(events, postsContainer) {
  if (!events || events.length === 0) {
    postsContainer.innerHTML = createEmptyState('No events available');
    return;
  }
  
  // Build HTML for each event
  let eventsHTML = '';
  events.forEach(event => {
    // Format date if available
    const formattedDate = event.date_scheduled 
      ? new Date(event.date_scheduled).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';
    
    eventsHTML += `
      <div class="post" data-id="${event.id}">
        <div class="post-header">
          <div class="user-info">
            <div class="avatar">
              <img src="https://via.placeholder.com/40" alt="User avatar">
            </div>
            <div class="user-meta">
              <p class="username">${event.author_username || 'Unknown User'}</p>
              <p class="time">${new Date(event.date_created).toLocaleDateString()}</p>
            </div>
          </div>
          <button>
            <span class="icon icon-more"></span>
          </button>
        </div>
        ${event.image_path ? `<img src="/${event.image_path}" alt="Event image" class="post-image">` : ''}
        <h3 class="post-title">${event.title}</h3>
        ${event.description ? `<p class="post-excerpt">${event.description}</p>` : ''}
        
        <div class="event-details">
          ${formattedDate ? `<div class="event-date"><span class="icon icon-calendar"></span> ${formattedDate}</div>` : ''}
          ${event.location ? `<div class="event-location"><span class="icon icon-location"></span> ${event.location}</div>` : ''}
        </div>
        
        <div class="post-footer">
          <span class="post-tag">${event.category}</span>
          <div class="post-stats">
            <div class="stat">
              <span class="icon icon-eye"></span>
              <span>${event.views || 0}</span>
            </div>
            <div class="stat">
              <span class="icon icon-message"></span>
              <span>${event.comments || 0}</span>
            </div>
            <div class="stat vote-stat">
              <span class="icon icon-arrow-up"></span>
              <span>${event.votes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  // Update the container
  postsContainer.innerHTML = eventsHTML;
  
  // Re-apply event listeners to the new elements
  formatEventDates();
}