import {formatEventDates} from './post-format-code.js';

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

    formatEventDates();

  });