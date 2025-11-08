// WebSocket client for real-time notifications
let socket = null;

class WebSocketClient {
    static connect() {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Load socket.io from CDN
        if (typeof io === 'undefined') {
            console.log('Socket.IO not loaded yet, will try again...');
            return;
        }

        try {
            socket = io(API_BASE.replace('/api', ''), {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                console.log('✅ WebSocket connected');
            });

            socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
            });

            socket.on('notification', (notification) => {
                console.log('📬 New notification received:', notification);
                
                // Play notification sound (optional)
                WebSocketClient.playNotificationSound();
                
                // Show toast notification
                if (window.showToast) {
                    showToast(notification.title, 'info', 5000);
                }
                
                // Update notification badge and list
                if (typeof AuthManager !== 'undefined') {
                    AuthManager.loadNotifications();
                }
            });

            socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error.message);
            });

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }

    static disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }

    static playNotificationSound() {
        // Optional: play a subtle notification sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OZTA0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OZTA0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OZTA0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OZTA0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizsIHGe56+OYSg0PUqzn77BdGAg+ltryxnMpBSuAy/LZizw');
            audio.volume = 0.3;
            audio.play().catch(err => {
                // Ignore errors if browser blocks autoplaying audio
            });
        } catch (err) {
            // Ignore sound errors
        }
    }

    static emit(event, data) {
        if (socket && socket.connected) {
            socket.emit(event, data);
        }
    }
}

// Auto-connect when user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for socket.io CDN to load
    setTimeout(() => {
        if (Auth.isAuthenticated()) {
            WebSocketClient.connect();
        }
    }, 1000);
});

// Disconnect on logout
window.addEventListener('beforeunload', () => {
    WebSocketClient.disconnect();
});
