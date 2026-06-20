const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ✅ Get chat users based on role
const getChatUsers = async (req, res) => {
  try {
    console.log('📋 Fetching chat users for: - chat.controller.js:8', req.user._id, 'Role:', req.user.role);
    
    let query = {};
    
    if (req.user.role === 'employee') {
      // Employee sees ONLY admin
      query = { role: 'admin' };
    } else if (req.user.role === 'admin') {
      // Admin sees ALL employees
      query = { role: 'employee' };
    } else {
      // For other roles, show all users except self
      query = { _id: { $ne: req.user._id } };
    }
    
    const users = await User.find(query)
      .select('fullName email role department status')
      .sort({ fullName: 1 });
    
    console.log(`✅ Found ${users.length} chat users - chat.controller.js:27`);
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching chat users: - chat.controller.js:34', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat users'
    });
  }
};

// ✅ Get chat conversations for a user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          fullName: '$user.fullName',
          email: '$user.email',
          department: '$user.department',
          role: '$user.role',
          status: '$user.status'
        }
      }
    ]);
    
    const conversationsWithLastMessage = await Promise.all(conversations.map(async (conv) => {
      const lastMessage = await ChatMessage.findOne({
        $or: [
          { sender: userId, receiver: conv.userId },
          { sender: conv.userId, receiver: userId }
        ]
      }).sort({ createdAt: -1 });
      
      const unreadCount = await ChatMessage.countDocuments({
        sender: conv.userId,
        receiver: userId,
        isRead: false
      });
      
      return {
        ...conv,
        lastMessage: lastMessage ? lastMessage.message : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
        unreadCount
      };
    }));
    
    res.status(200).json({
      success: true,
      conversations: conversationsWithLastMessage
    });
  } catch (error) {
    console.error('Get conversations error: - chat.controller.js:115', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

// ✅ Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    await ChatMessage.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );
    
    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'fullName email role')
    .populate('receiver', 'fullName email role')
    .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error: - chat.controller.js:153', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// ✅ Send a message with notification
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    if (!message || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Message and receiver are required'
      });
    }
    
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    
    const chatMessage = await ChatMessage.create({
      sender: req.user._id,
      receiver: receiverId,
      message
    });
    
    // ✅ CREATE NOTIFICATION FOR RECEIVER
    try {
      await Notification.create({
        user: receiverId,
        title: `New Message from ${req.user.fullName}`,
        message: `${req.user.fullName} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        type: 'chat_message',
        relatedId: chatMessage._id,
        relatedModel: 'ChatMessage',
        senderId: req.user._id,
        senderName: req.user.fullName,
        data: {
          senderId: req.user._id,
          senderName: req.user.fullName,
          messageContent: message,
          conversationId: chatMessage._id
        }
      });
      console.log('✅ Chat notification created for: - chat.controller.js:205', receiverId);
    } catch (notifError) {
      console.error('⚠️ Chat notification error: - chat.controller.js:207', notifError.message);
    }
    
    const populatedMessage = await ChatMessage.findById(chatMessage._id)
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role');
    
    // ✅ EMIT REAL-TIME NOTIFICATION VIA SOCKET.IO
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(receiverId.toString()).emit('new_notification', {
          type: 'chat_message',
          title: `New Message from ${req.user.fullName}`,
          message: `${req.user.fullName} sent you a message`,
          relatedId: chatMessage._id,
          senderId: req.user._id,
          senderName: req.user.fullName,
          createdAt: new Date()
        });
        
        io.to(receiverId.toString()).emit('new_message', {
          message: populatedMessage
        });
        
        console.log('📡 Socket.IO notification sent to receiver: - chat.controller.js:232', receiverId);
      }
    } catch (socketError) {
      console.error('❌ Socket.IO error: - chat.controller.js:235', socketError.message);
    }
    
    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error: - chat.controller.js:243', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// ✅ Get online users
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = req.app.get('onlineUsers') || new Map();
    const onlineUserIds = Array.from(onlineUsers.keys());
    
    const users = await User.find({
      _id: { $in: onlineUserIds },
      status: 'active'
    }).select('fullName email role department status');
    
    res.status(200).json({
      success: true,
      onlineUsers: users
    });
  } catch (error) {
    console.error('Get online users error: - chat.controller.js:267', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
};

// ✅ Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const unreadCount = await ChatMessage.countDocuments({
      receiver: userId,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error: - chat.controller.js:290', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getOnlineUsers,
  getUnreadCount,
  getChatUsers
};