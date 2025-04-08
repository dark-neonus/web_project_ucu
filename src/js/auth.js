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
        localStorage.removeItem("access_token");
        window.location.href = "/auth/login";
      }
      return response;
    });
}

// userAuth
export async function getUserId() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No access token found. User must be logged in.');
  }
  
  try {
    const response = await fetch('/auth/get_user_id', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user ID');
    }
    
    const data = await response.json();
    return data.user_id;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}

export function getAuthToken() {
  return localStorage.getItem('access_token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export function redirectToLogin() {
  window.location.href = '/auth/login';
}