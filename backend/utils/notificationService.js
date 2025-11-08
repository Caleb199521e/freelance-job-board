import Notification from '../models/Notification.js';

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

  // Bulk notify freelancers about new job
  static async notifyMatchingFreelancers(job, freelancerIds) {
    const notifications = freelancerIds.map(freelancerId => ({
      recipient: freelancerId,
      type: 'job_posted',
      title: 'New Job Matches Your Skills',
      message: `Check out: "${job.title}"`,
      icon: 'fas fa-briefcase',
      color: 'emerald',
      link: `/job.html?id=${job._id}`,
      data: { jobId: job._id }
    }));

    await Notification.insertMany(notifications);

    // Emit to all matched freelancers via WebSocket
    if (global.io) {
      freelancerIds.forEach(freelancerId => {
        global.io.to(freelancerId.toString()).emit('notification', {
          type: 'job_posted',
          title: 'New Job Matches Your Skills',
          message: `Check out: "${job.title}"`,
          jobId: job._id
        });
      });
    }

    return notifications;
  }
}

export default NotificationService;
