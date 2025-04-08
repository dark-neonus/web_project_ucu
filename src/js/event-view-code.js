document.addEventListener('DOMContentLoaded', function () {
  // Render the event data
  if (typeof eventData !== 'undefined') {
    renderEvent(eventData);
  } else {
    console.error('Event data is missing!');
    const postsContainer = document.querySelector('.question-container');
    if (postsContainer) {
      postsContainer.innerHTML = '<div class="error-state">Failed to load event data</div>';
    }
  }

  // Set up event listeners for the page
  setupEventListeners();
});

function renderEvent(eventData) {
  const postsContainer = document.querySelector('.question-container');
  if (!postsContainer) return;

  // Build the event HTML
  let postHTML = `
    <div class="post-header">
      <div class="user-info">
        <div class="avatar">
          <img src="https://via.placeholder.com/40" alt="User avatar">
        </div>
        <div class="user-meta">
          <p class="username">Author ID: ${eventData.author_id}</p>
          <p class="time">${new Date(eventData.date_created).toLocaleString()}</p>
        </div>
      </div>
      <button class="more-options-button">
        <span class="icon icon-more"></span>
      </button>
    </div>
    <h2 class="event-title">${eventData.title}</h2>
    <div class="event-content">
      <p>${eventData.description}</p>
    </div>
  `;

  // Add event-specific details
  if (eventData.date_scheduled || eventData.location) {
    postHTML += `<div class="event-details">`;
    if (eventData.date_scheduled) {
      postHTML += `<div class="event-date"><span class="icon icon-calendar"></span> ${new Date(eventData.date_scheduled).toLocaleString()}</div>`;
    }
    if (eventData.location) {
      postHTML += `<div class="event-location"><span class="icon icon-location"></span> ${eventData.location}</div>`;
    }
    postHTML += `</div>`;
  }

  // Add footer and actions
  postHTML += `
    <div class="post-footer">
      <span class="post-tag">${eventData.category}</span>
      <div class="post-stats">
        <div class="stat">
          <span class="icon icon-eye"></span>
          <span>0</span>
        </div>
        <div class="stat">
          <span class="icon icon-message"></span>
          <span>0</span>
        </div>
        <div class="stat vote-stat">
          <span class="icon icon-arrow-up"></span>
          <span>0</span>
        </div>
      </div>
    </div>
    <div class="event-actions">
      <button class="vote-button">
        <span>Vote</span>
      </button>
      <button class="join-event-button">
        <span class="icon icon-calendar"></span>
        <span>Join Event</span>
      </button>
    </div>
  `;

  // Set the HTML and add the element to the container
  postsContainer.innerHTML = postHTML;
}

function setupEventListeners() {
  // Handle vote button click
  const voteButton = document.querySelector('.vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', function () {
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
    joinEventButton.addEventListener('click', function () {
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
    commentButton.addEventListener('click', function () {
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
    cancelButton.addEventListener('click', function () {
      commentInput.value = '';
    });
  }
}