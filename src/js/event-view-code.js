// JavaScript for Event View Page
document.addEventListener('DOMContentLoaded', function() {
    // Load the current event data
    loadCurrentEvent();
    
    // Set up event listeners for the page
    setupEventListeners();
  });
  
  function loadCurrentEvent() {
    const postsContainer = document.querySelector('.question-container');
    if (!postsContainer) return;
    
    // Get post data from localStorage
    const postDataJSON = localStorage.getItem('currentPost');
    if (!postDataJSON) {
      postsContainer.innerHTML = '<div class="error-state">No post data found</div>';
      return;
    }
    
    try {
      const postData = JSON.parse(postDataJSON);
      
      // Ensure this is an event post, not a question
      if (postData.type !== 'events') {
        window.location.href = 'question-view-page.html'; // Redirect to question view if this is not an event
        return;
      }
      
      // Create the post element
      const postElement = document.createElement('div');
      postElement.className = 'post event-post';
      
      // Build event HTML
      let postHTML = `
        <div class="post-header">
          <div class="user-info">
            <div class="avatar">
              <img src="https://via.placeholder.com/40" alt="User avatar">
            </div>
            <div class="user-meta">
              <p class="username">${postData.username}</p>
              <p class="time">${postData.timeAgo}</p>
            </div>
          </div>
          <button class="more-options-button">
            <span class="icon icon-more"></span>
          </button>
        </div>
        <h2 class="event-title">${postData.title}</h2>
        <div class="event-content">
          <p>${postData.content}</p>
        </div>
      `;
      
      // Add event-specific details
      if (postData.date || postData.location) {
        postHTML += `<div class="event-details">`;
        if (postData.date) {
          postHTML += `<div class="event-date"><span class="icon icon-calendar"></span> ${postData.date}</div>`;
        }
        if (postData.location) {
          postHTML += `<div class="event-location"><span class="icon icon-location"></span> ${postData.location}</div>`;
        }
        postHTML += `</div>`;
      }
      
      // Add footer and actions
      postHTML += `
        <div class="post-footer">
          <span class="post-tag">${postData.tag}</span>
          <div class="post-stats">
            <div class="stat">
              <span class="icon icon-eye"></span>
              <span>${postData.views}</span>
            </div>
            <div class="stat">
              <span class="icon icon-message"></span>
              <span>${postData.comments}</span>
            </div>
            <div class="stat vote-stat">
              <span class="icon icon-arrow-up"></span>
              <span>${postData.votes}</span>
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
      postElement.innerHTML = postHTML;
      postsContainer.innerHTML = '';
      postsContainer.appendChild(postElement);
      
      // Update page title
      const pageTitle = document.querySelector('.section-title');
      if (pageTitle) {
        pageTitle.textContent = 'Comments';
      }
      
    } catch (error) {
      console.error('Error loading post data:', error);
      postsContainer.innerHTML = '<div class="error-state">Failed to load post data</div>';
    }
  }
  
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
        
        // In a real implementation, this would update the participants list
        addCurrentUserToParticipants();
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
          // In a real implementation, this would send the comment to a server
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
  
  // Helper function to add the current user to the participants list
  function addCurrentUserToParticipants() {
    const participantsList = document.querySelector('.participants-list');
    if (!participantsList) return;
    
    // This would normally come from the logged-in user data
    const currentUser = {
      username: 'Current User',
      avatar: 'https://via.placeholder.com/40'
    };
    
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const participantElement = document.createElement('div');
    participantElement.className = 'participant';
    participantElement.innerHTML = `
      <div class="avatar">
        <img src="${currentUser.avatar}" alt="User avatar">
      </div>
      <div class="participant-info">
        <p class="username">${currentUser.username}</p>
        <p class="joined-date">Joined on ${dateString}</p>
      </div>
    `;
    
    participantsList.appendChild(participantElement);
  }