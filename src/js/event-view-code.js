import {formatEventDates} from './utils/post-format-utils.js';
import {adjustUserEventsLink} from './user-events-link.js';
import {getAuthToken} from './utils/auth-utils.js';
import {loadEventComments} from './event-comments.js'

document.addEventListener('DOMContentLoaded', function() {
  formatEventDates();
  setupEventListeners();
  adjustUserEventsLink();
  checkRegistrationStatus();
  loadEventComments();
});

async function checkRegistrationStatus() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  
  const token = getAuthToken();
  if (!token) return;
  
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
      updateRegistrationUI(!isRegistered);
    } else {
      const errorData = await response.json();
      console.error('Error updating registration:', errorData);
    }
  } catch (error) {
    console.error('Error updating registration:', error);
  }
}

function getEventIdFromUrl() {
  const pathParts = window.location.pathname.split('/');
  const eventId = pathParts[pathParts.length - 1];
  return eventId;
}

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
  const voteButton = document.getElementById('event-vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      await toggleVote(eventId, token);
    });
  }
  const joinEventButton = document.getElementById('event-join-button');
  if (joinEventButton) {
    joinEventButton.addEventListener('click', async function() {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      
      const eventId = getEventIdFromUrl();
      if (!eventId) return;
      
      await toggleRegistration(eventId, token);
    });
  }

}
