/**
 * Enhanced Event Filtering Module
 * Handles filter tabs, category dropdown, and search functionality for event listings
 */
import {formatEventDates} from './post-format-code.js';

// Keep track of current filters
let currentFilters = {
  tab: 'new',
  category: null,
  searchTerm: '' // Add search term to current filters
};

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
  
  // Initialize the active filter
  currentFilters.tab = defaultFilter;
  
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
      if (currentFilters.tab !== filterType) {
        currentFilters.tab = filterType;
        
        // Call the provided fetch callback with the new filter type and current category
        if (typeof fetchCallback === 'function') {
          const params = { 
            ...additionalParams, 
            category: currentFilters.category,
            searchTerm: currentFilters.searchTerm // Include search term in params
          };
          fetchCallback(filterType, contentContainer, params);
        }
      }
    });
  });
  
  // Initial load - find active tab or default to provided default
  const initialActiveTab = document.querySelector(`${tabsSelector}.active`);
  if (initialActiveTab) {
    currentFilters.tab = initialActiveTab.dataset.filter;
    fetchCallback(currentFilters.tab, contentContainer, { 
      ...additionalParams, 
      category: currentFilters.category,
      searchTerm: currentFilters.searchTerm // Include search term in initial load
    });
  } else {
    // If no active tab is found, set the first one as active
    const firstTab = document.querySelector(tabsSelector);
    if (firstTab) {
      firstTab.classList.add('active');
      currentFilters.tab = firstTab.dataset.filter;
      fetchCallback(currentFilters.tab, contentContainer, { 
        ...additionalParams, 
        category: currentFilters.category,
        searchTerm: currentFilters.searchTerm // Include search term in initial load
      });
    } else {
      fetchCallback(defaultFilter, contentContainer, { 
        ...additionalParams, 
        category: currentFilters.category,
        searchTerm: currentFilters.searchTerm // Include search term in initial load
      });
    }
  }
  
  return {
    getActiveFilter: () => currentFilters.tab,
    setActiveFilter: (filterType) => {
      const targetTab = document.querySelector(`${tabsSelector}[data-filter="${filterType}"]`);
      if (targetTab) {
        targetTab.click();
      }
    },
    refresh: () => {
      fetchCallback(currentFilters.tab, contentContainer, { 
        ...additionalParams, 
        category: currentFilters.category,
        searchTerm: currentFilters.searchTerm // Include search term when refreshing
      });
    }
  };
}

/**
 * Sets up category filter dropdown
 * @param {Object} options - Configuration options
 * @param {string} options.dropdownSelector - CSS selector for category dropdown
 * @param {string} options.containerSelector - CSS selector for content container
 * @param {Function} options.fetchCallback - Function to call when filter changes
 * @param {Object} options.additionalParams - Optional additional parameters to pass to fetch callback
 */
export function setupCategoryFilter({
  dropdownSelector = '#category-filter',
  containerSelector = '.posts-container',
  fetchCallback,
  additionalParams = {}
}) {
  const categoryDropdown = document.querySelector(dropdownSelector);
  const contentContainer = document.querySelector(containerSelector);
  
  if (!categoryDropdown) {
    console.warn('Category dropdown not found:', dropdownSelector);
    return null;
  }
  
  // Fetch available categories from the API
  fetchEventCategories(categoryDropdown);
  
  // Add change event listener to dropdown
  categoryDropdown.addEventListener('change', function() {
    const selectedCategory = this.value === 'all' ? null : this.value;
    currentFilters.category = selectedCategory;
    
    // Call the provided fetch callback with the current filter type and new category
    if (typeof fetchCallback === 'function') {
      fetchCallback(currentFilters.tab, contentContainer, { 
        ...additionalParams, 
        category: selectedCategory,
        searchTerm: currentFilters.searchTerm // Include search term when category changes
      });
    }
  });
  
  return {
    getSelectedCategory: () => currentFilters.category,
    setSelectedCategory: (category) => {
      categoryDropdown.value = category || 'all';
      categoryDropdown.dispatchEvent(new Event('change'));
    },
    refresh: () => {
      fetchEventCategories(categoryDropdown);
    }
  };
}

/**
 * Sets up search input functionality for events
 * @param {Object} options - Configuration options
 * @param {string} options.searchInputSelector - CSS selector for search input
 * @param {string} options.searchButtonSelector - CSS selector for search button
 * @param {string} options.containerSelector - CSS selector for content container
 * @param {Function} options.fetchCallback - Function to call when search changes
 * @param {Object} options.additionalParams - Optional additional parameters to pass to fetch callback
 */
export function setupSearchInput({
  searchInputSelector = '#search-input',
  searchButtonSelector = '#search-button',
  containerSelector = '.posts-container',
  fetchCallback,
  additionalParams = {}
}) {
  const searchInput = document.querySelector(searchInputSelector);
  const searchButton = document.querySelector(searchButtonSelector);
  const contentContainer = document.querySelector(containerSelector);
  
  if (!searchInput) {
    console.warn('Search input not found:', searchInputSelector);
    return null;
  }
  
  // Function to perform search
  const performSearch = () => {
    const searchTerm = searchInput.value.trim();
    currentFilters.searchTerm = searchTerm;
    
    // Call the provided fetch callback with the current filters
    if (typeof fetchCallback === 'function') {
      const params = { 
        ...additionalParams, 
        category: currentFilters.category,
        searchTerm: searchTerm
      };
      fetchCallback(currentFilters.tab, contentContainer, params);
    }
  };
  
  // Add event listener for search button click
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  // Add event listener for Enter key press
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Add event listener for input clearing (x button)
  searchInput.addEventListener('search', function() {
    // This event triggers when the clear button is clicked in supported browsers
    performSearch();
  });
  
  return {
    getSearchTerm: () => currentFilters.searchTerm,
    setSearchTerm: (term) => {
      searchInput.value = term || '';
      currentFilters.searchTerm = term || '';
      performSearch();
    },
    clearSearch: () => {
      searchInput.value = '';
      currentFilters.searchTerm = '';
      performSearch();
    }
  };
}

/**
 * Fetches available event categories from the API and populates the dropdown
 * @param {HTMLElement} dropdownElement - The dropdown element to populate
 */
function fetchEventCategories(dropdownElement) {
  fetch('/events/categories', {
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
    .then(categories => {
      // Store current selection
      const currentSelection = dropdownElement.value;
      
      // Clear existing options (except the first "All" option)
      while (dropdownElement.options.length > 1) {
        dropdownElement.remove(1);
      }
      
      // Add each category as an option
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dropdownElement.appendChild(option);
      });
      
      // Restore previous selection if it exists
      if (currentSelection && dropdownElement.querySelector(`option[value="${currentSelection}"]`)) {
        dropdownElement.value = currentSelection;
      }
    })
    .catch(error => {
      console.error('Error fetching event categories:', error);
    });
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
 * Fetches events based on the selected filter, category, and search term
 * @param {string} filterType - The type of filter (new, top, closed)
 * @param {HTMLElement} postsContainer - Container element for the posts
 * @param {Object} params - Additional parameters (e.g., user_id, category, searchTerm)
 */
export function fetchFilteredEvents(filterType, postsContainer, params = {}) {
  // Show loading state
  postsContainer.innerHTML = createLoadingIndicator(params.searchTerm ? 'Searching events...' : 'Loading events...');
  
  // Check if we're on a user events page
  const isUserEvents = params.isUserEvents || false;
  const userId = params.userId || null;
  const category = params.category || null;
  const searchTerm = params.searchTerm || null;
  
  // Construct the API endpoint based on filter type and page context
  let endpoint = isUserEvents && userId ? `/events/user_events_api/${userId}` : '/events/api';
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add sort parameters based on filter type
  switch(filterType) {
    case 'new':
      queryParams.append('sort', 'date_created');
      queryParams.append('order', 'desc');
      break;
    case 'top':
      queryParams.append('sort', 'votes');
      queryParams.append('order', 'desc');
      break;
    case 'closed':
      queryParams.append('status', 'closed');
      break;
    default:
      queryParams.append('sort', 'date_created');
      queryParams.append('order', 'desc');
  }
  
  // Add category filter if specified
  if (category) {
    queryParams.append('category', category);
  }
  
  // Add search term if specified
  if (searchTerm) {
    queryParams.append('search', searchTerm);
  }
  
  // Append query parameters to endpoint
  endpoint += `?${queryParams.toString()}`;
  
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
        updateEventsDisplay(data.events, postsContainer, searchTerm);
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
 * @param {string} searchTerm - Optional search term used for displaying search results info
 */
export function updateEventsDisplay(events, postsContainer, searchTerm = null) {
  let containerHTML = '';
  
  // Show search results info if search was performed
  if (searchTerm) {
    const resultCount = events.length;
    containerHTML += `
      <div class="search-results-info">
        <p>Found ${resultCount} result${resultCount !== 1 ? 's' : ''} for "${searchTerm}"</p>
        <button class="clear-search-btn" onclick="document.querySelector('#search-input').value = ''; 
                document.querySelector('#search-input').dispatchEvent(new Event('search'));">
          Clear Search
        </button>
      </div>
    `;
  }
  
  if (!events || events.length === 0) {
    containerHTML += createEmptyState(searchTerm ? 'No events found matching your search' : 'No events available');
    postsContainer.innerHTML = containerHTML;
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
              <span class="icon icon-message"></span>
              <span>${event.comments_count || 0}</span>
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
  containerHTML += eventsHTML;
  postsContainer.innerHTML = containerHTML;
  
  // Re-apply event listeners to the new elements if needed
  formatEventDates();
}

/**
 * Main initialization function that sets up all event filtering functionality
 * @return {Object} Collection of filter controllers (tabs, category, search)
 */
export function initializeEventFilters() {
  // Check if we're on a user events page by looking for a user-specific identifier in the URL
  const urlPath = window.location.pathname;
  const isUserEvents = urlPath.includes('/user_events/');
  let userId = null;
  
  if (isUserEvents) {
    // Extract user ID from URL path
    const matches = urlPath.match(/\/user_events\/([^\/]+)/);
    if (matches && matches[1]) {
      userId = matches[1];
    }
  }
  
  // Common parameters for all filters
  const commonParams = { isUserEvents, userId };
  
  // Set up filter tabs
  const tabFilters = setupFilterTabs({
    tabsSelector: '.filter-tab',
    containerSelector: '.posts-container',
    defaultFilter: 'new',
    fetchCallback: fetchFilteredEvents,
    formatCallback: formatEventDates,
    additionalParams: commonParams
  });
  
  // Set up category filter
  const categoryFilter = setupCategoryFilter({
    dropdownSelector: '#category-filter',
    containerSelector: '.posts-container',
    fetchCallback: fetchFilteredEvents,
    additionalParams: commonParams
  });
  
  // Set up search input if it exists on the page
  let searchFilter = null;
  if (document.querySelector('#search-input')) {
    searchFilter = setupSearchInput({
      searchInputSelector: '#search-input',
      searchButtonSelector: '#search-button',
      containerSelector: '.posts-container',
      fetchCallback: fetchFilteredEvents,
      additionalParams: commonParams
    });
    
    // Check URL for search parameter and apply it
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      searchFilter.setSearchTerm(searchParam);
    }
  }
  
  return {
    tabFilters,
    categoryFilter,
    searchFilter
  };
}