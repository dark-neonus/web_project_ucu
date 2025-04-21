// Main application entry point
import {adjustUserEventsLink} from './user-events-link.js';
import {initializeEventFilters} from './filter-tabs.js';

document.addEventListener('DOMContentLoaded', function() {
  // Adjust user events link to point to the current user if logged in
  adjustUserEventsLink();
  
  // Initialize filter tabs and category filter
  const filters = initializeEventFilters();
  
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