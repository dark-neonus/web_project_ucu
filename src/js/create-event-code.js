document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');

    console.log('Token:', token);
  
    if (!token) {
      alert('You must be logged in to create an event.');
      window.location.href = '/auth/login';
      return;
    }
  
    try {
      // Fetch the user ID from the backend
      const response = await fetch('/auth/get_user_id', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user ID');
      }
  
      const data = await response.json();
      const userId = data.user_id;
  
      // Store the user ID in a variable or use it directly in the form
      console.log('User ID:', userId);
  
      // Attach the user ID to the form submission
      const form = document.querySelector('#create-event-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
  
          const title = document.getElementById('title').value;
          const description = document.getElementById('description').value;
          const dateScheduled = document.getElementById('date_scheduled').value;
          const category = document.getElementById('category').value;
  
          const eventData = {
            title,
            description,
            date_scheduled: dateScheduled,
            category,
            author_id: userId, // Include the user ID in the POST request
          };
  
          try {
            const createResponse = await fetch('/create_event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(eventData),
            });
  
            if (!createResponse.ok) {
              throw new Error('Failed to create event');
            }
  
            alert('Event created successfully!');
            window.location.href = '/events';
          } catch (error) {
            console.error('Error creating event:', error);
            alert('An error occurred while creating the event.');
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
      alert('An error occurred. Please log in again.');
      window.location.href = '/auth/login';
    }
  });