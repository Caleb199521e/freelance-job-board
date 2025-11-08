import express from 'express';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;
    
    const filter = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({
      notifications,
      unreadCount,
      total: await Notification.countDocuments(filter)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all read notifications
// @access  Private
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      read: true
    });

    res.json({ 
      message: 'All read notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
