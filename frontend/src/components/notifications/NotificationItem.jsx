import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const NotificationItem = ({ notification, onNotificationClick }) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'task_overdue':
        return '⚠️';
      case 'comment_added':
        return '💬';
      case 'chat_message':  // ✅ ADD THIS
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatTime = (date) => {
    const diff = new Date() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleClick = async () => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await api.patch(`/notifications/${notification._id}/read`);
        if (onNotificationClick) {
          onNotificationClick();
        }
      }
      
      // ✅ Navigate based on notification type
      if (notification.type === 'chat_message') {
        // ✅ Navigate to chat page for chat messages
        navigate('/chat');
      } else if (notification.relatedId) {
        // ✅ Navigate to task for task-related notifications
        navigate(`/tasks/${notification.relatedId}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getIcon(notification.type)}</div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">{formatTime(notification.createdAt)}</p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;