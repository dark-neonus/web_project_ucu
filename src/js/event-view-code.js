// Update the existing file event-view-code.js

import {formatEventDates} from './post-format-code.js';
import {adjustUserEventsLink} from './user-events-link.js';
import {getAuthToken} from './auth.js';
import {loadEventComments} from './event-comments.js';

document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners for the page
  formatEventDates();
  setupEventListeners();
  adjustUserEventsLink();
  checkVoteStatus();
  checkRegistrationStatus();
  
  // Load comments for the event
  loadEventComments();
});

// New function to check registration status
async function checkRegistrationStatus() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  
  const token = getAuthToken();
  if (!token) return; // User is not logged in
  
  try {
    const response = await fetch(`/events/register/${eventId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateRegistrationUI(data.is_registered);
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
  }
}

// Update the UI to reflect registration status
function updateRegistrationUI(isRegistered) {
  const joinButton = document.getElementById('event-join-button');
  
  if (joinButton) {
    if (isRegistered) {
      joinButton.classList.add('registered');
      joinButton.querySelector('span:last-child').textContent = 'Cancel Registration';
    } else {
      joinButton.classList.remove('registered');
      joinButton.disabled = false;
      joinButton.style.opacity = '1';
      joinButton.querySelector('span:last-child').textContent = 'Join Event';
    }
  }
}

// Function to toggle registration status
async function toggleRegistration(eventId, token) {
  const joinButton = document.getElementById('event-join-button');
  const isRegistered = joinButton.classList.contains('registered');
  
  try {
    const response = await fetch(`/events/register/${eventId}`, {
      method: isRegistered ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // If it's a new registration
      if (!isRegistered) {
        const data = await response.json();
        console.log('Registration successful:', data);
        showNotification('You have registered for this event!');
      } else {
        // If it's a cancellation
        console.log('Registration cancelled');
        showNotification('Your registration has been cancelled');
      }
      
      // Update the UI
      updateRegistrationUI(!isRegistered);
    } else {
      const errorData = await response.json();
      console.error('Error updating registration:', errorData);
      showNotification(errorData.detail || 'Error updating registration', 'error');
    }
  } catch (error) {
    console.error('Error updating registration:', error);
    showNotification('Error updating registration. Please try again.', 'error');
  }
}

// Show a notification message
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// Check if the user has already voted for this event
async function checkVoteStatus() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  
  const token = getAuthToken();
  if (!token) return; // User is not logged in
  
  try {
    const response = await fetch(`/events/vote/${eventId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateVoteUI(data.vote_count, data.has_voted);
    }
  } catch (error) {
    console.error('Error checking vote status:', error);
  }
}

// Extract the event ID from the current URL
function getEventIdFromUrl() {
  const pathParts = window.location.pathname.split('/');
  const eventId = pathParts[pathParts.length - 1];
  return eventId;
}

// Update the UI to reflect the current vote count and user's vote status
function updateVoteUI(voteCount, hasVoted) {
  const voteCountElement = document.querySelector('.vote-stat span:last-child');
  const voteButton = document.getElementById('event-vote-button');
  
  if (voteCountElement) {
    voteCountElement.textContent = voteCount;
  }
  
  if (voteButton) {
    if (hasVoted) {
      voteButton.classList.add('voted');
      voteButton.querySelector('span').textContent = 'Unvote';
    } else {
      voteButton.classList.remove('voted');
      voteButton.disabled = false;
      voteButton.style.opacity = '1';
      voteButton.querySelector('span').textContent = 'Vote';
    }
  }
}

async function toggleVote(eventId, token) {
  const voteButton = document.getElementById('event-vote-button');
  const isVoted = voteButton.classList.contains('voted');
  
  try {
    const response = await fetch(`/events/vote/${eventId}`, {
      method: isVoted ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateVoteUI(data.vote_count, data.has_voted);
    } else {
      const errorData = await response.json();
      console.error('Error updating vote:', errorData);
      showNotification(errorData.detail || 'Error updating vote', 'error');
    }
  } catch (error) {
    console.error('Error updating vote:', error);
    showNotification('Error updating vote. Please try again.', 'error');
  }
}

function setupEventListeners() {
  // Handle vote button click - using ID selector
  const voteButton = document.getElementById('event-vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        showNotification('Please log in to vote for this event', 'error');
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      // Use the toggleVote function to handle both voting and unvoting
      await toggleVote(eventId, token);
    });
  }
  // Handle join event button - updated to use the registration API
  const joinEventButton = document.getElementById('event-join-button');
  if (joinEventButton) {
    joinEventButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        showNotification('Please log in to join this event', 'error');
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      // Use the toggleRegistration function
      await toggleRegistration(eventId, token);
    });
  }

  // Handle comment form - using ID selectors
  const commentButton = document.getElementById('comment-submit-button');
  const cancelButton = document.getElementById('comment-cancel-button');
  const commentInput = document.getElementById('comment-input');

  if (commentButton) {
    commentButton.addEventListener('click', function() {
      const token = getAuthToken();
      if (!token) {
        showNotification('Please log in to comment', 'error');
        return;
      }
      
      const commentText = commentInput.value.trim();
      if (commentText) {
        showNotification('Comment submitted: ' + commentText);
        commentInput.value = '';
      } else {
        showNotification('Please enter a comment before submitting.', 'error');
      }
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      commentInput.value = '';
    });
  }
}
