const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    console.log('📋 Fetching notifications for user: - notification.controller.js:5', req.user._id);
    
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error: - notification.controller.js:23', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    console.log('📋 Marking notification as read: - notification.controller.js:33', req.params.id);
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error: - notification.controller.js:55', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    console.log('📋 Marking all notifications as read for user: - notification.controller.js:65', req.user._id);
    
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all as read error: - notification.controller.js:77', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    console.log('📋 Deleting notification: - notification.controller.js:87', req.params.id);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error: - notification.controller.js:105', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};