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

// Enhanced toast notification system for comment deletions
// Fix for the issue where notification doesn't vanish automatically
// Enhanced toast notification system for comment deletions
function createToast(message, type = 'error', options = {}) {
  // Set default autoDismiss value if not provided
  options.autoDismiss = options.autoDismiss || 3000; // Default to 3 seconds
  
  // Remove any existing toasts of the same type
  const existingToasts = document.querySelectorAll(`.toast-notification.toast-${type}`);
  existingToasts.forEach(toast => toast.remove());
  
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
  } else if (type === 'warning') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  }
  
  // Add progress bar for all toasts - this ensures auto-dismiss works
  const progressBar = '<div class="toast-progress-bar"><div class="toast-progress"></div></div>';
  
  // Add action buttons if provided
  let actionButtons = '';
  if (options.actions && options.actions.length) {
    actionButtons = '<div class="toast-actions">';
    options.actions.forEach(action => {
      actionButtons += `<button class="toast-action-button toast-action-${action.type}" data-action="${action.id}">${action.text}</button>`;
    });
    actionButtons += '</div>';
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
      ${actionButtons}
    </div>
    <button class="toast-close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    ${progressBar}
  `;
  
  // Store auto-dismiss timer for cleanup
  let autoDismissTimer = null;
  
  // Add toast to body
  document.body.appendChild(toast);
  
  // Add event listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(autoDismissTimer); // Clear timeout if manually closed
    dismissToast(toast);
  });
  
  // Add event listeners to action buttons if any
  if (options.actions && options.actions.length) {
    toast.querySelectorAll('.toast-action-button').forEach(button => {
      button.addEventListener('click', () => {
        clearTimeout(autoDismissTimer); // Clear timeout if action taken
        const actionId = button.getAttribute('data-action');
        const action = options.actions.find(a => a.id === actionId);
        if (action && action.callback) {
          action.callback();
        }
        dismissToast(toast);
      });
    });
  }
  
  // Animate in with small delay to ensure DOM updates
  setTimeout(() => {
    toast.classList.add('toast-visible');
    
    // Start progress animation for all toasts
    const progressElement = toast.querySelector('.toast-progress');
    if (progressElement) {
      // Use requestAnimationFrame to ensure the initial state is rendered before transition
      requestAnimationFrame(() => {
        // Set initial width to 100%
        progressElement.style.width = '100%';
        
        // Force a reflow to ensure the initial state is applied
        progressElement.offsetWidth;
        
        // Now set the transition and final width
        progressElement.style.transition = `width ${options.autoDismiss}ms linear`;
        progressElement.style.width = '0%';
      });
    }
    
    // Set autoDismiss timeout for all toasts
    if (options.autoDismiss !== false) {
      autoDismissTimer = setTimeout(() => {
        dismissToast(toast);
      }, options.autoDismiss);
    }
  }, 10);
  
  return toast;
}

// Improved dismissToast function with proper cleanup
function dismissToast(toast) {
  if (!toast || toast.classList.contains('toast-hidden')) return;
  
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-hidden');
  
  // Make sure the element is removed after animation completes
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Function to show a deletion confirmation toast
function showDeleteConfirmationToast(commentId) {
  return createToast('Delete this comment?', 'warning', {
    autoDismiss: 8000,
    actions: [
      {
        id: 'cancel',
        text: 'Cancel',
        type: 'secondary',
        callback: () => {
          // Just close the toast
        }
      },
      {
        id: 'delete',
        text: 'Delete',
        type: 'danger',
        callback: () => {
          // Proceed with deletion
          performCommentDeletion(commentId);
        }
      }
    ]
  });
}

// Function to perform the actual comment deletion
async function performCommentDeletion(commentId) {
  const token = getAuthToken();
  if (!token) {
    createToast('Please log in to delete comments', 'error');
    return;
  }
  
  // Show a loading toast
  const loadingToast = createToast('Deleting comment...', 'info');
  
  try {
    const response = await fetch(`/events/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Dismiss the loading toast
    dismissToast(loadingToast);
    
    if (response.ok) {
      createToast('Comment deleted successfully', 'success', { autoDismiss: 500 });
      
      // Get the current count and decrement it
      const commentCountElement = document.querySelector('.post-stats .stat:first-child span:last-child');
      if (commentCountElement) {
        const currentCount = parseInt(commentCountElement.textContent) || 0;
        if (currentCount > 0) {
          updateCommentCount(currentCount - 1);
        }
      }
      
      // Add slide-up animation and remove the comment from the DOM
      const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
      if (commentElement) {
        commentElement.style.transition = 'all 0.5s ease';
        commentElement.style.overflow = 'hidden';
        commentElement.style.opacity = '0';
        commentElement.style.maxHeight = '0';
        commentElement.style.marginBottom = '0';
        commentElement.style.paddingTop = '0';
        commentElement.style.paddingBottom = '0';
        
        setTimeout(() => {
          commentElement.remove();
          
          // If this was the last comment, show the no comments message
          const remainingComments = document.querySelectorAll('.comment').length;
          if (remainingComments === 0) {
            const commentsContainer = document.getElementById('comments-container');
            if (commentsContainer) {
              commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
            }
          }
        }, 500);
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
    createToast(error.message || 'Failed to delete comment', 'error', { autoDismiss: 500 });
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
async function renderComments(comments) {
  const commentsContainer = document.getElementById('comments-container');
  
  if (!commentsContainer) return;
  
  if (comments.length === 0) {
    commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    return;
  }
  
  // Clear loading message
  commentsContainer.innerHTML = '';
  
  // Get current user ID once for all comments
  const currentUserId = await getUserId();
  
  // Create comment elements
  for (const comment of comments) {
    const commentElement = await createCommentElement(comment, currentUserId);
    commentsContainer.appendChild(commentElement);
  }
}

// Function to create a comment element
function createCommentElement(comment, currentUserId) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';
  commentDiv.setAttribute('data-comment-id', comment.id);
  
  // Format the date for display
  const formattedDate = formatRelativeDate(comment.date_created);
  // Format ISO date for the datetime attribute
  const isoDate = formatISODate(comment.date_created);
  
  // Check if the current user is the author
  const isAuthor = String(comment.user_id).trim() === String(currentUserId).trim();

  // Sanitize comment content for security
  const safeContent = sanitizeCommentContent(comment.content);
  
  let replyToHtml = '';
  if (comment.parent_comment_author) {
    // Sanitize parent author name
    const safeParentAuthor = sanitizeCommentContent(comment.parent_comment_author);
    replyToHtml = `
      <div class="reply-reference">
        <span class="reply-to-text">Reply to</span>
        <span class="reply-to-author">${safeParentAuthor}</span>
      </div>
    `;
  }

  // Sanitize username
  const safeUsername = sanitizeCommentContent(comment.author_username);

  // Create comment HTML structure
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-user-info" onclick="window.location.href='/auth/profile/${comment.user_id}'">
        <div class="comment-avatar">
          <img src="https://via.placeholder.com/32" alt="User avatar">
        </div>
        <div class="comment-user-meta">
          <p class="comment-username">${safeUsername}</p>
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
      <p>${safeContent}</p>
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
  
  // Delete button - UPDATED to use the new confirmation toast
  const deleteButton = commentDiv.querySelector('.delete-comment-button');
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      showDeleteConfirmationToast(comment.id);
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
  const charCounter = document.getElementById('comment-char-counter') || createCharCounter();
  
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
  
  // Add input event listener for character counting and live validation
  commentInput.addEventListener('input', () => {
    const content = commentInput.value;
    const charCount = content.length;
    
    // Update character counter
    updateCharCounter(charCounter, charCount);
    
    // Live validation for immediate feedback
    if (charCount > 0) {
      const validation = validateCommentContent(content);
      if (!validation.valid) {
        charCounter.classList.add('error');
        charCounter.setAttribute('title', validation.message);
      } else {
        charCounter.classList.remove('error');
        charCounter.removeAttribute('title');
      }
    } else {
      charCounter.classList.remove('error');
      charCounter.removeAttribute('title');
    }
  });
  
  // Submit button click with validation
  newSubmitButton.addEventListener('click', async () => {
    const content = commentInput.value;
    const eventId = getEventIdFromUrl();
    const parentCommentId = commentInput.getAttribute('data-parent-id') || null;
    const commentId = commentInput.getAttribute('data-editing-id') || null;
    
    // Check rate limiting
    const rateLimitCheck = commentRateLimit.check();
    if (!rateLimitCheck.allowed) {
      createToast(rateLimitCheck.message, 'warning', { autoDismiss: rateLimitCheck.waitTime });
      return;
    }
    
    // Validate content
    const validation = validateCommentContent(content);
    if (!validation.valid) {
      createToast(validation.message, 'error');
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
        await updateComment(commentId, validation.content);
        
        // Update the comment in the DOM if possible
        const commentContentElement = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-content p`);
        if (commentContentElement) {
          commentContentElement.innerHTML = sanitizeCommentContent(validation.content);
        } else {
          // If we can't find the element, reload all comments
          loadEventComments();
        }
      } else {
        // We're creating a new comment
        await createComment(eventId, validation.content, parentCommentId);
        
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

// Function to update an existing comment
async function updateComment(commentId, content) {
  const token = getAuthToken();
  if (!token) {
    createToast('Please log in to edit comments', 'error');
    return;
  }
  
  // Validate content before submission
  const validation = validateCommentContent(content);
  if (!validation.valid) {
    createToast(validation.message, 'error');
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
        content: validation.content
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

// IMPROVED: Function to delete a comment with enhanced error handling and UI feedback
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
        // Add a fade-out animation before removing
        commentElement.style.transition = 'opacity 0.3s ease';
        commentElement.style.opacity = '0';
        
        setTimeout(() => {
          commentElement.remove();
          
          // If this was the last comment, show the no comments message
          const remainingComments = document.querySelectorAll('.comment').length;
          if (remainingComments === 0) {
            const commentsContainer = document.getElementById('comments-container');
            if (commentsContainer) {
              commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
            }
          }
        }, 300);
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

function scrollToCommentFormWithOffset() {
  const commentForm = document.querySelector('.comment-form') || document.getElementById('comment-input').closest('form');
  
  if (!commentForm) return;
  
  // Get the viewport height
  const viewportHeight = window.innerHeight;
  
  // Calculate position to scroll to
  const rect = commentForm.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Position the form about 30% from the top of the viewport
  const targetPosition = rect.top + scrollTop - (viewportHeight * 0.3);
  
  // Smooth scroll to the calculated position
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// Update the startEditing function
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
  
  // Scroll to the comment form with better positioning
  scrollToCommentFormWithOffset();
}

// Update the startReply function
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
  
  // Scroll to the comment form with better positioning
  scrollToCommentFormWithOffset();
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

function addCharCounterStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .comment-char-counter {
      font-size: 12px;
      color: #6c757d;
      text-align: right;
      margin-top: 4px;
      margin-bottom: 10px;
      transition: color 0.3s ease;
    }
    
    .comment-char-counter.warning {
      color: #ffc107;
    }
    
    .comment-char-counter.error {
      color: #dc3545;
    }
  `;
  document.head.appendChild(styleEl);
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
  // Add character counter styles
  addCharCounterStyles();
  
  // Load comments when the page loads
  loadEventComments();
  
  // Setup date refreshing
  setupDateRefreshing();
});

function createCharCounter() {
  const commentInput = document.getElementById('comment-input');
  if (!commentInput) return null;
  
  const charCounter = document.createElement('div');
  charCounter.id = 'comment-char-counter';
  charCounter.className = 'comment-char-counter';
  charCounter.textContent = '0/500';
  
  // Insert after the comment input
  if (commentInput.parentNode) {
    commentInput.parentNode.insertBefore(charCounter, commentInput.nextSibling);
  }
  
  return charCounter;
}

// Update character counter with visual feedback
function updateCharCounter(charCounter, count) {
  if (!charCounter) return;
  
  charCounter.textContent = `${count}/500`;
  
  // Visual feedback based on length
  charCounter.className = 'comment-char-counter';
  
  if (count > 400) {
    charCounter.classList.add('warning');
  } else if (count > 500) {
    charCounter.classList.add('error');
  }
}

// Function to create a new comment with validation
async function createComment(eventId, content, parentCommentId = null) {
  const token = getAuthToken();
  if (!token) {
    createToast('Please log in to comment', 'error');
    return;
  }
  
  // Validate content before submission
  const validation = validateCommentContent(content);
  if (!validation.valid) {
    createToast(validation.message, 'error');
    return;
  }
  
  const requestBody = {
    content: validation.content
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

// New validation functions for comments
function validateCommentContent(content) {
  // Trim the content to remove leading/trailing whitespace
  const trimmedContent = content.trim();
  
  // Check if comment is empty
  if (!trimmedContent) {
    return {
      valid: false,
      message: 'Comment cannot be empty'
    };
  }
  
  // Check minimum length
  if (trimmedContent.length < 2) {
    return {
      valid: false,
      message: 'Comment is too short (minimum 2 characters)'
    };
  }
  
  // Check maximum length (prevent extremely long comments)
  if (trimmedContent.length > 500) {
    return {
      valid: false,
      message: 'Comment is too long (maximum 500 characters)'
    };
  }
  
  // Check for excessive capitalization (yelling)
  const upperCaseChars = trimmedContent.replace(/[^A-Z]/g, '').length;
  const totalChars = trimmedContent.replace(/[^A-Za-z]/g, '').length;
  
  if (totalChars > 20 && upperCaseChars / totalChars > 0.7) {
    return {
      valid: false,
      message: 'Please avoid using excessive capitalization'
    };
  }
  
  // Check for excessive repeating characters
  if (/(.)\1{10,}/.test(trimmedContent)) {
    return {
      valid: false,
      message: 'Comment contains excessive repeating characters'
    };
  }
  
  // Check for spam patterns (e.g., repeated URLs)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = trimmedContent.match(urlRegex) || [];
  
  if (urls.length > 5) {
    return {
      valid: false,
      message: 'Too many URLs in comment (maximum 5 allowed)'
    };
  }
  
  // All checks passed
  return {
    valid: true,
    content: trimmedContent // Return the trimmed content
  };
}

// Function to sanitize content before displaying it
function sanitizeCommentContent(content) {
  // Basic HTML sanitization (should be used in conjunction with server-side sanitization)
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rate limiting for comment submissions
const commentRateLimit = {
  lastSubmit: 0,
  minInterval: 3000, // 3 seconds between submissions
  check: function() {
    const now = Date.now();
    if (now - this.lastSubmit < this.minInterval) {
      return {
        allowed: false,
        message: `Please wait ${Math.ceil((this.minInterval - (now - this.lastSubmit)) / 1000)} seconds before submitting another comment`,
        waitTime: this.minInterval - (now - this.lastSubmit)
      };
    }
    this.lastSubmit = now;
    return { allowed: true };
  }
};

export {
  loadEventComments,
  createComment,
  updateComment,
  deleteComment,
  updateCommentCount,
  validateCommentContent,
  sanitizeCommentContent
};