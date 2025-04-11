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

    // Set up form submission handler
    const formButton = document.querySelector('.button-primary');
    const formElement = document.querySelector('.question-form');

    formButton.addEventListener('click', async (e) => {
      e.preventDefault();

      // Get form values from the DOM
      const title = document.querySelector('.form-input').value.trim();
      const description = document.querySelector('.form-textarea').value.trim();
      const dateScheduled = new Date(document.getElementById('event-date').value).toISOString();
      const location = document.getElementById('event-location').value.trim();
      const category = categorySelect.value;

      // Validate form data
      if (!title || !description || !dateScheduled || !location || !category) {
        alert('Please fill in all fields.');
        return;
      }

      // Prepare data for submission
      const eventData = {
        title,
        description,
        date_scheduled: dateScheduled,
        location,
        category,
        author_id: userId,
      };

      console.log(eventData); // Debugging: Log the data being sent to the backend

      try {
        // Send data to the server
        const createResponse = await fetch('/events/create_event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.detail || 'Failed to create event');
        }

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