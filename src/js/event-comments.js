// Import necessary modules
import {getAuthToken, getUserId} from './auth.js';
import {formatRelativeDate, formatISODate} from './post-format-code.js';


// Function to get the event ID from the URL
function getEventIdFromUrl() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
}

// Function to update comment count in the UI
function updateCommentCount(count) {
    const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
    if (commentCountElement) {
      commentCountElement.textContent = count;
    }
  }

// Function to load comments for the current event
async function loadEventComments() {
    const commentsContainer = document.getElementById('comments-container');
    const eventId = getEventIdFromUrl();
    
    if (!eventId || !commentsContainer) return;
    
    try {
      const response = await fetch(`/events/${eventId}/comments`);
      
      if (response.ok) {
        const data = await response.json();
        renderComments(data.comments);
        
        // Update the comment count in the UI
        updateCommentCount(data.comments.length);
      } else {
        commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
    }
  }

// Function to render comments in the comments container
function renderComments(comments) {
  const commentsContainer = document.getElementById('comments-container');
  
  if (!commentsContainer) return;
  
  if (comments.length === 0) {
    commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }
  
  // Clear loading message
  commentsContainer.innerHTML = '';
  
  // Create comment elements
  comments.forEach(comment => {
    const commentElement = createCommentElement(comment);
    commentsContainer.appendChild(commentElement);
  });
}

// Function to create a comment element
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.setAttribute('data-comment-id', comment.id);
    
    // Format the date for display
    const formattedDate = formatRelativeDate(comment.date_created);
    // Format ISO date for the datetime attribute
    const isoDate = formatISODate(comment.date_created);
    
    // Create comment HTML structure
    commentDiv.innerHTML = `
      <div class="comment-header">
        <div class="comment-user-info">
          <div class="comment-avatar">
            <img src="https://via.placeholder.com/32" alt="User avatar">
          </div>
          <div class="comment-user-meta">
            <p class="comment-username">${comment.author_username}</p>
            <p class="comment-time" datetime="${isoDate}">${formattedDate}</p>
          </div>
        </div>
        <div class="comment-actions">
          ${comment.user_id === getUserId() ? `
            <button class="edit-comment-button" data-comment-id="${comment.id}">
              <span class="icon icon-edit"></span>
            </button>
            <button class="delete-comment-button" data-comment-id="${comment.id}">
              <span class="icon icon-delete"></span>
            </button>
          ` : ''}
        </div>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-footer">
        <button class="reply-button" data-comment-id="${comment.id}">
          Reply
        </button>
      </div>
    `;
    
    // Add event listeners for comment actions
    setTimeout(() => {
      addCommentActionListeners(commentDiv, comment);
    }, 0);
    
    return commentDiv;
}

// Function to add event listeners to comment actions
function addCommentActionListeners(commentDiv, comment) {
  // Edit button
  const editButton = commentDiv.querySelector('.edit-comment-button');
  if (editButton) {
    editButton.addEventListener('click', () => {
      startEditing(comment);
    });
  }
  
  // Delete button
  const deleteButton = commentDiv.querySelector('.delete-comment-button');
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      deleteComment(comment.id);
    });
  }
  
  // Reply button
  const replyButton = commentDiv.querySelector('.reply-button');
  if (replyButton) {
    replyButton.addEventListener('click', () => {
      startReply(comment);
    });
  }
}

// Function to setup comment form listeners
function setupCommentFormListeners() {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  const cancelButton = document.getElementById('comment-cancel-button');
  
  if (!commentInput || !submitButton || !cancelButton) return;
  
  // Submit button click
  submitButton.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    const eventId = getEventIdFromUrl();
    const parentCommentId = commentInput.getAttribute('data-parent-id') || null;
    const commentId = commentInput.getAttribute('data-editing-id') || null;
    
    if (!content) {
      showNotification('Please enter a comment before submitting.', 'error');
      return;
    }
    
    if (!eventId) {
      showNotification('Could not determine event ID', 'error');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      showNotification('Please log in to comment', 'error');
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
      
      // Reload comments to show the new/updated comment
      loadEventComments();
    } catch (error) {
      console.error('Error with comment:', error);
      showNotification('Failed to submit comment. Please try again.', 'error');
    }
  });
  
  // Cancel button click
  cancelButton.addEventListener('click', () => {
    resetCommentForm();
  });
}

// Function to create a new comment
// Function to create a new comment
async function createComment(eventId, content, parentCommentId = null) {
    const token = getAuthToken();
    if (!token) {
      showNotification('Please log in to comment', 'error');
      return;
    }
    
    const requestBody = {
      content: content
    };
    
    if (parentCommentId) {
      requestBody.parent_comment_id = parentCommentId;
    }
    
    try {
      const response = await fetch(`/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw errorData;
      }
      
      const data = await response.json();
      showNotification('Comment posted successfully');
      
      // Get the current count and increment it
      const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
      if (commentCountElement) {
        const currentCount = parseInt(commentCountElement.textContent) || 0;
        updateCommentCount(currentCount + 1);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      let errorMessage = 'Failed to post comment';
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showNotification(errorMessage, 'error');
      throw error;
    }
}
// Function to update an existing comment - Fixed to match backend expectations
async function updateComment(commentId, content) {
  const token = getAuthToken();
  if (!token) {
    showNotification('Please log in to edit comments', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/events/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content  // Wrapped in an object to match backend expectation
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      showNotification('Comment updated successfully');
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update comment');
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    showNotification(error.message || 'Failed to update comment', 'error');
    throw error;
  }
}

// Function to delete a comment
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      showNotification('Please log in to delete comments', 'error');
      return;
    }
    
    try {
      const response = await fetch(`events/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showNotification('Comment deleted successfully');
        
        // Get the current count and decrement it
        const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
        if (commentCountElement) {
          const currentCount = parseInt(commentCountElement.textContent) || 0;
          if (currentCount > 0) {
            updateCommentCount(currentCount - 1);
          }
        }
        
        // Reload comments
        loadEventComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showNotification(error.message || 'Failed to delete comment', 'error');
    }
  }

// Function to start editing a comment
function startEditing(comment) {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  
  if (!commentInput || !submitButton) return;
  
  // Set the input value to the comment content
  commentInput.value = comment.content;
  
  // Add data attributes to track we're editing
  commentInput.setAttribute('data-editing-id', comment.id);
  commentInput.removeAttribute('data-parent-id');
  
  // Change button text
  submitButton.querySelector('span').textContent = 'Update';
  
  // Focus the input
  commentInput.focus();
  
  // Scroll to the comment form
  commentInput.scrollIntoView({ behavior: 'smooth' });
}

// Function to start replying to a comment
function startReply(comment) {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  
  if (!commentInput || !submitButton) return;
  
  // Clear the input
  commentInput.value = '';
  
  // Add data attribute to track parent ID
  commentInput.setAttribute('data-parent-id', comment.id);
  commentInput.removeAttribute('data-editing-id');
  
  // Change button text
  submitButton.querySelector('span').textContent = 'Reply';
  
  // Focus the input
  commentInput.focus();
  
  // Scroll to the comment form
  commentInput.scrollIntoView({ behavior: 'smooth' });
}

// Function to reset the comment form
function resetCommentForm() {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  
  if (!commentInput || !submitButton) return;
  
  // Clear input and data attributes
  commentInput.value = '';
  commentInput.removeAttribute('data-editing-id');
  commentInput.removeAttribute('data-parent-id');
  
  // Reset button text
  submitButton.querySelector('span').textContent = 'Comment';
}

// Show notification function (reusing from event-view-code.js)
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

// Fixed date refresh function
function setupDateRefreshing() {
    // Update relative times every minute
    setInterval(() => {
        document.querySelectorAll('.comment-time').forEach(timeElement => {
            const dateTime = timeElement.getAttribute('datetime');
            if (dateTime) {
                // Parse the datetime to ensure we're working with a Date object
                try {
                    const date = new Date(dateTime);
                    if (!isNaN(date.getTime())) {
                        const formattedDate = formatRelativeDate(date);
                        timeElement.textContent = formattedDate;
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                }
            }
        });
    }, 60000); // Update every minute
}

export {
    loadEventComments,
    createComment,
    updateComment,
    deleteComment,
    updateCommentCount
  };

// Call this function in your DOMContentLoaded event handler:
document.addEventListener('DOMContentLoaded', function() {
    // Load comments when the page loads
    loadEventComments();
    
    // Set up comment form event listeners
    setupCommentFormListeners();
    
    // Setup date refreshing
    setupDateRefreshing();
});