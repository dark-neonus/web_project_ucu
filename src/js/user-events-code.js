import {formatEventDates} from './post-format-code.js';
import {adjustUserEventsLink} from './user-events.js';
import {setupFilterTabs, fetchFilteredEvents} from './filter-tabs.js';

document.addEventListener('DOMContentLoaded', function() {
  adjustUserEventsLink();
  
  // Extract the user ID from the URL path
  // Assuming URL format is like: /events/user_events/{user_id}
  const userId = window.location.pathname.split('/').pop();
  const isUserEventsPage = window.location.pathname.includes('/user_events/');
  
  // Set up filter tabs with appropriate parameters based on page context
  const filterControls = setupFilterTabs({
    tabsSelector: '.filter-tab',
    containerSelector: '.posts-container',
    defaultFilter: 'new',
    fetchCallback: fetchFilteredEvents,
    formatCallback: formatEventDates,
    additionalParams: {
      isUserEvents: isUserEventsPage,
      userId: isUserEventsPage ? userId : null
    }
  });
  
  // Make events clickable to view details - delegated event handler
  document.querySelector('.posts-container').addEventListener('click', function(e) {
    const postElement = e.target.closest('.post');
    
    if (!postElement) return;
    
    // Don't trigger navigation if clicking on buttons or stats
    if (e.target.closest('button') || e.target.closest('.post-stats')) {
      return;
    }
    
    const eventId = postElement.dataset.id;
    window.location.href = `/events/view_event/${eventId}`;
  });
});