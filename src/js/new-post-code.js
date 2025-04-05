document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const questionForm = document.querySelector('.question-form');
    const formTitle = document.querySelector('.form-input');
    const formContent = document.querySelector('.form-textarea');
    const formCategory = document.querySelector('.form-select');
    const formSubmitButton = document.querySelector('.button-primary');
    const formTitleElement = document.querySelector('.form-title');
    const formSubmitText = formSubmitButton ? formSubmitButton.querySelector('span') : null;
    
    // Get URL parameters to determine content type
    const urlParams = new URLSearchParams(window.location.search);
    const contentType = urlParams.get('type') || 'questions';
    
    // Function to set up the form based on content type
    function setupFormPage() {
      if (!questionForm) return;
      
      // Remove any existing event fields to avoid duplicates
      const existingEventFields = document.querySelector('.event-form-fields');
      if (existingEventFields) {
        existingEventFields.remove();
      }
      
      // Configure form based on content type
      if (contentType === 'events') {
        // Set up event form
        if (formTitleElement) formTitleElement.textContent = 'Create a New Event';
        if (formSubmitText) formSubmitText.textContent = 'Post Event';
        
        // Create and add event-specific fields
        const eventFields = document.createElement('div');
        eventFields.className = 'event-form-fields';
        eventFields.innerHTML = `
          <div class="form-group">
            <label for="event-date">Event Date</label>
            <input type="date" id="event-date" class="form-input event-date-input" required>
          </div>
          <div class="form-group">
            <label for="event-location">Event Location</label>
            <input type="text" id="event-location" class="form-input event-location-input" placeholder="Enter event location" required>
          </div>
        `;
        
        // Insert event fields before the submit button
        const submitButtonGroup = document.querySelector('.form-actions');
        if (submitButtonGroup) {
          questionForm.insertBefore(eventFields, submitButtonGroup);
        } else {
          // If form-actions not found, append to form
          questionForm.appendChild(eventFields);
        }
      } else {
        // Set up question form
        if (formTitleElement) formTitleElement.textContent = 'Ask a New Question';
        if (formSubmitText) formSubmitText.textContent = 'Post Question';
      }
      
      // Store the content type in a data attribute for use when submitting
      questionForm.setAttribute('data-content-type', contentType);
      
      // Update active state in menu if exists
      updateMenuActiveState();
    }
    
    // Update menu active state based on content type
    function updateMenuActiveState() {
      const menuItems = document.querySelectorAll('.menu-item');
      if (!menuItems || menuItems.length === 0) return;
      
      menuItems.forEach(item => {
        const itemText = item.querySelector('span:last-child');
        if (!itemText) return;
        
        const text = itemText.textContent.trim();
        item.classList.remove('active');
        
        if ((contentType === 'questions' && text === 'Questions') ||
            (contentType === 'events' && text === 'Events')) {
          item.classList.add('active');
        }
      });
    }
    
    // Submit form handler
    if (formSubmitButton) {
      formSubmitButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get the content type from the form's data attribute
        const formContentType = questionForm.getAttribute('data-content-type') || 'questions';
        
        // Validate common form fields
        if (!formTitle.value.trim()) {
          alert('Please enter a title');
          return;
        }
        
        if (!formContent.value.trim()) {
          alert('Please enter content');
          return;
        }
        
        if (!formCategory.value || formCategory.value === '') {
          alert('Please select a category');
          return;
        }
        
        // Create base object
        const newPost = {
          title: formTitle.value.trim(),
          content: formContent.value.trim(),
          tag: formCategory.value,
          username: 'Anonymous User', // Default username for non-logged in users
          timestamp: new Date().toISOString(),
          timeAgo: 'Just now',
          views: 0,
          comments: 0,
          votes: 0,
          closed: false
        };
        
        // Add event-specific data if applicable
        if (formContentType === 'events') {
          // Get event date and location from the form
          const eventDateInput = document.querySelector('.event-date-input');
          const eventLocationInput = document.querySelector('.event-location-input');
          
          if (!eventDateInput || !eventDateInput.value) {
            alert('Please enter the event date');
            return;
          }
          
          if (!eventLocationInput || !eventLocationInput.value.trim()) {
            alert('Please enter the event location');
            return;
          }
          
          // Format the date nicely
          const eventDate = new Date(eventDateInput.value);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          newPost.date = formattedDate;
          newPost.location = eventLocationInput.value.trim();
        }
        
        // Save to localStorage for demo purposes
        saveNewPost(newPost, formContentType);
        
        // Redirect back to the forum page
        alert(`Your ${formContentType === 'questions' ? 'question' : 'event'} has been submitted successfully!`);
        window.location.href = `/src/pages/forum-page.html?content=${formContentType}`;
      });
    }
    
    // Function to save a new post to localStorage
    function saveNewPost(post, contentType) {
      // Storage key depends on content type
      const storageKey = contentType === 'questions' ? 'forumQuestions' : 'forumEvents';
      
      // Get existing posts
      let posts = JSON.parse(localStorage.getItem(storageKey)) || [];
      
      // Add new post
      posts.unshift(post); // Add to beginning
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(posts));
    }
    
    // Set up header nav buttons if they exist
    const navButtons = document.querySelectorAll('.nav-links button');
    if (navButtons && navButtons.length > 0) {
      navButtons.forEach(button => {
        const buttonText = button.textContent.trim();
        button.classList.remove('active');
        
        if ((contentType === 'questions' && buttonText === 'Forum') ||
            (contentType === 'events' && buttonText === 'Events')) {
          button.classList.add('active');
        }
      });
    }
    
    // Add image button functionality if exists
    const addImageButton = document.querySelector('.button-secondary');
    if (addImageButton) {
      addImageButton.addEventListener('click', function() {
        alert('Image upload functionality would be implemented here');
      });
    }
    
    // Initialize the form
    setupFormPage();
  });