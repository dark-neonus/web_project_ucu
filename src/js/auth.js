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