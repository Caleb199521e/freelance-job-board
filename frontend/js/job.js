// Job Details Page
let currentJob = null;

// Get job ID from URL
function getJobId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}

// Load job details
async function loadJobDetails() {
    const jobId = getJobId();
    
    if (!jobId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        currentJob = await API.getJob(jobId);
        console.log('RAW API RESPONSE:', currentJob);
        console.log('Proposals in response:', currentJob.proposals);
        console.log('Proposals length:', currentJob.proposals?.length);
        displayJobDetails(currentJob);
    } catch (error) {
        console.error('Error loading job:', error);
        document.getElementById('loadingState').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Failed to load job</h3>
                <p class="text-gray-600 mb-4">${error.message || 'Job not found'}</p>
                <a href="index.html" class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 inline-block">
                    <i class="fas fa-arrow-left mr-2"></i>Back to Jobs
                </a>
            </div>
        `;
    }
}

// Display job details
function displayJobDetails(job) {
    console.log('Displaying job details:', job);
    console.log('Current user:', Auth.getUser());
    
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('jobDetails').classList.remove('hidden');

    // Update page title
    document.title = `${job.title} - LinkUP`;

    // Job header
    document.getElementById('jobTitle').textContent = job.title;
    document.getElementById('companyName').textContent = job.client?.company?.name || job.client?.name || 'Anonymous';
    document.getElementById('jobLocation').textContent = job.location;
    document.getElementById('postedDate').textContent = formatDate(job.createdAt);
    document.getElementById('jobBudget').textContent = `GHS ${job.budget.toLocaleString()}`;
    document.getElementById('budgetType').textContent = job.budgetType === 'hourly' ? 'Per Hour' : 'Fixed Price';
    document.getElementById('jobCategory').textContent = job.category.replace('-', ' ').toUpperCase();
    document.getElementById('jobStatus').textContent = job.status.toUpperCase();
    document.getElementById('proposalCount').textContent = job.proposals?.length || 0;

    // Job description
    document.getElementById('jobDescription').innerHTML = job.description.replace(/\n/g, '<br>');

    // Skills
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = job.skillsRequired.map(skill => 
        `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">${skill}</span>`
    ).join('');

    // Check user role and ownership FIRST (needed for client info section)
    const user = Auth.getUser();
    const isJobOwner = user && user.role === 'client' && job.client && 
                       (job.client._id?.toString() === user.id?.toString() || 
                        job.client._id === user.id);
    
    console.log('Is job owner?', isJobOwner);
    console.log('User role:', user?.role);
    console.log('Job client ID:', job.client?._id);
    console.log('User ID:', user?.id);

    // Client info - only show for non-owners (freelancers/other users)
    if (job.client && !isJobOwner) {
        const clientName = document.getElementById('clientName');
        const memberSince = document.getElementById('memberSince');
        const clientInitials = document.getElementById('clientInitials');

        if (clientName) {
            clientName.textContent = job.client.name || 'Anonymous';
        }
        if (memberSince) {
            memberSince.textContent = `Member since ${new Date(job.client.createdAt).getFullYear()}`;
        }
        if (clientInitials) {
            const initials = job.client.name ? job.client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'C';
            clientInitials.textContent = initials;
        }
    } else if (isJobOwner) {
        // Hide client info section for job owner
        const clientInfoSection = document.querySelector('.bg-white.rounded-xl.shadow-sm.p-6:has(#clientName)');
        if (clientInfoSection) {
            clientInfoSection.style.display = 'none';
        }
    }

    // Job info sidebar
    const infoCategory = document.getElementById('infoCategory');
    const infoLocation = document.getElementById('infoLocation');
    const infoBudgetType = document.getElementById('infoBudgetType');
    const infoDeadline = document.getElementById('infoDeadline');
    const infoProposals = document.getElementById('infoProposals');

    if (infoCategory) infoCategory.textContent = job.category.replace('-', ' ').toUpperCase();
    if (infoLocation) infoLocation.textContent = job.location || 'Not specified';
    if (infoBudgetType) infoBudgetType.textContent = job.budgetType === 'hourly' ? 'Per Hour' : 'Fixed Price';
    if (infoProposals) infoProposals.textContent = job.proposals?.length || 0;
    
    if (infoDeadline && job.deadline) {
        const deadline = new Date(job.deadline);
        infoDeadline.textContent = deadline.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } else if (infoDeadline) {
        infoDeadline.textContent = 'Not specified';
    }

    // Handle apply button and proposals display
    const applyButton = document.getElementById('applyButton');
    const applyCard = document.getElementById('applyCard');
    
    if (isJobOwner) {
        // Show proposals instead of apply card for job owner
        if (applyCard) applyCard.style.display = 'none';
        displayProposals(job.proposals || []);
    } else if (applyButton) {
        if (!user) {
            applyButton.textContent = 'Login to Apply';
            applyButton.onclick = () => window.location.href = 'login.html';
        } else if (user.role !== 'freelancer') {
            applyButton.textContent = 'Only Freelancers Can Apply';
            applyButton.disabled = true;
            applyButton.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
            applyButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        } else if (job.status !== 'open') {
            applyButton.textContent = 'Job Closed';
            applyButton.disabled = true;
            applyButton.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
            applyButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        } else {
            applyButton.onclick = submitProposal;
        }
    }
}

// Display proposals for client
function displayProposals(proposals) {
    console.log('displayProposals called with:', proposals);
    const applyCard = document.getElementById('applyCard');
    console.log('applyCard element:', applyCard);
    
    if (!applyCard) {
        console.error('applyCard element not found!');
        return;
    }

    // Create proposals section
    const proposalsSection = document.createElement('div');
    proposalsSection.className = 'bg-white rounded-xl shadow-sm p-6';
    proposalsSection.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">
            <i class="fas fa-file-alt text-emerald-600 mr-2"></i>
            Proposals Received (${proposals.length})
        </h3>
        <div id="proposalsList">
            ${proposals.length === 0 ? `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>No proposals yet</p>
                </div>
            ` : proposals.map(proposal => `
                <div class="border-b border-gray-200 last:border-0 py-4">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span class="text-emerald-600 font-semibold">
                                    ${proposal.freelancer?.name?.charAt(0).toUpperCase() || 'F'}
                                </span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900">${proposal.freelancer?.name || 'Anonymous'}</h4>
                                <p class="text-xs text-gray-500">
                                    ${proposal.freelancer?.profile?.title || 'Freelancer'}
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-emerald-600">GHS ${proposal.bidAmount?.toLocaleString() || 0}</div>
                            <div class="text-xs text-gray-500">${proposal.estimatedTime || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3 mb-3">
                        <p class="text-sm text-gray-700">${proposal.coverLetter || 'No cover letter provided'}</p>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">
                            <i class="fas fa-clock mr-1"></i>
                            Submitted ${formatDate(proposal.createdAt || new Date())}
                        </span>
                        <div class="flex space-x-2">
                            ${proposal.status === 'pending' ? `
                                <button onclick="updateProposalStatus('${proposal._id}', 'accepted')" 
                                        class="bg-emerald-600 text-white px-4 py-1 rounded text-sm hover:bg-emerald-700">
                                    <i class="fas fa-check mr-1"></i>Accept
                                </button>
                                <button onclick="updateProposalStatus('${proposal._id}', 'rejected')" 
                                        class="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700">
                                    <i class="fas fa-times mr-1"></i>Reject
                                </button>
                            ` : `
                                <span class="px-4 py-1 rounded text-sm ${
                                    proposal.status === 'accepted' 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-red-100 text-red-800'
                                }">
                                    ${proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1)}
                                </span>
                            `}
                        </div>
                    </div>
                    ${proposal.freelancer?.profile?.skills?.length ? `
                        <div class="mt-3 flex flex-wrap gap-2">
                            ${proposal.freelancer.profile.skills.slice(0, 5).map(skill => 
                                `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${skill}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;

    // Replace apply card with proposals section
    applyCard.parentNode.replaceChild(proposalsSection, applyCard);
}

// Update proposal status (accept/reject)
async function updateProposalStatus(proposalId, status) {
    if (!confirm(`Are you sure you want to ${status} this proposal?`)) {
        return;
    }

    try {
        await API.request(`/proposals/${proposalId}/status`, {
            method: 'PUT',
            body: { status }
        });

        showToast(`Proposal ${status} successfully!`, 'success');
        
        // Reload page to show updated status
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error updating proposal status:', error);
        showToast(error.message || 'Failed to update proposal', 'error');
    }
}

// Make function globally available for onclick handlers
window.updateProposalStatus = updateProposalStatus;

// Submit proposal
async function submitProposal(event) {
    if (event) event.preventDefault();

    const coverLetter = document.getElementById('coverLetter')?.value;
    const bidAmount = document.getElementById('bidAmount')?.value;
    const estimatedTime = document.getElementById('estimatedTime')?.value;

    if (!coverLetter || !coverLetter.trim()) {
        showToast('Please write a cover letter', 'warning');
        return;
    }

    if (!bidAmount || bidAmount <= 0) {
        showToast('Please enter a valid bid amount', 'warning');
        return;
    }

    if (!estimatedTime || !estimatedTime.trim()) {
        showToast('Please enter estimated time', 'warning');
        return;
    }

    try {
        const applyButton = document.getElementById('applyButton');
        applyButton.disabled = true;
        applyButton.textContent = 'Submitting...';

        await API.submitProposal(currentJob._id, {
            coverLetter: coverLetter.trim(),
            bidAmount: parseFloat(bidAmount),
            estimatedTime: estimatedTime.trim()
        });

        showToast('Proposal submitted successfully!', 'success');
        
        // Reload job details to show updated proposal count
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('Error submitting proposal:', error);
        showToast(error.message || 'Failed to submit proposal', 'error');
        
        const applyButton = document.getElementById('applyButton');
        applyButton.disabled = false;
        applyButton.textContent = 'Submit Proposal';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadJobDetails();
});
