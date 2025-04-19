import {formatEventDates} from './post-format-code.js';
import {adjustUserEventsLink} from './user-events.js';

document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners for the page
  formatEventDates();
  setupEventListeners();
  adjustUserEventsLink();
});



function setupEventListeners() {
  // Handle vote button click
  const voteButton = document.querySelector('.vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', function() {
      const voteCountElement = document.querySelector('.vote-stat span:last-child');
      const currentVotes = parseInt(voteCountElement.textContent);
      voteCountElement.textContent = currentVotes + 1;

      this.disabled = true;
      this.style.opacity = '0.7';
    });
  }

  // Handle join event button
  const joinEventButton = document.querySelector('.join-event-button');
  if (joinEventButton) {
    joinEventButton.addEventListener('click', function() {
      alert('You have registered for this event!');
      this.disabled = true;
      this.style.opacity = '0.7';
      this.querySelector('span:last-child').textContent = 'Joined';
    });
  }

  // Handle comment form
  const commentButton = document.querySelector('.suggest-button');
  const cancelButton = document.querySelector('.cancel-button');
  const commentInput = document.querySelector('.suggestion-input');

  if (commentButton) {
    commentButton.addEventListener('click', function() {
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