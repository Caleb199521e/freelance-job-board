// Dashboard-specific functionality
class Dashboard {
    static async loadDashboard() {
        console.log('Loading dashboard...');
        const user = AuthManager.checkAuth();
        
        console.log('User from checkAuth:', user);
        
        if (!user) {
            console.error('No user found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        try {
            console.log('Fetching dashboard data for role:', user.role);
            const data = await API.getDashboard();
            console.log('Dashboard data received:', data);
            
            if (user.role === 'freelancer') {
                this.renderFreelancerDashboard(data);
            } else {
                this.renderClientDashboard(data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            console.error('Error details:', error.message);
            this.showError('Failed to load dashboard data: ' + error.message);
        }
    }

    static renderFreelancerDashboard(data) {
        const dashboardEl = document.getElementById('dashboardContent');
        
        dashboardEl.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Applied Jobs</p>
                            <p class="text-2xl font-bold text-gray-900">${data.appliedJobs?.length || 0}</p>
                        </div>
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-briefcase text-emerald-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Active Proposals</p>
                            <p class="text-2xl font-bold text-gray-900">${this.countActiveProposals(data.appliedJobs)}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-paper-plane text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Profile Views</p>
                            <p class="text-2xl font-bold text-gray-900">0</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-eye text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Recent Applications</h3>
                    ${this.renderAppliedJobs(data.appliedJobs)}
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4">Recommended Jobs</h3>
                    ${this.renderRecommendedJobs()}
                </div>
            </div>
        `;
    }

    static renderClientDashboard(data) {
        const dashboardEl = document.getElementById('dashboardContent');
        
        dashboardEl.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Posted Jobs</p>
                            <p class="text-2xl font-bold text-gray-900">${data.myJobs?.length || 0}</p>
                        </div>
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-briefcase text-emerald-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Total Proposals</p>
                            <p class="text-2xl font-bold text-gray-900">${this.countTotalProposals(data.myJobs)}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-users text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Active Jobs</p>
                            <p class="text-2xl font-bold text-gray-900">${this.countActiveJobs(data.myJobs)}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Hired Freelancers</p>
                            <p class="text-2xl font-bold text-gray-900">0</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-handshake text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold">Your Job Postings</h3>
                    <a href="post-job.html" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200 font-medium">
                        <i class="fas fa-plus mr-2"></i>Post New Job
                    </a>
                </div>
                ${this.renderClientJobs(data.myJobs)}
            </div>
        `;
    }

    static countActiveProposals(jobs) {
        if (!jobs) return 0;
        return jobs.filter(job => 
            job.proposals?.some(p => p.freelancer?._id === AuthManager.checkAuth()?.id && p.status === 'pending')
        ).length;
    }

    static countTotalProposals(jobs) {
        if (!jobs) return 0;
        return jobs.reduce((total, job) => total + (job.proposals?.length || 0), 0);
    }

    static countActiveJobs(jobs) {
        if (!jobs) return 0;
        return jobs.filter(job => job.status === 'open').length;
    }

    static renderAppliedJobs(jobs) {
        if (!jobs || jobs.length === 0) {
            return '<p class="text-gray-600 text-center py-4">You haven\'t applied to any jobs yet.</p>';
        }

        return jobs.slice(0, 5).map(job => `
            <div class="border-b border-gray-200 py-4 last:border-b-0">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-gray-900">${job.title}</h4>
                        <p class="text-sm text-gray-600">${job.client?.name || 'Unknown Client'}</p>
                    </div>
                    <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                        GHS ${job.budget}
                    </span>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-sm text-gray-500">
                        Applied ${new Date(job.proposals?.[0]?.createdAt).toLocaleDateString()}
                    </span>
                    <span class="text-sm ${this.getStatusColor(job.proposals?.[0]?.status)}">
                        ${job.proposals?.[0]?.status || 'pending'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    static getStatusColor(status) {
        const colors = {
            pending: 'text-yellow-600',
            accepted: 'text-green-600',
            rejected: 'text-red-600'
        };
        return colors[status] || 'text-gray-600';
    }

    static renderRecommendedJobs() {
        return `
            <p class="text-gray-600 text-center py-4">
                Browse available jobs to find opportunities that match your skills.
            </p>
            <a href="index.html#jobs" class="block text-center bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200 font-medium mt-4">
                Browse Jobs
            </a>
        `;
    }

    static renderClientJobs(jobs) {
        if (!jobs || jobs.length === 0) {
            return `
                <p class="text-gray-600 text-center py-8">
                    You haven't posted any jobs yet. Create your first job posting to start receiving proposals.
                </p>
            `;
        }

        return `
            <div class="space-y-4">
                ${jobs.map(job => `
                    <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h4 class="text-lg font-semibold text-gray-900 mb-2">${job.title}</h4>
                                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${job.description}</p>
                                
                                <div class="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    <span class="flex items-center">
                                        <i class="fas fa-map-marker-alt mr-1"></i>
                                        ${job.location}
                                    </span>
                                    <span class="flex items-center">
                                        <i class="fas fa-folder mr-1"></i>
                                        ${job.category}
                                    </span>
                                    <span class="flex items-center">
                                        <i class="fas fa-calendar mr-1"></i>
                                        ${new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div class="flex items-center space-x-4">
                                    <span class="text-xl font-bold text-emerald-600">GHS ${job.budget}</span>
                                    <span class="text-sm text-gray-600">
                                        <i class="fas fa-users mr-1"></i>
                                        ${job.proposalCount || job.proposals?.length || 0} proposals
                                    </span>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium ${this.getJobStatusClass(job.status)}">
                                        ${job.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="ml-4">
                                <a href="job.html?id=${job._id}" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition duration-200 font-medium text-sm">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static getJobStatusClass(status) {
        const classes = {
            open: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            completed: 'bg-blue-100 text-blue-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    static showError(message) {
        const dashboardEl = document.getElementById('dashboardContent');
        dashboardEl.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
                <p class="text-gray-600">${message}</p>
                <button onclick="location.reload()" class="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition duration-200">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        Dashboard.loadDashboard();
    }
});

