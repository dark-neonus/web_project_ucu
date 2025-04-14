 // Settings page specific JavaScript
 document.addEventListener('DOMContentLoaded', function() {
    // Function to load user data
    async function loadUserData() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }
        
        const response = await fetch('/auth/get_user_data', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Populate form fields
          document.getElementById('first_name').value = userData.first_name || '';
          document.getElementById('last_name').value = userData.last_name || '';
          document.getElementById('email').value = userData.email || '';
          document.getElementById('bio').value = userData.bio || '';
          document.getElementById('location').value = userData.location || '';
          document.getElementById('website').value = userData.website || '';
          
          // Update sidebar username
          document.getElementById('sidebar-username').textContent = 
            `${userData.first_name} ${userData.last_name}`;
          
          // Set avatar if available
          if (userData.avatar) {
            document.getElementById('sidebar-avatar').style.backgroundImage = `url(${userData.avatar})`;
            document.getElementById('current-avatar').style.backgroundImage = `url(${userData.avatar})`;
          }
        
          if (userData.id) {
            const profileLink = document.getElementById('sidebar-profile-link');
            const activityLink = document.getElementById('sidebar-activity-link');

            if (profileLink) {
              profileLink.href = `/auth/profile/${userData.id}`;
            }

            if (activityLink) {
                activityLink.href = `/auth/profile/${userData.id}#activity`;
            }
          }

        } else {
          throw new Error('Failed to load user data');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Failed to load user data', 'error');
      }
    }
    
    // Handle form submission
    document.getElementById('settings-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }
        
        const formData = new FormData(this);
        const userData = {
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          bio: formData.get('bio'),
          location: formData.get('location'),
          website: formData.get('website'),
          profile_visibility: formData.get('profile_visibility'),
          show_email: formData.get('show_email') === 'on',
          show_activity: formData.get('show_activity') === 'on',
          email_posts: formData.get('email_posts') === 'on',
          email_events: formData.get('email_events') === 'on',
          email_newsletter: formData.get('email_newsletter') === 'on'
        };
        
        // Handle password change if provided
        if (formData.get('current_password') && formData.get('new_password')) {
          if (formData.get('new_password') !== formData.get('confirm_password')) {
            showNotification('New passwords do not match', 'error');
            return;
          }
          
          userData.current_password = formData.get('current_password');
          userData.new_password = formData.get('new_password');
        }
        
        // Mock API call - replace with actual endpoint when implemented
        console.log('Updating user settings:', userData);
        showNotification('Settings saved successfully', 'success');
        
        // Refresh user data
        loadUserData();
      } catch (error) {
        console.error('Error updating settings:', error);
        showNotification('Failed to update settings', 'error');
      }
    });
    
    // Handle avatar upload
    document.getElementById('avatar_upload').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showNotification('File size exceeds 2MB limit', 'error');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          document.getElementById('current-avatar').style.backgroundImage = `url(${event.target.result})`;
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Handle remove avatar
    document.getElementById('remove_avatar').addEventListener('click', function() {
      document.getElementById('current-avatar').style.backgroundImage = '';
      document.getElementById('avatar_upload').value = '';
    });
    
    // Handle delete account
    document.getElementById('delete_account').addEventListener('click', function() {
      document.getElementById('confirmation-modal').style.display = 'flex';
    });
    
    // Close modal
    document.querySelectorAll('.close-modal').forEach(button => {
      button.addEventListener('click', function() {
        document.getElementById('confirmation-modal').style.display = 'none';
        document.getElementById('delete_confirmation').value = '';
        document.getElementById('confirm_delete').disabled = true;
      });
    });
    
    // Handle delete confirmation text input
    document.getElementById('delete_confirmation').addEventListener('input', function(e) {
      document.getElementById('confirm_delete').disabled = e.target.value !== 'DELETE';
    });
    
    // Handle confirm delete
    document.getElementById('confirm_delete').addEventListener('click', async function() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }
        
        // Mock API call - replace with actual endpoint when implemented
        console.log('Deleting account');
        showNotification('Account successfully deleted', 'success');
        
        // Clear token and redirect to home
        localStorage.removeItem('access_token');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account', 'error');
      }
    });
    
    // Notification function
    function showNotification(message, type = 'info') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      // Add to document
      document.body.appendChild(notification);
      
      // Show notification
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Hide and remove notification
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
    
    // Load user data on page load
    loadUserData();
  });