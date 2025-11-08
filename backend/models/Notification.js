import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'proposal_received',
      'proposal_accepted',
      'proposal_rejected',
      'job_posted',
      'job_updated',
      'job_closed',
      'message_received',
      'payment_received',
      'profile_viewed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'fas fa-bell'
  },
  color: {
    type: String,
    default: 'blue'
  },
  link: {
    type: String // URL to navigate when notification is clicked
  },
  data: {
    type: mongoose.Schema.Types.Mixed // Additional data (job ID, proposal ID, etc.)
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Emit WebSocket event (will be handled by socket.io)
  if (global.io) {
    global.io.to(data.recipient.toString()).emit('notification', notification);
  }
  
  return notification;
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
