import {formatEventDates} from './post-format-code.js';
import {adjustUserEventsLink} from './user-events.js';

document.addEventListener('DOMContentLoaded', function() {
  // Format dates on the page
  formatEventDates();
  adjustUserEventsLink();
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
