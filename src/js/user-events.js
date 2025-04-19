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
  
  // Check if current URL contains "user_events" and extract the user ID from it
  const currentPath = window.location.pathname;
  const userEventsMatch = currentPath.match(/\/events\/user_events\/([a-f0-9-]+)/i);
  
  // If we're on a user_events page, check if it's for the current user
  if (userEventsMatch) {
    const urlUserId = userEventsMatch[1];
    
    // Add "active" class if viewing current user's events, otherwise remove it
    if (urlUserId === currentUserId) {
      userEventLink.classList.add('active');
    } else {
      userEventLink.classList.remove('active');
    }
  } else {
    // Not on a user_events page, so remove the active class
    userEventLink.classList.remove('active');
  }
}