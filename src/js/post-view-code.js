// JavaScript for Question View Page
document.addEventListener('DOMContentLoaded', function() {
  // Load the current question data
  loadCurrentQuestion();
  
  // Set up event listeners for the page
  setupEventListeners();
});

function loadCurrentQuestion() {
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
    
    // Ensure this is a question post, not an event
    if (postData.type === 'events') {
      window.location.href = 'event-view-page.html'; // Redirect to event view if this is an event
      return;
    }
    
    // Create the post element
    const postElement = document.createElement('div');
    postElement.className = 'post question-post';
    
    // Build question HTML
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
      <h2 class="question-title">${postData.title}</h2>
      <div class="question-content">
        <p>${postData.content}</p>
      </div>
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
      <div class="question-actions">
        <button class="vote-button">
          <span>Vote</span>
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
      pageTitle.textContent = 'Suggestions';
    }
    
  } catch (error) {
    console.error('Error loading post data:', error);
    postsContainer.innerHTML = '<div class="error-state">Failed to load post data</div>';
  }
}

function setupEventListeners() {
  // Toggle reply visibility
  const toggleRepliesButton = document.querySelector('.toggle-replies-button');
  if (toggleRepliesButton) {
    toggleRepliesButton.addEventListener('click', function() {
      const buttonText = this.querySelector('span:last-child');
      const isHidden = buttonText.textContent.includes('Hide');
      
      if (isHidden) {
        buttonText.textContent = 'Show All Replies (2)';
        // Hide replies here (would normally toggle a class on reply elements)
      } else {
        buttonText.textContent = 'Hide All Replies (2)';
        // Show replies here
      }
      
      // Toggle the direction of the arrow icon
      const arrowIcon = this.querySelector('.icon-arrow-down');
      if (isHidden) {
        arrowIcon.classList.remove('icon-arrow-down');
        arrowIcon.classList.add('icon-arrow-right');
      } else {
        arrowIcon.classList.remove('icon-arrow-right');
        arrowIcon.classList.add('icon-arrow-down');
      }
    });
  }
  
  // Handle reply button click
  const replyButton = document.querySelector('.reply-button');
  if (replyButton) {
    replyButton.addEventListener('click', function() {
      // In a real implementation, this would show a reply form
      const replyForm = document.createElement('div');
      replyForm.className = 'reply-form';
      replyForm.innerHTML = `
        <textarea class="reply-input" placeholder="Write your reply..."></textarea>
        <div class="reply-buttons">
          <button class="cancel-reply-button">Cancel</button>
          <button class="submit-reply-button">Reply</button>
        </div>
      `;
      
      const answerPost = this.closest('.answer-post');
      answerPost.appendChild(replyForm);
      
      // Hide the reply button while form is shown
      this.style.display = 'none';
      
      // Add event listener to cancel button
      const cancelButton = replyForm.querySelector('.cancel-reply-button');
      cancelButton.addEventListener('click', function() {
        replyForm.remove();
        replyButton.style.display = 'flex';
      });
      
      // Add event listener to submit button
      const submitButton = replyForm.querySelector('.submit-reply-button');
      submitButton.addEventListener('click', function() {
        const replyText = replyForm.querySelector('.reply-input').value.trim();
        if (replyText) {
          // In a real implementation, this would send the reply to a server
          alert('Reply submitted: ' + replyText);
          replyForm.remove();
          replyButton.style.display = 'flex';
        } else {
          alert('Please enter a reply before submitting.');
        }
      });
    });
  }
  
  // Handle vote button click
  const voteButton = document.querySelector('.vote-button');
  if (voteButton) {
    voteButton.addEventListener('click', function() {
      // In a real implementation, this would send a vote to the server
      const voteCountElement = document.querySelector('.post-stats .icon-arrow-up').nextElementSibling;
      const currentVotes = parseInt(voteCountElement.textContent);
      voteCountElement.textContent = currentVotes + 1;
      
      // Disable vote button after voting
      this.disabled = true;
      this.style.opacity = '0.7';
    });
  }
  
  // Handle upvote and downvote buttons
  const upvoteButton = document.querySelector('.upvote-button');
  const downvoteButton = document.querySelector('.downvote-button');
  
  if (upvoteButton) {
    upvoteButton.addEventListener('click', function() {
      const voteCount = this.querySelector('span:last-child');
      const currentCount = parseInt(voteCount.textContent);
      voteCount.textContent = currentCount + 1;
      
      // Disable buttons after voting (in a real app)
      this.disabled = true;
      if (downvoteButton) downvoteButton.disabled = true;
    });
  }
  
  if (downvoteButton) {
    downvoteButton.addEventListener('click', function() {
      const voteCount = this.querySelector('span:last-child');
      const currentCount = parseInt(voteCount.textContent);
      voteCount.textContent = currentCount + 1;
      
      // Disable buttons after voting (in a real app)
      this.disabled = true;
      if (upvoteButton) upvoteButton.disabled = true;
    });
  }
  
  // Handle suggestion form
  const suggestButton = document.querySelector('.suggest-button');
  const cancelButton = document.querySelector('.cancel-button');
  const suggestionInput = document.querySelector('.suggestion-input');
  
  if (suggestButton) {
    suggestButton.addEventListener('click', function() {
      const suggestionText = suggestionInput.value.trim();
      if (suggestionText) {
        // In a real implementation, this would send the suggestion to a server
        alert('Suggestion submitted: ' + suggestionText);
        suggestionInput.value = '';
      } else {
        alert('Please enter a suggestion before submitting.');
      }
    });
  }
  
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      suggestionInput.value = '';
    });
  }
}