document.addEventListener('DOMContentLoaded', function() {
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
