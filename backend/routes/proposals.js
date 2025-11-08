import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import NotificationService from '../utils/notificationService.js';

const router = express.Router();

// @route   POST /api/jobs/:id/proposals
// @desc    Submit a proposal for a job
// @access  Private (Freelancers only)
router.post('/jobs/:id/proposals', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can submit proposals' });
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting proposals' });
    }

    if (job.client.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot apply to your own job' });
    }

    // Check if deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({ message: 'The deadline for this job has passed' });
    }

    // Check if already applied
    const existingProposal = job.proposals.find(
      p => p.freelancer.toString() === req.user._id.toString()
    );

    if (existingProposal) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const { coverLetter, bidAmount, estimatedTime } = req.body;

    // Validation
    if (!coverLetter || !bidAmount) {
      return res.status(400).json({ message: 'Cover letter and bid amount are required' });
    }

    if (coverLetter.length < 50) {
      return res.status(400).json({ message: 'Cover letter must be at least 50 characters long' });
    }

    const proposal = {
      freelancer: req.user._id,
      coverLetter,
      bidAmount: parseFloat(bidAmount),
      estimatedTime,
      status: 'pending'
    };

    job.proposals.push(proposal);
    await job.save();

    // Populate the new proposal for response
    await job.populate('proposals.freelancer', 'name profile');

    const newProposal = job.proposals[job.proposals.length - 1];

    // Send notification to client
    await NotificationService.notifyProposalReceived(
      job.client,
      job.title,
      req.user.name,
      job._id
    );

    res.status(201).json({
      message: 'Proposal submitted successfully!',
      proposal: newProposal
    });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id/proposals
// @desc    Get proposals for a job (Job owner only)
// @access  Private
router.get('/:id/proposals', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('proposals.freelancer', 'name email profile createdAt');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job or is admin
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      proposals: job.proposals,
      total: job.proposals.length
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/proposals/my-proposals
// @desc    Get freelancer's proposals
// @access  Private (Freelancers only)
router.get('/proposals/my-proposals', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can access this endpoint' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = { 'proposals.freelancer': req.user._id };
    
    if (status && status !== 'all') {
      filter['proposals.status'] = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(filter)
      .populate('client', 'name profile company')
      .sort({ 'proposals.createdAt': -1 });

    // Extract and format jobs with the freelancer's proposal
    const jobsWithProposals = jobs
      .map(job => {
        const freelancerProposal = job.proposals.find(
          proposal => proposal.freelancer.toString() === req.user._id.toString()
        );
        
        if (!freelancerProposal) return null;
        
        return {
          _id: job._id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          budgetType: job.budgetType,
          location: job.location,
          category: job.category,
          status: job.status,
          skillsRequired: job.skillsRequired,
          createdAt: job.createdAt,
          client: job.client,
          proposals: [freelancerProposal] // Include the freelancer's proposal
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.proposals[0].createdAt) - new Date(a.proposals[0].createdAt));

    const total = jobsWithProposals.length;
    const paginatedJobs = jobsWithProposals.slice(skip, skip + limitNum);

    res.json({
      proposals: paginatedJobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProposals: total
      }
    });
  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/jobs/:jobId/proposals/:proposalId/status
// @desc    Update proposal status (accept/reject)
// @access  Private (Job owner only)
router.patch('/:jobId/proposals/:proposalId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const proposal = job.proposals.id(req.params.proposalId);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // If accepting a proposal, reject all others
    if (status === 'accepted') {
      job.proposals.forEach(p => {
        if (p._id.toString() !== req.params.proposalId && p.status === 'pending') {
          p.status = 'rejected';
        }
      });

      // Close the job
      job.status = 'closed';
    }

    proposal.status = status;
    await job.save();

    // Populate for response
    await job.populate('proposals.freelancer', 'name profile');

    res.json({
      message: `Proposal ${status} successfully`,
      proposal: job.proposals.id(req.params.proposalId),
      job
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/proposals/stats
// @desc    Get proposal statistics for freelancer
// @access  Private (Freelancers only)
router.get('/proposals/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can access this endpoint' });
    }

    const jobs = await Job.find({ 'proposals.freelancer': req.user._id });

    const stats = {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0
    };

    jobs.forEach(job => {
      job.proposals.forEach(proposal => {
        if (proposal.freelancer.toString() === req.user._id.toString()) {
          stats.total++;
          stats[proposal.status]++;
        }
      });
    });

    // Calculate acceptance rate
    stats.acceptanceRate = stats.total > 0 ? (stats.accepted / stats.total * 100).toFixed(1) : 0;

    res.json(stats);
  } catch (error) {
    console.error('Get proposal stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/jobs/:jobId/proposals/:proposalId
// @desc    Withdraw a proposal
// @access  Private (Proposal owner only)
router.delete('/:jobId/proposals/:proposalId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const proposal = job.proposals.id(req.params.proposalId);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if user owns the proposal
    if (proposal.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only withdraw pending proposals
    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'You can only withdraw pending proposals' });
    }

    job.proposals.pull({ _id: req.params.proposalId });
    await job.save();

    res.json({ message: 'Proposal withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/proposals/:proposalId
// @desc    Get single proposal details
// @access  Private
router.get('/proposals/:proposalId', auth, async (req, res) => {
  try {
    const job = await Job.findOne({ 'proposals._id': req.params.proposalId })
      .populate('client', 'name profile company')
      .populate('proposals.freelancer', 'name profile');

    if (!job) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const proposal = job.proposals.id(req.params.proposalId);

    // Check if user has access to this proposal
    const canAccess = 
      req.user.role === 'client' && job.client._id.toString() === req.user._id.toString() ||
      req.user.role === 'freelancer' && proposal.freelancer._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      proposal: {
        ...proposal.toObject(),
        job: {
          _id: job._id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          budgetType: job.budgetType,
          category: job.category,
          location: job.location,
          client: job.client
        }
      }
    });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/proposals/:proposalId/status
// @desc    Update proposal status (accept/reject)
// @access  Private (Client only - job owner)
router.put('/proposals/:proposalId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can update proposal status' });
    }

    const { status } = req.body;
    const { proposalId } = req.params;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    // Find the job containing this proposal
    const job = await Job.findOne({ 'proposals._id': proposalId });

    if (!job) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if user owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update proposals for your own jobs' });
    }

    // Find and update the proposal
    const proposal = job.proposals.id(proposalId);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    proposal.status = status;
    await job.save();

    // Populate freelancer info for notification
    await job.populate('proposals.freelancer', 'name');
    const updatedProposal = job.proposals.id(proposalId);

    // Send notification to freelancer
    if (status === 'accepted') {
      await NotificationService.notifyProposalAccepted(
        updatedProposal.freelancer._id,
        job.title,
        job._id
      );
    } else if (status === 'rejected') {
      await NotificationService.notifyProposalRejected(
        updatedProposal.freelancer._id,
        job.title,
        job._id
      );
    }

    res.json({
      message: `Proposal ${status} successfully`,
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;