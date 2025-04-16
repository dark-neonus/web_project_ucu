import {isAuthenticated, redirectToLogin, getUserData } from '/src/js/auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const headerContainer = document.querySelector('.header-container');
    const loginButton = document.querySelector('.login-button');
    const registerButton = document.querySelector('.register-button');
    const logoutButton = document.querySelector('.logout-button');
    const navContainer = document.querySelector('.auth-links');
    
    // Define color palette for user avatars
    const avatarColors = ['#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#1abc9c', '#d35400'];
    
    // Handle authentication state
    async function handleAuthState() {
        try {
            if (isAuthenticated()) {
                // User is logged in
                hideLoginElements();
                await createProfileElement();
            } else {
                // User is not logged in
                showLoginElements();
                removeProfileElement();
                
                // Check if we're on a protected page and redirect if needed
                const requiresAuth = document.body.hasAttribute('data-requires-auth');
                if (requiresAuth) {
                    redirectToLogin();
                }
            }
        } catch (error) {
            console.error('Error handling authentication state:', error);
            // Handle error gracefully - maybe display a notification
        }
    }
    
    function hideLoginElements() {
        if (loginButton) loginButton.style.display = 'none';
        if (registerButton) registerButton.style.display = 'none';
    }
    
    function showLoginElements() {
        if (loginButton) loginButton.style.display = 'inline-flex';
        if (registerButton) registerButton.style.display = 'inline-flex';
        if (logoutButton) logoutButton.style.display = 'none';
    }
    
    function removeProfileElement() {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) profileContainer.remove();
    }
    
    async function createProfileElement() {
        // Skip if profile element already exists or navigation container is missing
        let profileContainer = document.querySelector('.profile-container');
        if (profileContainer || !navContainer) return;
        
        try {
            // Get user data from API instead of parsing token
            const userData = await getUserData();
            const username = userData.first_name || 'User';
            const userId = userData.id;
            
            // Get user's first initial for the avatar with proper handling
            const userInitial = username[0].toUpperCase() || '?';
            
            // Generate background color based on username
            const bgColor = getAvatarColor(username);
            
            // Create profile container
            profileContainer = document.createElement('div');
            profileContainer.className = 'profile-container';
            
            // Set HTML for profile dropdown
            profileContainer.innerHTML = createProfileHTML(userId, bgColor, userInitial, username);
            
            // Add to DOM
            navContainer.appendChild(profileContainer);
            
            // Setup event listeners
            setupProfileEvents(profileContainer);
            
        } catch (error) {
            console.error('Error creating profile element:', error);
            
            // If we can't get the user data, log them out as fallback
            if (error.message && error.message.includes('Authentication expired')) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                showLoginElements();
            }
        }
    }
    
    function getAvatarColor(username) {
        // Generate a consistent background color based on username
        let colorIndex = 0;
        if (username && username.length > 0) {
            colorIndex = Math.abs(username.charCodeAt(0)) % avatarColors.length;
        }
        return avatarColors[colorIndex];
    }
    
    function createProfileHTML(userId, bgColor, userInitial, username) {
        const profileLink = `/auth/profile/${userId}`;
        
        return `
            <a href="${profileLink}" class="profile-link">
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
                        <div class="username">User</div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="${profileLink}" class="dropdown-item">My Profile</a>
                <a href="/auth/settings" class="dropdown-item">Settings</a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-dropdown-item">Logout</a>
            </div>
        `;
    }
    
    function setupProfileEvents(profileContainer) {
        // Add click event to toggle dropdown
        const profileLinkElement = profileContainer.querySelector('.profile-link');
        if (profileLinkElement) {
            profileLinkElement.addEventListener('click', handleProfileClick);
        }
        
        // Add logout functionality to the dropdown logout item
        const logoutDropdownItem = profileContainer.querySelector('.logout-dropdown-item');
        if (logoutDropdownItem) {
            logoutDropdownItem.addEventListener('click', handleLogout);
        }
    }
    
    function handleProfileClick(e) {
        e.preventDefault();
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.classList.toggle('active');
        }
    }
    
    function handleLogout(e) {
        e.preventDefault();
        
        // Remove tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Show notification - using custom notification instead of alert
        showNotification('You have been logged out successfully.');
        
        // Reload the page
        window.location.reload();
    }
    
    function showNotification(message) {
        // Create a nicer notification element instead of using alert()
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Fade out and remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Initialize authentication state
    handleAuthState();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('active');
        }
    });
});