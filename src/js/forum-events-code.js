import {formatEventDates} from './post-format-code.js';

document.addEventListener('DOMContentLoaded', function() {
  // Format dates on the page
  formatEventDates();
  
  // Make events clickable to view details
  document.querySelectorAll('.post').forEach(post => {
    post.addEventListener('click', function(e) {
      if (e.target.closest('button') || e.target.closest('.post-stats')) {
        return;
      }
      
      const eventId = this.dataset.id;
      window.location.href = `/events/view_event/${eventId}`;
    });
  });
});
