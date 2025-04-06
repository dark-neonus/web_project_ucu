document.addEventListener('DOMContentLoaded', function() {
    // Get reference to header container
    const headerContainer = document.querySelector('.header-container');
    
    // Handle authentication state
    function handleAuthState() {
        const token = localStorage.getItem('access_token');
        const loginButton = document.querySelector('.login-button');
        const registerButton = document.querySelector('.register-button');
        const logoutButton = document.querySelector('.logout-button');
        const navContainer = document.querySelector('.auth-links');
        
        if (token && token.split('.').length === 3) {
            // User is logged in
            if (loginButton) loginButton.style.display = 'none';
            if (registerButton) registerButton.style.display = 'none';
            
            // Create profile element if it doesn't exist
            let profileContainer = document.querySelector('.profile-container');
            
            if (!profileContainer && navContainer) {
                // Create profile container
                profileContainer = document.createElement('div');
                profileContainer.className = 'profile-container';
                
                // Try to get username from token for the alt text and to generate profile initial
                let username = 'User';
                try {
                    const payload = token.split('.')[1];
                    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
                    const userData = JSON.parse(decoded);
                    if (userData.username) username = userData.username;
                } catch (e) {
                    console.error('Error parsing token:', e);
                }
                
                // Get user's first initial for the avatar
                const userInitial = username.charAt(0).toUpperCase();
                
                // Generate a consistent background color based on username
                const colors = ['#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#1abc9c', '#d35400'];
                const colorIndex = username.charCodeAt(0) % colors.length;
                const bgColor = colors[colorIndex];
                
                // Create profile HTML with logout in dropdown and styled avatar
                profileContainer.innerHTML = `
                    <a href="/profile/" class="profile-link">
                        <div class="profile-avatar" style="background-color: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; font-weight: bold; font-size: 16px;">
                            ${userInitial}
                        </div>
                    </a>
                    <div class="profile-dropdown">
                        <div class="dropdown-header">
                            <div class="profile-avatar-large" style="background-color: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; font-weight: bold; font-size: 22px; margin-right: 10px;">
                                ${userInitial}
                            </div>
                            <div class="user-info">
                                <div class="username">${username}</div>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="/profile/" class="dropdown-item">My Profile</a>
                        <a href="/profile/settings" class="dropdown-item">Settings</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-dropdown-item">Logout</a>
                    </div>
                `;
                
                navContainer.appendChild(profileContainer);
                
                // Add CSS styles for new profile elements
                const style = document.createElement('style');
                
                // Add click event to toggle dropdown
                const profileLink = profileContainer.querySelector('.profile-link');
                if (profileLink) {
                    profileLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        profileContainer.classList.toggle('active');
                    });
                }
                
                // Add click event to view profile link
                const viewProfileLink = profileContainer.querySelector('.view-profile-link');
                if (viewProfileLink) {
                    viewProfileLink.addEventListener('click', function() {
                        window.location.href = '/profile/';
                    });
                }
                
                // Add logout functionality to the dropdown logout item
                const logoutDropdownItem = profileContainer.querySelector('.logout-dropdown-item');
                if (logoutDropdownItem) {
                    logoutDropdownItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        localStorage.removeItem('access_token');
                        alert('You have been logged out.');
                        window.location.reload();
                    });
                }
            }
        } else {
            // User is not logged in
            if (loginButton) loginButton.style.display = 'inline-flex';
            if (registerButton) registerButton.style.display = 'inline-flex';
            if (logoutButton) logoutButton.style.display = 'none';
            
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer) profileContainer.remove();
        }
    }
    
    // Initialize header
    handleAuthState();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('active');
        }
    });
    
    // For debugging, you can add:
    console.log('Auth state handler initialized');
    console.log('Token exists:', !!localStorage.getItem('access_token'));
});