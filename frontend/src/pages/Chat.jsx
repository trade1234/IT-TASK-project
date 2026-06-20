import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { io } from 'socket.io-client';
import { FiSend, FiUsers, FiCheck, FiCheckCircle } from 'react-icons/fi';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [hasOpenedFromNotification, setHasOpenedFromNotification] = useState(false);

  // ✅ Setup Socket.IO with correct URL
  useEffect(() => {
    if (!user) return;
    
    const socketInstance = io(process.env.REACT_APP_API_URL || 'https://taskflowpromvp.onrender.com', {
      transports: ['websocket', 'polling'],
      cors: { origin: '*' }
    });
    
    setSocket(socketInstance);
    socketInstance.emit('user-online', user._id);
    
    socketInstance.on('online-users', (users) => {
      setOnlineUsers(users);
    });
    
    socketInstance.on('new-message', (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        fetchMessages(selectedUser._id);
      }
      fetchConversations();
    });
    
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // ✅ Fetch all users
  useEffect(() => {
    if (user) {
      fetchAllUsers();
    }
  }, [user]);

  // ✅ Fetch conversations after users loaded
  useEffect(() => {
    if (user && allUsers.length > 0) {
      fetchConversations();
    }
  }, [allUsers]);

  // ✅ Handle notification navigation
  useEffect(() => {
    if (location.state?.userId && location.state?.openChat && !hasOpenedFromNotification) {
      console.log('📩 Opening chat from notification:', location.state);
      const userId = location.state.userId;
      
      let userToSelect = null;
      
      const convUser = conversations.find(c => {
        const otherUser = getOtherUser(c);
        return otherUser._id === userId || otherUser.userId === userId;
      });
      
      if (convUser) {
        userToSelect = getOtherUser(convUser);
      } else {
        const foundUser = allUsers.find(u => u._id === userId);
        if (foundUser) {
          userToSelect = foundUser;
        } else {
          userToSelect = {
            _id: userId,
            fullName: location.state.userName || 'User',
            userId: userId
          };
        }
      }
      
      if (userToSelect) {
        setHasOpenedFromNotification(true);
        handleSelectUser(userToSelect);
      }
    }
  }, [location, conversations, allUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Fetch all users (admin sees employees, employee sees admin)
  const fetchAllUsers = async () => {
    try {
      console.log('📡 Fetching chat users...');
      const response = await api.get('/chat/users');
      console.log('📋 Chat users response:', response.data);
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // ✅ Fallback: Try employees endpoint
      try {
        const response2 = await api.get('/employees');
        setAllUsers(response2.data.employees || []);
      } catch (err) {
        console.error('Fallback also failed:', err);
      }
    }
  };

  // ✅ Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      let convs = response.data.conversations || [];
      
      // ✅ If no conversations, show users based on role
      if (convs.length === 0 && allUsers.length > 0) {
        let otherUsers = [];
        
        if (user.role === 'admin') {
          // ✅ Admin sees ALL employees
          otherUsers = allUsers.filter(u => u._id !== user._id && u.role === 'employee');
        } else if (user.role === 'employee') {
          // ✅ Employee sees ONLY Admin
          otherUsers = allUsers.filter(u => u._id !== user._id && u.role === 'admin');
        }
        
        convs = otherUsers.map(u => ({
          userId: u._id,
          fullName: u.fullName,
          email: u.email,
          department: u.department,
          role: u.role,
          status: u.status,
          user: u,
          lastMessage: 'Click to start chat',
          unreadCount: 0
        }));
      }
      
      setConversations(convs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/messages/${userId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    await fetchMessages(user.userId || user._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      const response = await api.post('/chat/send', {
        receiverId: selectedUser.userId || selectedUser._id,
        message: messageText
      });
      
      setMessages(prev => [...prev, response.data.message]);
      
      if (socket) {
        socket.emit('private-message', {
          senderId: user._id,
          receiverId: selectedUser.userId || selectedUser._id,
          message: messageText
        });
      }
      
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUser = (conv) => {
    return conv.user || conv;
  };

  if (!user) {
    return <div className="text-center py-12">Please login to chat</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-gray-100 rounded-lg overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiUsers className="w-5 h-5" />
            Messages
          </h2>
          <p className="text-xs text-gray-500">{conversations.length} conversations</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No users available to chat
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const isSelected = selectedUser && 
                (selectedUser._id === otherUser._id || 
                 selectedUser.userId === otherUser._id ||
                 selectedUser._id === otherUser.userId);
              
              return (
                <div
                  key={otherUser._id || otherUser.userId}
                  onClick={() => handleSelectUser(otherUser)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {otherUser.fullName?.charAt(0) || 'U'}
                        </div>
                        {isUserOnline(otherUser._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 truncate">{otherUser.fullName}</p>
                          {otherUser.role === 'admin' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>
                          )}
                          {otherUser.role === 'employee' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Employee</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      {conv.lastMessageTime && (
                        <span className="text-xs text-gray-400">{formatTime(conv.lastMessageTime)}</span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                {selectedUser.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-800">{selectedUser.fullName}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={isUserOnline(selectedUser._id) ? 'text-green-600' : 'text-gray-400'}>
                    {isUserOnline(selectedUser._id) ? '🟢 Online' : '⚪ Offline'}
                  </span>
                  {selectedUser.role === 'admin' && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Admin</span>
                  )}
                  {selectedUser.role === 'employee' && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Employee</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Send your first message!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.sender._id === user._id || msg.sender === user._id;
                return (
                  <div
                    key={msg._id || index}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                      {!isMine && (
                        <p className="text-xs text-gray-500 mb-1">{msg.sender?.fullName || 'Unknown'}</p>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.createdAt)}
                        {isMine && (
                          <span className="ml-1">
                            {msg.isRead ? <FiCheckCircle className="inline text-blue-500" /> : <FiCheck className="inline" />}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="1"
                style={{ maxHeight: '100px' }}
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
              >
                <FiSend className="w-4 h-4" />
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Select a conversation</h3>
            <p className="text-sm text-gray-500 mt-1">Choose a user from the sidebar to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;