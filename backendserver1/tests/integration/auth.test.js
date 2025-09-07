const request = require('supertest');
const { app, server } = require('../../server');

describe('Authentication API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('POST /api/login', () => {
    test('should return 200 and token for valid credentials', async () => {
      const validCredentials = {
        username: 'testuser',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(validCredentials)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('should return 401 for invalid username', async () => {
      const invalidCredentials = {
        username: 'wronguser',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const invalidCredentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 400 for missing username', async () => {
      const incompleteCredentials = {
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(incompleteCredentials)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should return 400 for missing password', async () => {
      const incompleteCredentials = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/login')
        .send(incompleteCredentials)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password are required');
    });
  });
});