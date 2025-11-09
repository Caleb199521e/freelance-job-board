// Toast Notification System
class Toast {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        if (document.getElementById('toastContainer')) return;
        
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const toastId = `toast-${Date.now()}`;
        toast.id = toastId;
        
        // Toast colors and icons based on type
        const styles = {
            success: {
                bg: 'bg-emerald-600',
                icon: 'fa-check-circle',
                iconColor: 'text-white'
            },
            error: {
                bg: 'bg-red-600',
                icon: 'fa-exclamation-circle',
                iconColor: 'text-white'
            },
            warning: {
                bg: 'bg-yellow-500',
                icon: 'fa-exclamation-triangle',
                iconColor: 'text-white'
            },
            info: {
                bg: 'bg-blue-600',
                icon: 'fa-info-circle',
                iconColor: 'text-white'
            }
        };

        const style = styles[type] || styles.info;

        toast.className = `${style.bg} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out translate-x-full opacity-0 flex items-center space-x-3`;
        
        toast.innerHTML = `
            <i class="fas ${style.icon} ${style.iconColor} text-xl"></i>
            <span class="flex-1">${message}</span>
            <button onclick="window.toastSystem.hide('${toastId}')" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        }, 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }
    }

    hide(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// Create global toast instance
window.toastSystem = new Toast();

// Convenience global function
window.showToast = (message, type = 'info', duration = 3000) => {
    window.toastSystem.show(message, type, duration);
};


