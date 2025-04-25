import { formatEventDates } from './post-format-code.js';
import { getUserId } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.profile-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    function toggleSidebar() {
      sidebar.classList.toggle('active');
      sidebarToggle.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Prevent body scrolling when sidebar is open
      if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    // Event listeners for sidebar toggle
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (overlay) {
      overlay.addEventListener('click', toggleSidebar);
    }
    
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    function toggleMobileMenu() {
      mobileMenuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    }
    
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Deactivate all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activate clicked tab
        button.classList.add('active');
        const tabId = `${button.getAttribute('data-tab')}-tab`;
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Close mobile menu on window resize if screen becomes larger
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });

    // Check if the settings link should be visible
    checkSettingsLinkVisibility();
    
    formatEventDates();
});

// Function to check if the settings link should be visible
async function checkSettingsLinkVisibility() {
    try {
        // Get the profile user ID from the URL path
        // Example: /user/profile/123 -> extract 123
        const pathParts = window.location.pathname.split('/');
        const profileUserId = pathParts[pathParts.length - 1];
        
        // Alternative: get user ID from a script tag if available
        // Look for an embedded script tag with current_user_id
        const scriptTags = document.querySelectorAll('script[type="module"]');
        let isOwnProfile = false;
        
        // Check if there's a conditional script tag for profile editing
        // This indicates it's the user's own profile
        for (const script of scriptTags) {
            if (script.src.includes('profile-edit.js')) {
                isOwnProfile = true;
                break;
            }
        }
        
        // If we don't have confirmation from script tags, check with the auth service
        if (!isOwnProfile) {
            try {
                const currentUserId = await getUserId();
                // Convert both IDs to strings for comparison
                isOwnProfile = String(currentUserId) === String(profileUserId);
            } catch (error) {
                console.error('Error getting current user ID:', error);
                isOwnProfile = false;
            }
        }
        
        // Hide settings link if not viewing own profile
        if (!isOwnProfile) {
            const settingsLink = document.querySelector('.sidebar-nav-item[href="/auth/settings"]');
            if (settingsLink) {
                settingsLink.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking profile ownership:', error);
    }
}