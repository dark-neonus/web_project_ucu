// Function to make authenticated requests
function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You are not logged in. Please log in to continue.");
      window.location.href = "/src/pages/login-page.html"; // Redirect to login page
      return;
    }
  
    // Add Authorization header
    const headers = options.headers || {};
    headers.Authorization = `Bearer ${token}`;
    options.headers = headers;
  
    // Make the fetch request
    return fetch(url, options)
      .then(response => {
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("access_token");
          window.location.href = "/src/pages/login-page.html"; // Redirect to login page
        }
        return response;
      })
      .catch(error => {
        console.error("Error making authenticated request:", error);
      });
  }