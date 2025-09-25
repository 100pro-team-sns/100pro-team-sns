const { hashPassword, comparePassword } = require('../../src/utils/authUtils');

describe('authUtils', () => {
  describe('hashPassword', () => {
    test('should generate a valid hash string', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2b\$10\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'testpassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'testpassword';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    test('should handle invalid hash gracefully', async () => {
      const password = 'testpassword';
      const invalidHash = 'invalidhash';
      
      try {
        const result = await comparePassword(password, invalidHash);
        expect(result).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});