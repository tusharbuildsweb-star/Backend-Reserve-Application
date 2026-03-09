const NotificationService = require('../services/notificationService');

exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await NotificationService.getUserNotifications(req.user._id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user._id);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user._id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const result = await NotificationService.deleteNotification(req.params.id, req.user._id);
        if (!result) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
