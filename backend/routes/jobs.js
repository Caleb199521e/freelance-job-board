import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import SkillMatcher from '../utils/skillMatcher.js';
import NotificationService from '../utils/notificationService.js';

const router = express.Router();

// @route   GET /api/jobs/stats
// @desc    Get platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [jobsCount, freelancersCount, clientsCount] = await Promise.all([
      Job.countDocuments({ status: 'open' }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ role: 'client' })
    ]);

    res.json({
      jobs: jobsCount,
      freelancers: freelancersCount,
      clients: clientsCount
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// @route   GET /api/jobs/matched
// @desc    Get jobs matched to freelancer's skills
// @access  Private (Freelancers only)
router.get('/matched', auth, async (req, res) => {
  try {
    // Only freelancers can access matched jobs
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can access matched jobs' });
    }

    const { minScore = 50, page = 1, limit = 10 } = req.query;

    // Get freelancer's skills
    const freelancer = await User.findById(req.user._id).select('profile.skills');
    const freelancerSkills = freelancer?.profile?.skills || [];

    if (freelancerSkills.length === 0) {
      return res.json({
        jobs: [],
        message: 'Please add skills to your profile to see matched jobs',
        pagination: { currentPage: 1, totalPages: 0, totalJobs: 0 }
      });
    }

    // Get all open jobs
    const allJobs = await Job.find({ status: 'open' })
      .populate('client', 'name profile company')
      .sort({ createdAt: -1 })
      .lean();

    // Filter and score jobs based on skill match
    const matchedJobs = SkillMatcher.filterMatchingJobs(
      allJobs,
      freelancerSkills,
      parseInt(minScore)
    );

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const paginatedJobs = matchedJobs.slice(skip, skip + limitNum);

    // Add match quality labels
    const jobsWithLabels = paginatedJobs.map(job => ({
      ...job,
      matchQuality: SkillMatcher.getMatchQuality(job.matchScore)
    }));

    res.json({
      jobs: jobsWithLabels,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(matchedJobs.length / limitNum),
        totalJobs: matchedJobs.length,
        hasNext: pageNum < Math.ceil(matchedJobs.length / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get matched jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, location, search, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Only show open jobs to non-authenticated users
    if (!req.header('Authorization')) {
      filter.status = 'open';
    } else {
      if (status) filter.status = status;
    }

    if (category && category !== 'all') filter.category = category;
    if (location && location !== 'all') filter.location = new RegExp(location, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(filter)
      .populate('client', 'name profile company')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Job.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      jobs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalJobs: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/categories
// @desc    Get job categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Job.aggregate([
      { $match: { status: 'open' } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgBudget: { $avg: '$budget' }
      }},
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'name profile company createdAt')
      .lean(); // Use lean() for faster queries

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only populate proposals if user is authenticated
    if (req.header('Authorization')) {
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role');

        // Get the actual client ID (handle both populated and non-populated cases)
        const clientId = job.client._id ? job.client._id.toString() : job.client.toString();
        
        console.log('Job detail access - User:', decoded.id, 'Role:', user?.role, 'Client:', clientId);

        // Only show proposals to the job owner
        if (user && user.role === 'client' && clientId === user._id.toString()) {
          console.log('✅ Loading proposals for job owner');
          const jobWithProposals = await Job.findById(req.params.id)
            .populate('proposals.freelancer', 'name profile')
            .lean();
          job.proposals = jobWithProposals.proposals;
          console.log('Proposals count:', job.proposals?.length || 0);
        } else {
          console.log('❌ Not job owner or not client - hiding proposals');
          job.proposals = [];
        }
      } catch (authError) {
        console.error('Auth error when loading job:', authError);
        // If token is invalid, just hide proposals
        job.proposals = [];
      }
    } else {
      job.proposals = []; // Hide proposals from non-authenticated users
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job
// @access  Private (Clients only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can post jobs' });
    }

    const {
      title,
      description,
      category,
      budget,
      budgetType,
      location,
      deadline,
      skillsRequired
    } = req.body;

    // Validation
    if (!title || !description || !category || !budget || !location || !deadline) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }

    const job = new Job({
      title,
      description,
      category,
      budget: parseFloat(budget),
      budgetType: budgetType || 'fixed',
      location,
      deadline: new Date(deadline),
      skillsRequired: skillsRequired ? skillsRequired.split(',').map(skill => skill.trim()) : [],
      client: req.user._id
    });

    await job.save();
    await job.populate('client', 'name profile company');

    // Notify freelancers whose skills match the job requirements (minimum 50% match)
    if (job.skillsRequired && job.skillsRequired.length > 0) {
      await NotificationService.notifyMatchingFreelancers(job, 50);
    }

    res.status(201).json({
      message: 'Job posted successfully!',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job
// @access  Private (Job owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    
    // Convert skills string to array if provided
    if (updates.skillsRequired && typeof updates.skillsRequired === 'string') {
      updates.skillsRequired = updates.skillsRequired.split(',').map(skill => skill.trim());
    }

    // Convert deadline to Date object if provided
    if (updates.deadline) {
      updates.deadline = new Date(updates.deadline);
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('client', 'name profile company');

    res.json({
      message: 'Job updated successfully!',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job
// @access  Private (Job owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/client/my-jobs
// @desc    Get jobs posted by current client
// @access  Private (Clients only)
router.get('/client/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can access this endpoint' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const filter = { client: req.user._id };
    
    if (status && status !== 'all') filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(filter)
      .populate('proposals.freelancer', 'name profile')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalJobs: total
      }
    });
  } catch (error) {
    console.error('Get client jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/jobs/:id/status
// @desc    Update job status
// @access  Private (Job owner only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'closed', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    job.status = status;
    await job.save();

    res.json({
      message: `Job ${status} successfully`,
      job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/jobs/similar/:id
// @desc    Get similar jobs
// @access  Public
router.get('/similar/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const similarJobs = await Job.find({
      _id: { $ne: job._id },
      category: job.category,
      status: 'open',
      location: job.location
    })
      .populate('client', 'name profile company')
      .limit(6)
      .sort({ createdAt: -1 });

    res.json(similarJobs);
  } catch (error) {
    console.error('Get similar jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;