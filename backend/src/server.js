const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const taskRoutes = require('./routes/task.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// ===== CORS CONFIGURATION =====
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url} - server.js:41`);
  next();
});

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TaskFlow Pro API is running',
    version: '1.0.0',
    endpoints: {
      root: '/',
      health: '/api/health',
      auth: '/api/auth',
      login: '/api/auth/login',
      register: '/api/auth/register',
      tasks: '/api/tasks',
      employees: '/api/employees',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      notifications: '/api/notifications',
      chat: '/api/chat'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TaskFlow Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== ROUTES =====
console.log('📋 Mounting routes... - server.js:78');

app.use('/api/auth', authRoutes);
console.log('✅ /api/auth mounted - server.js:81');

app.use('/api/employees', employeeRoutes);
console.log('✅ /api/employees mounted - server.js:84');

app.use('/api/tasks', taskRoutes);
console.log('✅ /api/tasks mounted - server.js:87');

app.use('/api', commentRoutes);
console.log('✅ /api (comments) mounted - server.js:90');

app.use('/api/notifications', notificationRoutes);
console.log('✅ /api/notifications mounted - server.js:93');

app.use('/api/dashboard', dashboardRoutes);
console.log('✅ /api/dashboard mounted - server.js:96');

app.use('/api/reports', reportRoutes);
console.log('✅ /api/reports mounted - server.js:99');

app.use('/api/tasks/:id/attachments', attachmentRoutes);
console.log('✅ /api/tasks/:id/attachments mounted - server.js:102');

app.use('/api/chat', chatRoutes);
console.log('✅ /api/chat mounted - server.js:105');

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url} - server.js:109`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// ===== ERROR HANDLER =====
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error: - server.js:118', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
};
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ===== CREATE HTTP SERVER FOR SOCKET.IO =====
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// ===== TRACK ONLINE USERS =====
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔵 New client connected: - server.js:144', socket.id);
  
  // User joins with their ID
  socket.on('user-online', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('👤 User online: - server.js:151', userId);
    }
  });
  
  // Handle private message
  socket.on('private-message', (data) => {
    const { senderId, receiverId, message } = data;
    console.log('💬 Private message: - server.js:158', senderId, '->', receiverId);
    
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', {
        senderId,
        message,
        timestamp: new Date()
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    
    if (disconnectedUserId) {
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('🔴 User offline: - server.js:183', disconnectedUserId);
    }
    console.log('🔴 Client disconnected: - server.js:185', socket.id);
  });
});

// ===== STORE ONLINE USERS FOR API ACCESS =====
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB - server.js:196');

    const checkOverdue = async () => {
      try {
        const Task = require('./models/Task');
        const now = new Date();
        const result = await Task.updateMany(
          { 
            dueDate: { $lt: now }, 
            status: { $nin: ['completed', 'overdue'] } 
          },
          { status: 'overdue' }
        );
        if (result.modifiedCount > 0) {
          console.log(`✅ ${result.modifiedCount} tasks marked as overdue - server.js:210`);
        }
      } catch (error) {
        console.error('Error checking overdue tasks: - server.js:213', error);
      }
    };

    checkOverdue();

    setInterval(async () => {
      try {
        const Task = require('./models/Task');
        const now = new Date();
        const result = await Task.updateMany(
          { 
            dueDate: { $lt: now }, 
            status: { $nin: ['completed', 'overdue'] } 
          },
          { status: 'overdue' }
        );
        if (result.modifiedCount > 0) {
          console.log(`✅ ${result.modifiedCount} tasks marked as overdue (hourly) - server.js:231`);
        }
      } catch (error) {
        console.error('Error checking overdue tasks: - server.js:234', error);
      }
    }, 60 * 60 * 1000);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} - server.js:239`);
      console.log(`📍 Root: https://taskflowpromvp.onrender.com/ - server.js:240`);
      console.log(`🔐 Health: https://taskflowpromvp.onrender.com/api/health - server.js:241`);
      console.log(`💬 Chat Socket.io running - server.js:242`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error: - server.js:246', error.message);
    process.exit(1);
  });