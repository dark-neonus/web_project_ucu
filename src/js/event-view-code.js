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
  checkRegistrationStatus();
  setupCommentFormListeners();
  // Load comments for the event - this will handle comment form setup internally
  loadEventComments();
  
  // Don't set up comment form listeners here since it's handled in event-comments.js
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
      } else {
        // If it's a cancellation
        console.log('Registration cancelled');
      }
      
      // Update the UI
      updateRegistrationUI(!isRegistered);
    } else {
      const errorData = await response.json();
      console.error('Error updating registration:', errorData);
    }
  } catch (error) {
    console.error('Error updating registration:', error);
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
    }
  } catch (error) {
    console.error('Error updating vote:', error);
  }
}

function setupEventListeners() {
  // Handle vote button click - using ID selector
  const voteButton = document.getElementById('event-vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
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
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      // Use the toggleRegistration function
      await toggleRegistration(eventId, token);
    });
  }

}

// Function to setup comment form listeners
function setupCommentFormListeners() {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  const cancelButton = document.getElementById('comment-cancel-button');
  
  if (!commentInput || !submitButton || !cancelButton) return;
  
  // Remove any existing event listeners to prevent duplicates
  const newSubmitButton = submitButton.cloneNode(true);
  const newCancelButton = cancelButton.cloneNode(true);
  
  if (submitButton.parentNode) {
    submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
  }
  
  if (cancelButton.parentNode) {
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
  }
  
  // Submit button click
  newSubmitButton.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    const eventId = getEventIdFromUrl();
    const parentCommentId = commentInput.getAttribute('data-parent-id') || null;
    const commentId = commentInput.getAttribute('data-editing-id') || null;
    
    if (!content) {
      createToast('Please enter a comment before submitting.', 'error');
      return;
    }
    
    if (!eventId) {
      createToast('Could not determine event ID', 'error');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      createToast('Please log in to comment', 'error');
      return;
    }
    
    try {
      if (commentId) {
        // We're editing an existing comment
        await updateComment(commentId, content);
      } else {
        // We're creating a new comment
        await createComment(eventId, content, parentCommentId);
      }
      
      // Reset the form
      resetCommentForm();
      
      // For new comments or if we can't find the specific comment element, reload all comments
      if (!commentId) {
        loadEventComments();
      }
    } catch (error) {
      console.error('Error with comment:', error);
      createToast('Failed to submit comment. Please try again.', 'error');
    }
  });
  
  // Cancel button click
  newCancelButton.addEventListener('click', () => {
    resetCommentForm();
  });
}