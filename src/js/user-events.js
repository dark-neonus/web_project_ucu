import { getUserId } from './auth.js';

export async function adjustUserEventsLink() {
  const currentUserId = await getUserId();
  
  if (!currentUserId) {
    console.warn("Cannot adjust user_events link: User ID not found");
    return;
  }

  const userEventLink = document.getElementById('user-events-link');
  
  if (!userEventLink) {
    console.warn("Link with ID 'user-events-link' not found");
    return;
  }
  
  const baseUrl = `/events/user_events/${currentUserId}`;
  
  // Store the URL for later use in the click handler
  userEventLink.dataset.url = baseUrl;
  
  // Add click event listener if not already present
  if (!userEventLink.hasAttribute('data-click-handler-added')) {
    userEventLink.addEventListener('click', function() {
      window.location.href = this.dataset.url;
    });
    userEventLink.setAttribute('data-click-handler-added', 'true');
  }

  if (userEventLink.dataset.userId) {
    userEventLink.dataset.userId = currentUserId;
  }
}