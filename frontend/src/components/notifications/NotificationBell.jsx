import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import io from 'socket.io-client';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    setupSocketIO();
    
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const setupSocketIO = () => {
    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECT URL - without /api
      const socket = io('https://taskflow-pro-mvp.onrender.com', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('🔌 Socket.IO connected');
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user._id) {
          socket.emit('user-online', user._id);
        }
      });

      socket.on('new_notification', (data) => {
        console.log('🔔 New notification via Socket.IO:', data);
        fetchNotifications();
      });

      socket.on('new_message', (data) => {
        console.log('💬 New message via Socket.IO:', data);
        fetchNotifications();
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('❌ Socket.IO setup error:', error);
    }
  };

  const refreshNotifications = async () => {
    console.log('🔄 Manual notification refresh triggered');
    await fetchNotifications();
  };

  const fetchNotifications = async () => {
    try {
      console.log('📡 Fetching notifications...');
      const response = await api.get('/notifications');
      console.log('📋 Notifications response:', response.data);
      
      const data = response.data.notifications || [];
      const unreadOnly = data.filter(n => !n.isRead);
      
      setNotifications(unreadOnly);
      setUnreadCount(unreadOnly.length);
      
      document.title = unreadOnly.length > 0 
        ? `(${unreadOnly.length}) TaskFlow Pro` 
        : 'TaskFlow Pro';
        
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notification clicked:', notification);
    
    try {
      await api.patch(`/notifications/${notification._id}/read`);
      console.log('✅ Notification marked as read');
      
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setIsOpen(false);
      
      if (notification.type === 'chat_message') {
        navigate('/chat', { 
          state: { 
            userId: notification.senderId,
            userName: notification.senderName || 'User',
            openChat: true
          } 
        });
      } else if (notification.type === 'comment_added' || 
                 notification.type === 'task_assigned' || 
                 notification.type === 'task_completed' || 
                 notification.type === 'task_overdue') {
        if (notification.relatedId) {
          navigate(`/tasks/${notification.relatedId}`);
        } else {
          navigate('/tasks');
        }
      } else {
        if (notification.relatedId) {
          navigate(`/tasks/${notification.relatedId}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error handling notification:', error);
      setIsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('📋 Marking all as read...');
      await api.patch('/notifications/read-all');
      console.log('✅ All notifications marked as read');
      
      setNotifications([]);
      setUnreadCount(0);
      document.title = 'TaskFlow Pro';
      
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned': return '📋';
      case 'task_completed': return '✅';
      case 'task_overdue': return '⚠️';
      case 'comment_added': return '💬';
      case 'chat_message': return '💬';
      default: return '🔔';
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={refreshNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
                title="Refresh notifications"
              >
                🔄
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTime(notification.createdAt)}</p>
                    </div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;