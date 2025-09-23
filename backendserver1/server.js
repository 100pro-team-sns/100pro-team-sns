const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { connectDB } = require('./src/services/db');
const { User, Room, Chat, sequelize } = require('./src/models');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

const apiRoutes = require('./src/routes/api')(io);
app.use('/api', apiRoutes);

const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = user.id;
      socket.userEmail = user.email;
      next();
    } catch (error) {
      return next(new Error('Database error'));
    }
  });
};

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.userEmail}`);

  socket.on('join_room', async (roomId) => {
    try {
      const room = await Room.findOne({
        where: {
          id: roomId,
          expired_at: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!room || (room.user_id_1 !== socket.userId && room.user_id_2 !== socket.userId)) {
        socket.emit('error', { message: 'Not authorized to join this room' });
        return;
      }

      socket.join(`room_${roomId}`);
      socket.currentRoom = roomId;
      
      socket.emit('joined_room', { roomId, message: 'Successfully joined room' });
      
      socket.to(`room_${roomId}`).emit('user_joined', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        message: `${socket.userEmail} joined the room`
      });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { roomId, message, link } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== roomId) {
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      const room = await Room.findOne({
        where: {
          id: roomId,
          expired_at: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!room || (room.user_id_1 !== socket.userId && room.user_id_2 !== socket.userId)) {
        socket.emit('error', { message: 'Not authorized to send messages in this room' });
        return;
      }

      const chat = await Chat.create({
        room_id: roomId,
        user_id: socket.userId,
        context: message,
        link: link || null
      });

      const chatWithUser = await Chat.findByPk(chat.id, {
        include: [{ model: User, attributes: ['id', 'email'] }]
      });

      io.to(`room_${roomId}`).emit('new_message', {
        id: chatWithUser.id,
        roomId: chatWithUser.room_id,
        userId: chatWithUser.user_id,
        message: chatWithUser.context,
        link: chatWithUser.link,
        createdAt: chatWithUser.created_at,
        user: chatWithUser.User
      });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('leave_room', () => {
    if (socket.currentRoom) {
      socket.to(`room_${socket.currentRoom}`).emit('user_left', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        message: `${socket.userEmail} left the room`
      });
      
      socket.leave(`room_${socket.currentRoom}`);
      socket.currentRoom = null;
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}, User: ${socket.userEmail}`);
    
    if (socket.currentRoom) {
      socket.to(`room_${socket.currentRoom}`).emit('user_left', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        message: `${socket.userEmail} disconnected`
      });
    }
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully');
    
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, io, sequelize };