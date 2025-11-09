// Authentication-specific functionality
class AuthManager {
    static checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            // Avoid redirect loop: only redirect to login page when the current
            // page is not already a public auth page (login, signup, index).
            try {
                const path = window.location.pathname || '';
                const lower = path.toLowerCase();
                const isAuthPage = lower.endsWith('login.html') || lower.endsWith('signup.html') || lower.endsWith('index.html') || lower === '/';

                if (!isAuthPage) {
                    window.location.href = 'login.html';
                }
            } catch (e) {
                // If anything goes wrong (e.g., no window), don't attempt redirect
            }

            return null;
        }
        
        return JSON.parse(user);
    }

    static checkRole(allowedRoles) {
        const user = this.checkAuth();
        if (!user || !allowedRoles.includes(user.role)) {
            window.location.href = 'dashboard.html';
            return null;
        }
        return user;
    }

    static setupNavbar() {
        const user = AuthManager.checkAuth();
        if (user) {
            // Update desktop navbar with user info
            const navAuth = document.getElementById('navAuth');
            if (navAuth) {
                navAuth.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <a href="dashboard.html" class="text-gray-700 hover:text-emerald-600">
                            <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                        </a>
                        ${user.role === 'client' ? `
                            <a href="freelancers.html" class="text-gray-700 hover:text-emerald-600">
                                <i class="fas fa-users mr-1"></i>Browse Freelancers
                            </a>
                        ` : ''}
                        <div class="relative">
                            <button id="notificationButton" class="relative text-gray-700 hover:text-emerald-600 p-2">
                                <i class="fas fa-bell text-xl"></i>
                                <span id="notificationBadge" class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden">0</span>
                            </button>
                            <div id="notificationDropdown" class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 hidden z-50 max-h-96 overflow-y-auto">
                                <div class="px-4 py-2 border-b border-gray-200">
                                    <h3 class="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div id="notificationList" class="divide-y divide-gray-100">
                                    <div class="px-4 py-3 text-center text-gray-500 text-sm">
                                        No new notifications
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button id="userMenuButton" class="flex items-center space-x-2 text-gray-700 hover:text-emerald-600">
                                <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span class="text-emerald-600 font-semibold text-sm">
                                        ${user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span>${user.name}</span>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </button>
                            <div id="userDropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden z-50">
                                <a href="profile.html" class="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                                    <i class="fas fa-user mr-2"></i>Profile
                                </a>
                                <button onclick="AuthManager.logout()" class="w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Update mobile navbar with user info
                const mobileNavAuth = document.getElementById('mobileNavAuth');
                if (mobileNavAuth) {
                    mobileNavAuth.innerHTML = `
                        <div class="flex items-center space-x-3 px-3 py-3 border-b border-gray-200">
                            <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span class="text-emerald-600 font-semibold">
                                    ${user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">${user.name}</p>
                                <p class="text-xs text-gray-500">${user.email}</p>
                            </div>
                        </div>
                        <a href="dashboard.html" class="block text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200">
                            <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                        </a>
                        ${user.role === 'client' ? `
                            <a href="freelancers.html" class="block text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200">
                                <i class="fas fa-users mr-2"></i>Browse Freelancers
                            </a>
                        ` : ''}
                        <a href="profile.html" class="block text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200">
                            <i class="fas fa-user mr-2"></i>Profile
                        </a>
                        <button onclick="AuthManager.logout()" class="w-full text-left text-gray-700 hover:text-emerald-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition duration-200">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout
                        </button>
                    `;
                }
                
                // Add click event listener to toggle user dropdown
                const menuButton = document.getElementById('userMenuButton');
                const dropdown = document.getElementById('userDropdown');
                
                if (menuButton && dropdown) {
                    menuButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.classList.toggle('hidden');
                        // Close notification dropdown if open
                        const notifDropdown = document.getElementById('notificationDropdown');
                        if (notifDropdown) notifDropdown.classList.add('hidden');
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!menuButton.contains(e.target) && !dropdown.contains(e.target)) {
                            dropdown.classList.add('hidden');
                        }
                    });
                }

                // Add click event listener for notification dropdown
                const notificationButton = document.getElementById('notificationButton');
                const notificationDropdown = document.getElementById('notificationDropdown');
                
                if (notificationButton && notificationDropdown) {
                    notificationButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        notificationDropdown.classList.toggle('hidden');
                        // Close user dropdown if open
                        if (dropdown) dropdown.classList.add('hidden');
                        // Mark notifications as read when opened
                        AuthManager.markNotificationsAsRead();
                    });
                    
                    // Close notification dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!notificationButton.contains(e.target) && !notificationDropdown.contains(e.target)) {
                            notificationDropdown.classList.add('hidden');
                        }
                    });
                }

                // Load notifications
                AuthManager.loadNotifications();
            }
        }
    }

    static async loadNotifications() {
        const user = AuthManager.checkAuth();
        if (!user) return;

        try {
            // Fetch real notifications from API
            const response = await API.request('/notifications?limit=10');
            const notifications = response.notifications || [];
            
            const notificationList = document.getElementById('notificationList');
            const notificationBadge = document.getElementById('notificationBadge');
            
            if (notificationList) {
                if (notifications.length === 0) {
                    notificationList.innerHTML = `
                        <div class="px-4 py-3 text-center text-gray-500 text-sm">
                            No new notifications
                        </div>
                    `;
                } else {
                    notificationList.innerHTML = notifications.map(notif => `
                        <a href="${notif.link || '#'}" class="block px-4 py-3 hover:bg-gray-50 ${notif.read ? 'opacity-60' : ''}" onclick="AuthManager.markNotificationAsRead('${notif._id}')">
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <i class="${notif.icon} text-${notif.color}-500"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900">${notif.title}</p>
                                    <p class="text-xs text-gray-500 mt-1">${notif.message}</p>
                                    <p class="text-xs text-gray-400 mt-1">${AuthManager.formatNotificationTime(notif.createdAt)}</p>
                                </div>
                            </div>
                        </a>
                    `).join('');
                }
            }
            
            // Update badge with real unread count
            const unreadCount = response.unreadCount || 0;
            if (notificationBadge) {
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                    notificationBadge.classList.remove('hidden');
                } else {
                    notificationBadge.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Fall back to showing empty state
            const notificationList = document.getElementById('notificationList');
            if (notificationList) {
                notificationList.innerHTML = `
                    <div class="px-4 py-3 text-center text-gray-500 text-sm">
                        No new notifications
                    </div>
                `;
            }
        }
    }

    static formatNotificationTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    static async markNotificationAsRead(notificationId) {
        try {
            await API.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
            // Reload notifications to update UI
            AuthManager.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    static getMockNotifications(user) {
        // Removed - using real API now
        return [];
    }

    static async markNotificationsAsRead() {
        try {
            // Don't mark all as read anymore, just hide badge temporarily
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                notificationBadge.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.setupNavbar();
});