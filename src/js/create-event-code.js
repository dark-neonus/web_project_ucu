import { getUserId, getAuthToken, isAuthenticated, redirectToLogin } from '/src/js/auth.js';
import { adjustUserEventsLink } from './user-events-link.js';

document.addEventListener('DOMContentLoaded', async () => {
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


    // Clear error styling when input changes
    setupInputValidation();

    // Set up image upload functionality
    setupImageUpload(token);

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
      const dateTimeInput = document.getElementById('event-date').value;
      const location = document.getElementById('event-location').value.trim();
      const category = categorySelect.value;
      const imageCaption = document.getElementById('image-caption') ? document.getElementById('image-caption').value.trim() : '';
      const imageInput = document.getElementById('image-upload');
    
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
    
      // Date/time validation
      if (!dateTimeInput) {
        displayError(document.getElementById('event-date'), 'Event date and time are required');
        isValid = false;
      } else {
        const selectedDateTime = new Date(dateTimeInput);
        const currentDateTime = new Date();
        
        if (isNaN(selectedDateTime.getTime())) {
          displayError(document.getElementById('event-date'), 'Please enter a valid date and time');
          isValid = false;
        } else if (selectedDateTime < currentDateTime) {
          displayError(document.getElementById('event-date'), 'Event cannot be scheduled in the past');
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
    
      const dateScheduled = dateTimeInput ? new Date(dateTimeInput).toISOString() : '';


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

        // Create FormData for multipart/form-data submission
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date_scheduled', dateScheduled);
        formData.append('location', location);
        formData.append('category', category);
        formData.append('author_id', userId);
        
        // Add image file if selected
        if (imageInput && imageInput.files && imageInput.files.length > 0) {
          formData.append('image_file', imageInput.files[0]);
          
          // Add image caption if available
          if (imageCaption) {
            formData.append('image_caption', imageCaption);
          }
        }

        // Send data to the server
        const createResponse = await fetch('/events/create_event', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type header - the browser will set it with the correct boundary for FormData
          },
          body: formData,
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

  } catch (error) {
    console.error('Error in event creation setup:', error);
    createToast('An error occurred. Please log in again.', 'error');
  }
});

// Set up image upload functionality
// Set up image upload functionality
function setupImageUpload(token) {
  const addImageButton = document.querySelector('.button-secondary');
  if (!addImageButton) return;
  
  // Create a wrapper div to contain both the button and the upload container
  const uploadWrapper = document.createElement('div');
  uploadWrapper.className = 'upload-button-wrapper';
  uploadWrapper.style.position = 'relative';
  
  // Replace the button with the wrapper and move the button inside it
  addImageButton.parentNode.replaceChild(uploadWrapper, addImageButton);
  uploadWrapper.appendChild(addImageButton);
  
  // Create image upload input and caption field if they don't exist
  if (!document.getElementById('image-upload')) {
    // Create image upload container - positioned under the button
    const imageUploadContainer = document.createElement('div');
    imageUploadContainer.className = 'form-field image-upload-container';
    imageUploadContainer.style.display = 'none';
    imageUploadContainer.style.marginTop = '10px';
    
    // Container for the upload controls and preview
    const uploadControlsRow = document.createElement('div');
    uploadControlsRow.className = 'upload-controls-row';
    uploadControlsRow.style.display = 'flex';
    uploadControlsRow.style.alignItems = 'center';
    uploadControlsRow.style.gap = '10px';
    uploadControlsRow.style.marginBottom = '10px';
    
    // Create file input container (for styling)
    const fileInputContainer = document.createElement('div');
    fileInputContainer.className = 'file-input-container';
    fileInputContainer.style.flexGrow = '1';
    
    // Create file input
    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.id = 'image-upload';
    imageUpload.className = 'form-input';
    imageUpload.accept = 'image/jpeg,image/png,image/gif,image/jpg';
    
    // Create image preview - now smaller and inline
    const imagePreview = document.createElement('div');
    imagePreview.id = 'image-preview';
    imagePreview.className = 'image-preview';
    imagePreview.style.maxWidth = '120px';
    imagePreview.style.minWidth = '60px';
    
    // Create caption input - now more compact
    const captionContainer = document.createElement('div');
    captionContainer.className = 'form-field caption-field';
    captionContainer.style.display = 'none';
    captionContainer.style.marginTop = '5px';
    
    const captionInput = document.createElement('input');
    captionInput.type = 'text';
    captionInput.id = 'image-caption';
    captionInput.className = 'form-input';
    captionInput.placeholder = 'Image caption (optional)';
    
    // Append elements
    fileInputContainer.appendChild(imageUpload);
    uploadControlsRow.appendChild(fileInputContainer);
    uploadControlsRow.appendChild(imagePreview);
    
    imageUploadContainer.appendChild(uploadControlsRow);
    captionContainer.appendChild(captionInput);
    imageUploadContainer.appendChild(captionContainer);
    
    // Add the upload container directly after the button within the wrapper
    uploadWrapper.appendChild(imageUploadContainer);
    
    // Setup image preview functionality
    imageUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) {
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      // Show caption input when image is selected
      captionContainer.style.display = 'block';
      
      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        createToast('Image size must be less than 5MB', 'error');
        imageUpload.value = '';
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        createToast('Only JPG, PNG, and GIF images are allowed', 'error');
        imageUpload.value = '';
        imagePreview.innerHTML = '';
        captionContainer.style.display = 'none';
        return;
      }
      
      // Create image preview - now with a more compact design
      const reader = new FileReader();
      reader.onload = function(event) {
        imagePreview.innerHTML = `
          <div class="preview-container" style="position: relative; width: 60px; height: 60px;">
            <img src="${event.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
            <button type="button" class="remove-image" style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 50%; background: #ff4d4d; color: white; border: none; font-size: 14px; line-height: 1; cursor: pointer; padding: 0;" title="Remove image">×</button>
          </div>
        `;
        
        // Add remove button functionality
        const removeButton = imagePreview.querySelector('.remove-image');
        removeButton.addEventListener('click', function(e) {
          e.stopPropagation();
          imageUpload.value = '';
          imagePreview.innerHTML = '';
          captionInput.value = '';
          captionContainer.style.display = 'none';
        });
      };
      reader.readAsDataURL(file);
    });
  }
  
  // Show/hide image upload on button click
  addImageButton.addEventListener('click', function(e) {
    e.preventDefault();
    const imageUploadContainer = document.querySelector('.image-upload-container');
    
    if (imageUploadContainer.style.display === 'none') {
      imageUploadContainer.style.display = 'block';
      addImageButton.textContent = 'Cancel';
    } else {
      imageUploadContainer.style.display = 'none';
      document.getElementById('image-preview').innerHTML = '';
      document.getElementById('image-upload').value = '';
      
      // Get caption input and its container
      const captionInput = document.getElementById('image-caption');
      const captionContainer = document.querySelector('.caption-field');
      
      if (captionInput) captionInput.value = '';
      if (captionContainer) captionContainer.style.display = 'none';
      
      addImageButton.textContent = 'Add Event Image';
    }
  });
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