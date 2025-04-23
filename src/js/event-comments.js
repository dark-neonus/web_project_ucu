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

// Toast notification system
function createToast(message, type = 'error') {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast container
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  
  // Set icon based on type
  let icon = '';
  if (type === 'success') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (type === 'error') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else if (type === 'info') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  // Add toast to body
  document.body.appendChild(toast);
  
  // Add event listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hidden');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('toast-visible');
  }, 10);
  
  // Auto-dismiss after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      toast.classList.add('toast-hidden');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }
  
  return toast;
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
      
      // Set up the comment form listeners after loading comments
      setupCommentFormListeners();
    } else {
      commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
      createToast('Failed to load comments', 'error');
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
    createToast('Error loading comments: ' + error.message, 'error');
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
  
  // Check if the current user is the author
  const currentUserId = getUserId();
  const isAuthor = comment.user_id === currentUserId;
  
  // Add reply-to info if this is a reply
  let replyToHtml = '';
  if (comment.parent_comment_author) {
    replyToHtml = `
      <div class="reply-reference">
        <span class="reply-to-text">Reply to</span>
        <span class="reply-to-author">${comment.parent_comment_author}</span>
      </div>
    `;
  }
  
  // Create comment HTML structure
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-user-info" onclick="window.location.href='/auth/profile/${comment.user_id}'">
        <div class="comment-avatar">
          <img src="https://via.placeholder.com/32" alt="User avatar">
        </div>
        <div class="comment-user-meta">
          <p class="comment-username">${comment.author_username}</p>
          ${replyToHtml}
          <p class="comment-time" datetime="${isoDate}">${formattedDate}</p>
        </div>
      </div>
      <div class="comment-actions">
        ${isAuthor ? `
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
  
  // Add event listeners directly after creating the element
  addCommentActionListeners(commentDiv, comment);
  
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
        
        // Update the comment in the DOM if possible
        const commentContentElement = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
        if (commentContentElement) {
          commentContentElement.textContent = content;
        } else {
          // If we can't find the element, reload all comments
          loadEventComments();
        }
      } else {
        // We're creating a new comment
        await createComment(eventId, content, parentCommentId);
        
        // Reload comments to show the new comment
        loadEventComments();
      }
      
      // Reset the form
      resetCommentForm();
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

// Function to create a new comment
async function createComment(eventId, content, parentCommentId = null) {
  const token = getAuthToken();
  if (!token) {
    createToast('Please log in to comment', 'error');
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
    createToast('Comment posted successfully', 'success');
    
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
    createToast(errorMessage, 'error');
    throw error;
  }
}

// Function to update an existing comment
async function updateComment(commentId, content) {
  const token = getAuthToken();
  if (!token) {
    createToast('Please log in to edit comments', 'error');
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
        content: content
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      createToast('Comment updated successfully', 'success');
      return data;
    } else {
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update comment');
      } catch (parseError) {
        throw new Error('Failed to update comment: Server error');
      }
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    createToast(error.message || 'Failed to update comment', 'error');
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
    createToast('Please log in to delete comments', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/events/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      createToast('Comment deleted successfully', 'success');
      
      // Get the current count and decrement it
      const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
      if (commentCountElement) {
        const currentCount = parseInt(commentCountElement.textContent) || 0;
        if (currentCount > 0) {
          updateCommentCount(currentCount - 1);
        }
      }
      
      // Remove the comment from the DOM
      const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
      if (commentElement) {
        commentElement.remove();
      } else {
        // If we can't find the element, reload all comments
        loadEventComments();
      }
    } else {
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete comment');
      } catch (parseError) {
        throw new Error('Failed to delete comment: Server error');
      }
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    createToast(error.message || 'Failed to delete comment', 'error');
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
  const buttonText = submitButton.querySelector('span');
  if (buttonText) {
    buttonText.textContent = 'Update';
  } else {
    submitButton.textContent = 'Update';
  }
  
  // Focus the input
  commentInput.focus();
  
  // Scroll to the comment form
  commentInput.scrollIntoView({ behavior: 'smooth' });
}

// Function to start replying to a comment
function startReply(comment) {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  const replyIndicator = document.getElementById('reply-indicator') || createReplyIndicator();
  
  if (!commentInput || !submitButton) return;
  
  // Clear the input
  commentInput.value = '';
  
  // Add data attribute to track parent ID
  commentInput.setAttribute('data-parent-id', comment.id);
  commentInput.removeAttribute('data-editing-id');
  
  // Change button text
  const buttonText = submitButton.querySelector('span');
  if (buttonText) {
    buttonText.textContent = 'Reply';
  } else {
    submitButton.textContent = 'Reply';
  }
  
  // Show reply indicator with author's name
  replyIndicator.style.display = 'flex';
  const authorNameElement = replyIndicator.querySelector('.reply-author-name');
  if (authorNameElement) {
    authorNameElement.textContent = comment.author_username;
  }
  
  // Focus the input
  commentInput.focus();
  
  // Scroll to the comment form
  commentInput.scrollIntoView({ behavior: 'smooth' });
}

// Function to create a reply indicator element if it doesn't exist
function createReplyIndicator() {
  const commentForm = document.querySelector('.comment-form');
  const existingIndicator = document.getElementById('reply-indicator');
  
  if (existingIndicator) return existingIndicator;
  
  const replyIndicator = document.createElement('div');
  replyIndicator.id = 'reply-indicator';
  replyIndicator.className = 'reply-indicator';
  replyIndicator.innerHTML = `
    <div class="reply-info">
      <span class="reply-prefix">Replying to</span>
      <span class="reply-author-name"></span>
    </div>
    <button class="cancel-reply-button" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  // Add cancel reply button functionality
  replyIndicator.querySelector('.cancel-reply-button').addEventListener('click', () => {
    resetCommentForm();
  });
  
  // Insert the reply indicator before the comment input
  const commentInput = document.getElementById('comment-input');
  if (commentInput && commentInput.parentNode) {
    commentInput.parentNode.insertBefore(replyIndicator, commentInput);
  } else if (commentForm) {
    commentForm.insertBefore(replyIndicator, commentForm.firstChild);
  }
  
  // Initially hidden
  replyIndicator.style.display = 'none';
  
  return replyIndicator;
}

// Function to reset the comment form
function resetCommentForm() {
  const commentInput = document.getElementById('comment-input');
  const submitButton = document.getElementById('comment-submit-button');
  const replyIndicator = document.getElementById('reply-indicator');
  
  if (!commentInput || !submitButton) return;
  
  // Clear input and data attributes
  commentInput.value = '';
  commentInput.removeAttribute('data-editing-id');
  commentInput.removeAttribute('data-parent-id');
  
  // Reset button text
  const buttonText = submitButton.querySelector('span');
  if (buttonText) {
    buttonText.textContent = 'Comment';
  } else {
    submitButton.textContent = 'Comment';
  }
  
  // Hide reply indicator if it exists
  if (replyIndicator) {
    replyIndicator.style.display = 'none';
  }
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

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load comments when the page loads
  loadEventComments();
  
  // Setup date refreshing
  setupDateRefreshing();
});

export {
  loadEventComments,
  createComment,
  updateComment,
  deleteComment,
  updateCommentCount
};