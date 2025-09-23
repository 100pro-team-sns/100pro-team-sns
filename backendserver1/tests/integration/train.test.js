const request = require('supertest');
const { app, server, sequelize } = require('../../server');
const { User, Room, Chat } = require('../../src/models');

describe('Train and Chat List API Integration Tests', () => {
  let testUser;
  let authToken;
  let secondUser;
  let secondAuthToken;
  let roomId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create first test user
    testUser = await User.create({
      email: 'trainuser@example.com',
      password: 'testpassword123'
    });

    // Login first user to get auth token
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'trainuser@example.com',
        password: 'testpassword123'
      });
    authToken = loginResponse.body.token;

    // Create second test user
    secondUser = await User.create({
      email: 'trainuser2@example.com',
      password: 'testpassword123'
    });

    // Login second user to get auth token
    const secondLoginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'trainuser2@example.com',
        password: 'testpassword123'
      });
    secondAuthToken = secondLoginResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('Train API Tests', () => {
    describe('POST /api/train/join', () => {
      test('should update train_id when joining a train', async () => {
        const response = await request(app)
          .post('/api/train/join')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            train_id: 'train_123'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully joined train');
        expect(response.body.train_id).toBe('train_123');
        expect(response.body.expired_at).toBeDefined();

        // Verify database update
        const updatedUser = await User.findByPk(testUser.id);
        expect(updatedUser.section_id).toBe('train_123');
        expect(updatedUser.section_id_expired_at).toBeDefined();
      });

      test('should return 400 for missing train_id', async () => {
        const response = await request(app)
          .post('/api/train/join')
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('train_id is required');
      });

      test('should return 401 for missing auth token', async () => {
        const response = await request(app)
          .post('/api/train/join')
          .send({
            train_id: 'train_123'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });

      test('should return 403 for invalid auth token', async () => {
        const response = await request(app)
          .post('/api/train/join')
          .set('Authorization', 'Bearer invalid_token')
          .send({
            train_id: 'train_123'
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('POST /api/train/leave', () => {
      test('should reset train_id when leaving a train', async () => {
        // First join a train
        await request(app)
          .post('/api/train/join')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            train_id: 'train_456'
          });

        // Then leave the train
        const response = await request(app)
          .post('/api/train/leave')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Successfully left train');

        // Verify database update
        const updatedUser = await User.findByPk(testUser.id);
        expect(updatedUser.section_id).toBeNull();
        expect(updatedUser.section_id_expired_at).toBeNull();
      });

      test('should return 401 for missing auth token', async () => {
        const response = await request(app)
          .post('/api/train/leave');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });

      test('should return 403 for invalid auth token', async () => {
        const response = await request(app)
          .post('/api/train/leave')
          .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });
  });

  describe('Chat List API Tests', () => {
    beforeAll(async () => {
      // Create a room between the two users
      const matchResponse = await request(app)
        .post('/api/match')
        .send({
          user_id_1: testUser.id,
          user_id_2: secondUser.id,
          duration_hours: 24
        });
      roomId = matchResponse.body.room.id;

      // Add some test messages
      await Chat.create({
        room_id: roomId,
        user_id: testUser.id,
        context: 'Hello from first user!'
      });

      await Chat.create({
        room_id: roomId,
        user_id: secondUser.id,
        context: 'Hello back from second user!'
      });
    });

    describe('GET /api/chats', () => {
      test('should return all chat rooms for a user', async () => {
        const response = await request(app)
          .get('/api/chats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const chatRoom = response.body[0];
        expect(chatRoom.roomId).toBeDefined();
        expect(chatRoom.otherUser).toBeDefined();
        expect(chatRoom.otherUser.id).toBe(secondUser.id);
        expect(chatRoom.otherUser.email).toBe(secondUser.email);
        expect(chatRoom.isExpired).toBeDefined();
        expect(chatRoom.lastMessage).toBeDefined();
        expect(chatRoom.lastMessage.context).toBe('Hello back from second user!');
      });

      test('should correctly identify expired rooms', async () => {
        // Create an expired room
        const expiredRoom = await Room.create({
          user_id_1: testUser.id,
          user_id_2: secondUser.id,
          expired_at: new Date(Date.now() - 1000) // 1 second ago
        });

        const response = await request(app)
          .get('/api/chats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);

        const expiredChatRoom = response.body.find(room => room.roomId === expiredRoom.id);
        expect(expiredChatRoom).toBeDefined();
        expect(expiredChatRoom.isExpired).toBe(true);
      });

      test('should return empty array for user with no chat rooms', async () => {
        // Create a new user with no rooms
        const newUser = await User.create({
          email: 'norooms@example.com',
          password: 'testpassword123'
        });

        const loginResponse = await request(app)
          .post('/api/login')
          .send({
            email: 'norooms@example.com',
            password: 'testpassword123'
          });

        const response = await request(app)
          .get('/api/chats')
          .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      test('should return 401 for missing auth token', async () => {
        const response = await request(app)
          .get('/api/chats');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });

      test('should return 403 for invalid auth token', async () => {
        const response = await request(app)
          .get('/api/chats')
          .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Invalid or expired token');
      });

      test('should handle rooms with no messages', async () => {
        // Create a room with no messages
        const emptyRoom = await Room.create({
          user_id_1: testUser.id,
          user_id_2: secondUser.id,
          expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });

        const response = await request(app)
          .get('/api/chats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);

        const emptyChatRoom = response.body.find(room => room.roomId === emptyRoom.id);
        expect(emptyChatRoom).toBeDefined();
        expect(emptyChatRoom.lastMessage).toBeNull();
      });
    });
  });
});