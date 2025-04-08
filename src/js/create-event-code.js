import { getUserId, getAuthToken, isAuthenticated, redirectToLogin } from '/src/js/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    alert('You must be logged in to create an event.');
    redirectToLogin();
    return;
  }
  
  try {
    // Get user authentication information
    const userId = await getUserId();
    const token = getAuthToken();
    
    // Set up form submission handler
    const formButton = document.querySelector('.button-primary');
    const formElement = document.querySelector('.question-form');
    
    formButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Get form values from the DOM
      const title = document.querySelector('.form-input').value.trim();
      const description = document.querySelector('.form-textarea').value.trim();
      const dateScheduled = document.getElementById('event-date').value;
      const location = document.getElementById('event-location').value.trim();
      const categorySelect = document.querySelector('.form-select');
      const category = categorySelect.options[categorySelect.selectedIndex].value;
      
      // Validate form data
      if (!title) {
        alert('Please enter an event title');
        return;
      }
      
      if (!description) {
        alert('Please enter an event description');
        return;
      }
      
      if (!dateScheduled) {
        alert('Please select an event date');
        return;
      }
      
      if (!location) {
        alert('Please enter an event location');
        return;
      }
      
      if (!category || category === '') {
        alert('Please select a category');
        return;
      }
      
      // Prepare data for submission
      const eventData = {
        title,
        description,
        date_scheduled: dateScheduled,
        location,
        category,
        author_id: userId
      };
      
      try {
        // Send data to the server
        const createResponse = await fetch('/events/create_event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(eventData)
        });
        console.log(createResponse)
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.detail || 'Failed to create event');
        }
        // Handle successful response
        alert('Event created successfully!');
        window.location.href = '/events';
      } catch (error) {
        console.error('Error creating event:', error);
        alert(`An error occurred while creating the event: ${error.message}`);
      }
    });
    
    // Add event listeners for any additional functionality
    const addImageButton = document.querySelector('.button-secondary');
    addImageButton.addEventListener('click', () => {
      alert('Image upload functionality will be implemented in a future update.');
    });
    
  } catch (error) {
    console.error('Error in event creation setup:', error);
    alert('An error occurred. Please log in again.');
    redirectToLogin();
  }
});