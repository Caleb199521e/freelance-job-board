// Auth utilities
class Auth {
    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// API utilities
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const token = Auth.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // Only redirect if not already on login/signup page
                    if (!window.location.href.includes('login.html') && 
                        !window.location.href.includes('signup.html') &&
                        !window.location.href.includes('index.html')) {
                        showToast('Session expired. Please log in again.', 'warning');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    }
                }
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async getJobs(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        return this.request(`/jobs?${params}`);
    }

    static async getJob(id) {
        return this.request(`/jobs/${id}`);
    }

    static async submitProposal(jobId, proposal) {
        return this.request(`/jobs/${jobId}/proposals`, {
            method: 'POST',
            body: proposal
        });
    }

    static async postJob(jobData) {
        return this.request('/jobs', {
            method: 'POST',
            body: jobData
        });
    }

    static async getDashboard() {
        const user = Auth.getUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Fetch dashboard data based on user role
        if (user.role === 'freelancer') {
            // For freelancers, get their proposals
            const proposals = await this.request('/proposals/my-proposals');
            return {
                appliedJobs: proposals.proposals || [],
                role: 'freelancer'
            };
        } else {
            // For clients, get their posted jobs
            const response = await this.request('/jobs/client/my-jobs');
            return {
                myJobs: response.jobs || [],
                role: 'client'
            };
        }
    }
}

// Job card component
function createJobCard(job) {
    const proposalCount = job.proposals ? job.proposals.length : 0;
    
    return `
        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">${job.title}</h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-2">${job.description}</p>
                    </div>
                    <span class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${job.budgetType === 'hourly' ? 'GHS/hr' : 'Fixed'}
                    </span>
                </div>

                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <span class="flex items-center">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            ${job.location}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-folder mr-1"></i>
                            ${job.category}
                        </span>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-2xl font-bold text-emerald-600">GHS ${job.budget}</span>
                        <div class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-users mr-1"></i>${proposalCount} proposal${proposalCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <a href="job.html?id=${job._id}" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200 font-medium text-sm">
                        View Job
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Load statistics
async function loadStats() {
    try {
        const stats = await API.request('/jobs/stats');
        document.getElementById('jobsCount').textContent = stats.jobs || 0;
        document.getElementById('freelancersCount').textContent = stats.freelancers || 0;
        document.getElementById('clientsCount').textContent = stats.clients || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
        // Keep default 0 values if stats fail to load
    }
}

// Load jobs on homepage
async function loadHomepageJobs() {
    try {
        const response = await API.getJobs({ status: 'open' });
        const jobs = response.jobs || response || [];
        const jobsGrid = document.getElementById('jobsGrid');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        loadingState.classList.add('hidden');

        if (jobs.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        jobsGrid.innerHTML = jobs.slice(0, 6).map(createJobCard).join('');
        
        // Load real statistics
        loadStats();

    } catch (error) {
        console.error('Error loading jobs:', error);
        const loadingState = document.getElementById('loadingState');
        loadingState.classList.add('hidden');
        
        if (window.showToast) {
            showToast('Failed to load jobs. Please try again later.', 'error');
        }
        
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('emptyState').innerHTML = `
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Failed to load jobs</h3>
            <p class="text-gray-600 mb-4">${error.message || 'Please try again later.'}</p>
            <button onclick="loadHomepageJobs()" class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        `;
    }
}

// Filter jobs function
async function filterJobs() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;

    const filters = {};
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (location) filters.location = location;

    try {
        const jobs = await API.getJobs(filters);
        const jobsGrid = document.getElementById('jobsGrid');
        
        if (jobs.length === 0) {
            jobsGrid.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">No jobs match your filters</h3>
                    <p class="text-gray-600">Try adjusting your search criteria</p>
                </div>
            `;
        } else {
            jobsGrid.innerHTML = jobs.map(createJobCard).join('');
        }
    } catch (error) {
        console.error('Error filtering jobs:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        loadHomepageJobs();
    }
});

