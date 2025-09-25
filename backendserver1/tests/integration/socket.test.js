const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { server, io, sequelize } = require('../../server');
const { User, Room } = require('../../src/models');

describe('Socket.IO Integration Tests', () => {
  let clientSocket;
  let testUser;
  let authToken;
  let testRoom;
  let secondUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    testUser = await User.create({
      email: 'sockettest@example.com',
      password: 'testpassword123'
    });

    secondUser = await User.create({
      email: 'sockettest2@example.com',
      password: 'testpassword123'
    });

    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    testRoom = await Room.create({
      user_id_1: testUser.id,
      user_id_2: secondUser.id,
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await sequelize.close();
    io.close();
    server.close();
  });

  beforeEach((done) => {
    clientSocket = ioClient(`http://localhost:3000`, {
      auth: {
        token: authToken
      }
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Authentication', () => {
    test('should connect with valid token', (done) => {
      const client = ioClient(`http://localhost:3000`, {
        auth: {
          token: authToken
        }
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.close();
        done();
      });

      client.on('connect_error', (error) => {
        client.close();
        done(error);
      });
    });

    test('should reject connection without token', (done) => {
      const client = ioClient(`http://localhost:3000`);

      client.on('connect', () => {
        client.close();
        done(new Error('Should not connect without token'));
      });

      client.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication error');
        client.close();
        done();
      });
    });
  });

  describe('Room Management', () => {
    test('should join room successfully', (done) => {
      clientSocket.on('joined_room', (data) => {
        expect(data.roomId).toBe(testRoom.id);
        expect(data.message).toBe('Successfully joined room');
        done();
      });

      clientSocket.emit('join_room', testRoom.id);
    });

    test('should reject joining unauthorized room', (done) => {
      const unauthorizedRoom = testRoom.id + 999;

      clientSocket.on('error', (data) => {
        expect(data.message).toBe('Not authorized to join this room');
        done();
      });

      clientSocket.emit('join_room', unauthorizedRoom);
    });

    test('should leave room successfully', (done) => {
      clientSocket.on('joined_room', () => {
        clientSocket.emit('leave_room');
        
        setTimeout(() => {
          done();
        }, 100);
      });

      clientSocket.emit('join_room', testRoom.id);
    });
  });

  describe('Chat Messaging', () => {
    beforeEach((done) => {
      clientSocket.on('joined_room', () => {
        done();
      });
      clientSocket.emit('join_room', testRoom.id);
    });

    test('should send and receive messages', (done) => {
      const testMessage = 'Hello, this is a test message!';

      clientSocket.on('new_message', (data) => {
        expect(data.message).toBe(testMessage);
        expect(data.userId).toBe(testUser.id);
        expect(data.roomId).toBe(testRoom.id);
        expect(data.user.email).toBe(testUser.email);
        done();
      });

      clientSocket.emit('send_message', {
        roomId: testRoom.id,
        message: testMessage
      });
    });

    test('should send message with link', (done) => {
      const testMessage = 'Check out this link';
      const testLink = 'https://example.com';

      clientSocket.on('new_message', (data) => {
        expect(data.message).toBe(testMessage);
        expect(data.link).toBe(testLink);
        done();
      });

      clientSocket.emit('send_message', {
        roomId: testRoom.id,
        message: testMessage,
        link: testLink
      });
    });

    test('should reject message to wrong room', (done) => {
      const wrongRoomId = testRoom.id + 999;

      clientSocket.on('error', (data) => {
        expect(data.message).toBe('You are not in this room');
        done();
      });

      clientSocket.emit('send_message', {
        roomId: wrongRoomId,
        message: 'This should fail'
      });
    });
  });

  describe('Multi-user Chat', () => {
    let secondClientSocket;
    let secondAuthToken;

    beforeEach(async () => {
      secondAuthToken = jwt.sign(
        { userId: secondUser.id, email: secondUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      secondClientSocket = ioClient(`http://localhost:3000`, {
        auth: {
          token: secondAuthToken
        }
      });

      await new Promise((resolve) => {
        secondClientSocket.on('connect', resolve);
      });

      await new Promise((resolve) => {
        clientSocket.on('joined_room', resolve);
        clientSocket.emit('join_room', testRoom.id);
      });

      await new Promise((resolve) => {
        secondClientSocket.on('joined_room', resolve);
        secondClientSocket.emit('join_room', testRoom.id);
      });
    });

    afterEach(() => {
      if (secondClientSocket) {
        secondClientSocket.close();
      }
    });

    test('should broadcast messages to all room members', (done) => {
      const testMessage = 'Message from first user';
      let messagesReceived = 0;

      const messageHandler = (data) => {
        expect(data.message).toBe(testMessage);
        messagesReceived++;
        
        if (messagesReceived === 2) {
          done();
        }
      };

      clientSocket.on('new_message', messageHandler);
      secondClientSocket.on('new_message', messageHandler);

      clientSocket.emit('send_message', {
        roomId: testRoom.id,
        message: testMessage
      });
    });

    test('should notify when user joins room', (done) => {
      const thirdUser = ioClient(`http://localhost:3000`, {
        auth: {
          token: authToken
        }
      });

      clientSocket.on('user_joined', (data) => {
        expect(data.userEmail).toBe(testUser.email);
        thirdUser.close();
        done();
      });

      thirdUser.on('connect', () => {
        thirdUser.emit('join_room', testRoom.id);
      });
    });
  });
});