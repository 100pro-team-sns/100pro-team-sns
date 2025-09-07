const express = require('express');
const jwt = require('jsonwebtoken');
const authUtils = require('../utils/authUtils');

const router = express.Router();

const DUMMY_USER = {
  username: 'testuser',
  passwordHash: '$2b$10$LD.libCeyR7C8nCk706bke6p4cUX2nus/ujzH3CtXqe82zOLZL1bS'
};

const JWT_SECRET = 'your-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username !== DUMMY_USER.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await authUtils.comparePassword(password, DUMMY_USER.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: DUMMY_USER.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;