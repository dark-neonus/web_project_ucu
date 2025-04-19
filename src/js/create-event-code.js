import { getUserId, getAuthToken, isAuthenticated, redirectToLogin } from '/src/js/auth.js';
import { adjustUserEventsLink } from './user-events.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Add toast notification system
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    createToast('You must be logged in to create an event.', 'error');
    setTimeout(() => {
      redirectToLogin();
    }, 2000);
    return;
  }

  adjustUserEventsLink(); // Adjust the user events link if necessary

  try {
    // Get user authentication information
    const userId = await getUserId();
    const token = getAuthToken();

    // Fetch event categories from the backend
    const categoriesResponse = await fetch('/events/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!categoriesResponse.ok) {
      throw new Error('Failed to fetch event categories');
    }

    const categories = await categoriesResponse.json();

    // Populate the dropdown with categories
    const categorySelect = document.getElementById('event-category');
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(); // Capitalize
      categorySelect.appendChild(option);
    });

    // Add validation styles to the page
    addValidationStyles();

    // Clear error styling when input changes
    setupInputValidation();

    // Set up form submission handler
    const formButton = document.querySelector('.button-primary');
    const formElement = document.querySelector('.question-form');

    formButton.addEventListener('click', async (e) => {
      e.preventDefault();

      // Clear previous errors
      clearValidationErrors();

      // Get form values from the DOM
      const title = document.querySelector('.form-input').value.trim();
      const description = document.querySelector('.form-textarea').value.trim();
      const dateInput = document.getElementById('event-date').value;
      const location = document.getElementById('event-location').value.trim();
      const category = categorySelect.value;

      // Validate all fields
      let isValid = true;

      // Title validation
      if (!title) {
        displayError(document.querySelector('.form-input'), 'Event title is required');
        isValid = false;
      } else if (title.length < 5) {
        displayError(document.querySelector('.form-input'), 'Title must be at least 5 characters long');
        isValid = false;
      } else if (title.length > 100) {
        displayError(document.querySelector('.form-input'), 'Title must be less than 100 characters');
        isValid = false;
      }

      // Description validation
      if (!description) {
        displayError(document.querySelector('.form-textarea'), 'Event description is required');
        isValid = false;
      } else if (description.length < 20) {
        displayError(document.querySelector('.form-textarea'), 'Description must be at least 20 characters long');
        isValid = false;
      }

      // Date validation
      if (!dateInput) {
        displayError(document.getElementById('event-date'), 'Event date is required');
        isValid = false;
      } else {
        const selectedDate = new Date(dateInput);
        const currentDate = new Date();
        
        // Reset time components to compare just the dates
        currentDate.setHours(0, 0, 0, 0);
        
        if (isNaN(selectedDate.getTime())) {
          displayError(document.getElementById('event-date'), 'Please enter a valid date');
          isValid = false;
        } else if (selectedDate < currentDate) {
          displayError(document.getElementById('event-date'), 'Event date cannot be in the past');
          isValid = false;
        }
      }

      // Location validation
      if (!location) {
        displayError(document.getElementById('event-location'), 'Event location is required');
        isValid = false;
      } else if (location.length < 3) {
        displayError(document.getElementById('event-location'), 'Location must be at least 3 characters long');
        isValid = false;
      }

      // Category validation
      if (!category) {
        displayError(categorySelect, 'Please select an event category');
        isValid = false;
      }

      if (!isValid) {
        // Scroll to the first error
        const firstError = document.querySelector('.form-input-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
        return;
      }

      const dateScheduled = new Date(dateInput).toISOString();

      // Prepare data for submission
      const eventData = {
        title,
        description,
        date_scheduled: dateScheduled,
        location,
        category,
        author_id: userId,
      };

      try {
        // Show loading state on button
        const submitButton = formButton;
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke-dasharray="32" stroke-dashoffset="0"></circle>
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
          </svg>
          Processing...
        `;

        // Send data to the server
        const createResponse = await fetch('/events/create_event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        });

        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.detail || 'Failed to create event');
        }

        createToast('Event created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/events';
        }, 2000);
      } catch (error) {
        console.error('Error creating event:', error);
        createToast(`An error occurred: ${error.message}`, 'error');
      }
    });

    // Add event listeners for any additional functionality
    const addImageButton = document.querySelector('.button-secondary');
    addImageButton.addEventListener('click', () => {
      createToast('Image upload functionality will be implemented in a future update.', 'info');
    });

  } catch (error) {
    console.error('Error in event creation setup:', error);
    createToast('An error occurred. Please log in again.', 'error');
    setTimeout(() => {
      redirectToLogin();
    }, 2000);
  }
});

// Add validation styles to the page
function addValidationStyles() {
  if (!document.getElementById('validation-styles')) {
    const style = document.createElement('style');
    style.id = 'validation-styles';
    style.textContent = `
      .form-error {
        color: #fecaca;
        font-size: 0.75rem;
        margin-top: 4px;
        display: block;
        text-align: left;
      }
      
      .form-input-error {
        border-color: #ef4444 !important;
      }
      
      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 4px;
        color: var(--text-color);
      }
      
      .form-field {
        position: relative;
        margin-bottom: var(--space-md);
      }
      
      /* Animation for form errors */
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      .shake-animation {
        animation: shake 0.4s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }
}

// Setup input validation listeners
function setupInputValidation() {
  const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select, input[type="date"]');
  formInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('form-input-error');
      const errorEl = this.parentElement.querySelector('.form-error');
      if (errorEl) {
        errorEl.remove();
      }
    });
    
    input.addEventListener('focus', function() {
      this.classList.remove('form-input-error');
    });
  });
}

// Clear all validation errors
function clearValidationErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.remove());
  document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));
}

// Display error message below an input
function displayError(inputElement, errorMessage) {
  inputElement.classList.add('form-input-error', 'shake-animation');
  
  // Remove animation class after animation completes
  setTimeout(() => {
    inputElement.classList.remove('shake-animation');
  }, 500);
  
  // Create error message element if it doesn't exist
  let errorEl = inputElement.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    inputElement.parentElement.appendChild(errorEl);
  }
  
  errorEl.textContent = errorMessage;
}


// Create and display toast notification
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
  
  // Auto-dismiss after 5 seconds for success and info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      toast.classList.add('toast-hidden');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }
  
  return toast;
}