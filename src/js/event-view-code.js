import {formatEventDates} from './post-format-code.js';
import {adjustUserEventsLink} from './user-events-link.js';
import {getAuthToken} from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners for the page
  formatEventDates();
  setupEventListeners();
  adjustUserEventsLink();
  checkVoteStatus();
});

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
      alert(errorData.detail || 'Error updating vote');
    }
  } catch (error) {
    console.error('Error updating vote:', error);
    alert('Error updating vote. Please try again.');
  }
}

function setupEventListeners() {
  // Handle vote button click - using ID selector
  const voteButton = document.getElementById('event-vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        alert('Please log in to vote for this event');
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      // Use the toggleVote function to handle both voting and unvoting
      await toggleVote(eventId, token);
    });
  }

  // Handle join event button - using ID selector
  const joinEventButton = document.getElementById('event-join-button');
  if (joinEventButton) {
    joinEventButton.addEventListener('click', function() {
      const token = getAuthToken();
      if (!token) {
        alert('Please log in to join this event');
        return;
      }
      
      alert('You have registered for this event!');
      this.disabled = true;
      this.style.opacity = '0.7';
      this.querySelector('span:last-child').textContent = 'Joined';
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
        alert('Please log in to comment');
        return;
      }
      
      const commentText = commentInput.value.trim();
      if (commentText) {
        alert('Comment submitted: ' + commentText);
        commentInput.value = '';
      } else {
        alert('Please enter a comment before submitting.');
      }
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      commentInput.value = '';
    });
  }
}