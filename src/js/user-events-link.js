import { getUserId } from './utils/auth-utils.js';

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
  
  userEventLink.dataset.url = baseUrl;
  
  if (!userEventLink.hasAttribute('data-click-handler-added')) {
    userEventLink.addEventListener('click', function() {
      window.location.href = this.dataset.url;
    });
    userEventLink.setAttribute('data-click-handler-added', 'true');
  }

  if (userEventLink.dataset.userId) {
    userEventLink.dataset.userId = currentUserId;
  }
  
  const currentPath = window.location.pathname;
  const userEventsMatch = currentPath.match(/\/events\/user_events\/([a-f0-9-]+)/i);
  
  if (userEventsMatch) {
    const urlUserId = userEventsMatch[1];
    
    if (urlUserId === currentUserId) {
      userEventLink.classList.add('active');
    } else {
      userEventLink.classList.remove('active');
    }
  } else {
    userEventLink.classList.remove('active');
  }
}