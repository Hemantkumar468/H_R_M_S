import request from 'supertest';
import { createApp } from '../app';
import { UserModel } from '../models/User';
import { UserRole } from '@hrms/shared';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

jest.mock('../models/User');
jest.mock('../models/Employee');
jest.mock('../models/AuditLog');

const app = createApp();

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'invalid-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if user is not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'unknown@hrms.local',
        password: 'Password@123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should login successfully with valid credentials and return JWT', async () => {
      const mockUser = {
        _id: '64f1a2b3c4d5e6f7a8b9c0d1',
        email: 'priya.hr@hrms.local',
        role: UserRole.HR_ADMIN,
        isActive: true,
        isFirstLogin: false,
        refreshTokens: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'priya.hr@hrms.local',
        password: 'Password@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('priya.hr@hrms.local');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if token is not provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 200 with user session when valid token provided', async () => {
      const mockUser = {
        _id: '64f1a2b3c4d5e6f7a8b9c0d1',
        email: 'admin@hrms.local',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isFirstLogin: false,
      };

      const mockQuery: any = Promise.resolve(mockUser);
      mockQuery.select = jest.fn().mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const token = jwt.sign(
        { userId: mockUser._id, email: mockUser.email, role: mockUser.role },
        env.JWT_ACCESS_SECRET,
      );

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(mockUser._id);
    });
  });
});
