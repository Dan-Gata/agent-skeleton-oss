// Authentication helper functions
(function() {
    'use strict';
    
    // Check authentication status
    window.checkAuth = async function() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                return { authenticated: true, user };
            } else {
                return { authenticated: false };
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return { authenticated: false };
        }
    };
    
    // Logout function
    window.logout = async function() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok || response.redirected) {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };
    
    // Get current user
    window.getCurrentUser = async function() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    };
    
    console.log('✅ Auth helper loaded');
})();
