const request = require('supertest');
const { app, server, sequelize } = require('../../server');
const { User } = require('../../src/models');

describe('API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    testUser = await User.create({
      email: 'test@example.com',
      password: 'testpassword123'
    });
  });

  afterAll(async () => {
    await sequelize.close();
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('POST /api/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'newuser@example.com',
          password: 'newpassword123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    test('should return 409 for existing email', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ password: 'testpassword123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      
      authToken = response.body.token;
    });

    test('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/match', () => {
    let secondUser;

    beforeAll(async () => {
      secondUser = await User.create({
        email: 'user2@example.com',
        password: 'password123'
      });
    });

    test('should create a match successfully', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({
          user_id_1: testUser.id,
          user_id_2: secondUser.id
        });
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Match created successfully');
      expect(response.body.room.user_id_1).toBe(testUser.id);
      expect(response.body.room.user_id_2).toBe(secondUser.id);
    });

    test('should return 400 for missing user IDs', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ user_id_1: testUser.id });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both user IDs are required');
    });
  });

  describe('POST /api/match/stop', () => {
    let roomId;

    beforeAll(async () => {
      const secondUser = await User.create({
        email: 'user3@example.com',
        password: 'password123'
      });

      const matchResponse = await request(app)
        .post('/api/match')
        .send({
          user_id_1: testUser.id,
          user_id_2: secondUser.id
        });
      
      roomId = matchResponse.body.room.id;
    });

    test('should stop match successfully', async () => {
      const response = await request(app)
        .post('/api/match/stop')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ roomId });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Match stopped successfully');
      expect(response.body.roomId).toBe(roomId);
    });

    test('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/match/stop')
        .send({ roomId });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });
});