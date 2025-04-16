function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    window.location.href = "/auth/login";
    return Promise.reject("No auth token");
  }
  
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`
  };
  
  return fetch(url, options)
    .then(response => {
      if (response.status === 401) {
        // Try to refresh the token first
        return refreshToken()
          .then(success => {
            if (success) {
              // Retry the original request with new token
              const newToken = localStorage.getItem("access_token");
              options.headers.Authorization = `Bearer ${newToken}`;
              return fetch(url, options);
            } else {
              // If refresh fails, redirect to login
              localStorage.removeItem("access_token");
              window.location.href = "/auth/login";
              return response;
            }
          })
          .catch(() => {
            localStorage.removeItem("access_token");
            window.location.href = "/auth/login";
            return response;
          });
      }
      return response;
    });
}

// Add token refresh functionality
async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Improved getUserId with better error messages
export async function getUserId() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No access token found. User must be logged in.');
  }
  
  try {
    const response = await fetchWithAuth('/auth/get_user_id');
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (response.status === 500) {
        throw new Error('Server error. The server might have restarted.');
      } else {
        throw new Error(`Failed to fetch user ID: ${response.status}`);
      }
    }
    
    const data = await response.json();
    return data.user_id;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}

// Keep the original getAuthToken function
export function getAuthToken() {
  return localStorage.getItem('access_token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export function redirectToLogin() {
  window.location.href = '/auth/login';
}

// Function to check if the server is available
export async function checkServerConnection() {
  try {
    const response = await fetch('/api/health-check', { 
      method: 'GET',
      cache: 'no-store' // Prevent caching
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Add server reconnection logic
export function setupServerReconnection() {
  let serverAvailable = true;
  
  // Check server status periodically
  setInterval(async () => {
    const isAvailable = await checkServerConnection();
    
    if (!isAvailable && serverAvailable) {
      // Server just went down
      serverAvailable = false;
      console.log("Server connection lost. Waiting for reconnection...");
    } else if (isAvailable && !serverAvailable) {
      // Server just came back up
      serverAvailable = true;
      console.log("Server reconnected. Refreshing authentication...");
      
      // Try to refresh the token
      const success = await refreshToken();
      if (!success && isAuthenticated()) {
        // If token refresh fails but we have a token, redirect to login
        alert("Server restarted. Please log in again.");
        redirectToLogin();
      }
    }
  }, 5000); // Check every 5 seconds
}

export async function getUserData() {
  try {
    const response = await fetchWithAuth('/auth/get_user_data');
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (response.status === 500) {
        throw new Error('Server error. The server might have restarted.');
      } else {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}