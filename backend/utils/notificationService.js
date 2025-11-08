import Notification from '../models/Notification.js';
import User from '../models/User.js';
import SkillMatcher from './skillMatcher.js';

// Utility class for creating different types of notifications
class NotificationService {
  // Proposal received by client
  static async notifyProposalReceived(clientId, jobTitle, freelancerName, jobId) {
    return Notification.createNotification({
      recipient: clientId,
      type: 'proposal_received',
      title: 'New Proposal Received',
      message: `${freelancerName} submitted a proposal for "${jobTitle}"`,
      icon: 'fas fa-file-alt',
      color: 'blue',
      link: `/job.html?id=${jobId}`,
      data: { jobId }
    });
  }

  // Proposal accepted by client
  static async notifyProposalAccepted(freelancerId, jobTitle, jobId) {
    return Notification.createNotification({
      recipient: freelancerId,
      type: 'proposal_accepted',
      title: 'Proposal Accepted! 🎉',
      message: `Your proposal for "${jobTitle}" has been accepted!`,
      icon: 'fas fa-check-circle',
      color: 'emerald',
      link: `/job.html?id=${jobId}`,
      data: { jobId }
    });
  }

  // Proposal rejected by client
  static async notifyProposalRejected(freelancerId, jobTitle, jobId) {
    return Notification.createNotification({
      recipient: freelancerId,
      type: 'proposal_rejected',
      title: 'Proposal Not Accepted',
      message: `Your proposal for "${jobTitle}" was not accepted`,
      icon: 'fas fa-times-circle',
      color: 'red',
      link: `/job.html?id=${jobId}`,
      data: { jobId }
    });
  }

  // New job matching freelancer's skills
  static async notifyJobMatch(freelancerId, jobTitle, jobId) {
    return Notification.createNotification({
      recipient: freelancerId,
      type: 'job_posted',
      title: 'New Job Matches Your Skills',
      message: `Check out: "${jobTitle}"`,
      icon: 'fas fa-briefcase',
      color: 'emerald',
      link: `/job.html?id=${jobId}`,
      data: { jobId }
    });
  }

  // Job closed
  static async notifyJobClosed(freelancerId, jobTitle, jobId) {
    return Notification.createNotification({
      recipient: freelancerId,
      type: 'job_closed',
      title: 'Job Closed',
      message: `The job "${jobTitle}" has been closed`,
      icon: 'fas fa-lock',
      color: 'gray',
      link: `/job.html?id=${jobId}`,
      data: { jobId }
    });
  }

  // Profile viewed
  static async notifyProfileView(userId, viewerName) {
    return Notification.createNotification({
      recipient: userId,
      type: 'profile_viewed',
      title: 'Profile Viewed',
      message: `${viewerName} viewed your profile`,
      icon: 'fas fa-eye',
      color: 'purple',
      link: '/profile.html'
    });
  }

  // Bulk notify freelancers about new job (skill-matched only)
  static async notifyMatchingFreelancers(job, minMatchScore = 50) {
    try {
      // Get all active freelancers with skills
      const freelancers = await User.find({
        role: 'freelancer',
        'profile.skills': { $exists: true, $ne: [] }
      }).select('_id profile.skills');

      // Find freelancers that match the job requirements
      const matchedFreelancers = SkillMatcher.findMatchingFreelancers(
        freelancers,
        job.skillsRequired || [],
        minMatchScore
      );

      if (matchedFreelancers.length === 0) {
        console.log(`No freelancers matched for job: ${job.title}`);
        return [];
      }

      console.log(`Notifying ${matchedFreelancers.length} matched freelancers for job: ${job.title}`);

      // Create notifications for matched freelancers
      const notifications = matchedFreelancers.map(freelancer => ({
        recipient: freelancer._id,
        type: 'job_posted',
        title: `New Job (${freelancer.matchScore}% Match)`,
        message: `"${job.title}" matches your skills!`,
        icon: 'fas fa-briefcase',
        color: 'emerald',
        link: `/job.html?id=${job._id}`,
        data: { 
          jobId: job._id,
          matchScore: freelancer.matchScore,
          matchedSkills: freelancer.matchedSkills
        }
      }));

      await Notification.insertMany(notifications);

      // Emit to all matched freelancers via WebSocket
      if (global.io) {
        matchedFreelancers.forEach(freelancer => {
          global.io.to(freelancer._id.toString()).emit('notification', {
            type: 'job_posted',
            title: `New Job (${freelancer.matchScore}% Match)`,
            message: `"${job.title}" matches your skills!`,
            jobId: job._id,
            matchScore: freelancer.matchScore
          });
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying matching freelancers:', error);
      return [];
    }
  }
}

export default NotificationService;
