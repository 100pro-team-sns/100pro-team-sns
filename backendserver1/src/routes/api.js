const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Room, Chat } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (io) => {
  const router = express.Router();

  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };


  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const user = await User.create({ email, password });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await user.update({ token, token_expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000) });

      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await user.update({ token, token_expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000) });

      res.status(200).json({ 
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/match', async (req, res) => {
    try {
      const { user_id_1, user_id_2, duration_hours = 24 } = req.body;

      if (!user_id_1 || !user_id_2) {
        return res.status(400).json({ error: 'Both user IDs are required' });
      }

      const user1 = await User.findByPk(user_id_1);
      const user2 = await User.findByPk(user_id_2);

      if (!user1 || !user2) {
        return res.status(404).json({ error: 'One or both users not found' });
      }

      const expiredAt = new Date(Date.now() + duration_hours * 60 * 60 * 1000);
      
      const room = await Room.create({
        user_id_1,
        user_id_2,
        expired_at: expiredAt
      });

      io.emit('match_created', {
        roomId: room.id,
        user1: { id: user1.id, email: user1.email },
        user2: { id: user2.id, email: user2.email },
        expiredAt
      });

      res.status(201).json({
        message: 'Match created successfully',
        room: {
          id: room.id,
          user_id_1: room.user_id_1,
          user_id_2: room.user_id_2,
          expired_at: room.expired_at
        }
      });
    } catch (error) {
      console.error('Match creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/match/stop', authenticateToken, async (req, res) => {
    try {
      const { roomId } = req.body;
      const userId = req.user.userId;

      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      const room = await Room.findOne({
        where: {
          id: roomId,
          expired_at: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!room) {
        return res.status(404).json({ error: 'Active room not found' });
      }

      if (room.user_id_1 !== userId && room.user_id_2 !== userId) {
        return res.status(403).json({ error: 'Not authorized to stop this match' });
      }

      await room.update({ expired_at: new Date() });

      io.to(`room_${roomId}`).emit('match_stopped', {
        roomId: room.id,
        stoppedBy: userId,
        message: 'Match has been stopped'
      });

      res.status(200).json({
        message: 'Match stopped successfully',
        roomId: room.id
      });
    } catch (error) {
      console.error('Match stop error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/rooms/:roomId/chats', authenticateToken, async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.userId;

      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.user_id_1 !== userId && room.user_id_2 !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this room' });
      }

      const chats = await Chat.findAll({
        where: { room_id: roomId },
        include: [{ model: User, attributes: ['id', 'email'] }],
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({ chats });
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/train/join', authenticateToken, async (req, res) => {
    try {
      const { train_id } = req.body;
      const userId = req.user.userId;

      if (!train_id) {
        return res.status(400).json({ error: 'train_id is required' });
      }

      const expiredAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now

      await User.update(
        {
          section_id: train_id,
          section_id_expired_at: expiredAt
        },
        { where: { id: userId } }
      );

      res.status(200).json({
        message: 'Successfully joined train',
        train_id,
        expired_at: expiredAt
      });
    } catch (error) {
      console.error('Train join error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/train/leave', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;

      await User.update(
        {
          section_id: null,
          section_id_expired_at: null
        },
        { where: { id: userId } }
      );

      res.status(200).json({
        message: 'Successfully left train'
      });
    } catch (error) {
      console.error('Train leave error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/chats', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;

      const rooms = await Room.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { user_id_1: userId },
            { user_id_2: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'email']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'email']
          }
        ]
      });

      const chatList = await Promise.all(rooms.map(async (room) => {
        const lastMessage = await Chat.findOne({
          where: { room_id: room.id },
          order: [['created_at', 'DESC']],
          attributes: ['context', 'created_at']
        });

        const otherUser = room.user_id_1 === userId
          ? { id: room.user_id_2, email: room.user2?.email }
          : { id: room.user_id_1, email: room.user1?.email };

        const isExpired = new Date() > new Date(room.expired_at);

        return {
          roomId: room.id,
          otherUser,
          isExpired,
          lastMessage: lastMessage ? {
            context: lastMessage.context,
            createdAt: lastMessage.created_at
          } : null
        };
      }));

      res.status(200).json(chatList);
    } catch (error) {
      console.error('Get chat list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};