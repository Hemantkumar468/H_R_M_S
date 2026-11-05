import request from 'supertest';
import { createApp } from '../app';
import { UserModel } from '../models/User';
import { AttendanceModel } from '../models/Attendance';
import { UserRole, RegularizationStatus } from '@hrms/shared';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

jest.mock('../models/User');
jest.mock('../models/Attendance');
jest.mock('../models/Employee');
jest.mock('../models/AuditLog');

const app = createApp();

describe('Attendance Integration Tests', () => {
  const mockUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const mockEmpId = '64f1a2b3c4d5e6f7a8b9c0d2';
  const token = jwt.sign(
    { userId: mockUserId, email: 'emp@hrms.local', role: UserRole.EMPLOYEE, employeeId: mockEmpId },
    env.JWT_ACCESS_SECRET,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: mockUserId,
        email: 'emp@hrms.local',
        role: UserRole.EMPLOYEE,
        employeeId: mockEmpId,
        isActive: true,
      }),
    });
  });

  describe('POST /api/v1/attendance/check-in', () => {
    it('should reject check-in if user has already checked in', async () => {
      (AttendanceModel.findOne as jest.Mock).mockResolvedValue({
        checkIn: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send({ locationName: 'HQ Office' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already checked in');
    });

    it('should check in successfully', async () => {
      (AttendanceModel.findOne as jest.Mock).mockResolvedValue(null);
      const mockSaved = {
        _id: '64f1a2b3c4d5e6f7a8b9c0d3',
        employeeId: mockEmpId,
        date: '2026-11-01',
        checkIn: new Date(),
        status: 'PRESENT',
        save: jest.fn().mockResolvedValue(true),
      };
      (AttendanceModel as unknown as jest.Mock).mockImplementation(() => mockSaved);

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send({ locationName: 'HQ Office' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/attendance/regularize', () => {
    it('should submit regularization request', async () => {
      const mockRecord = {
        _id: '64f1a2b3c4d5e6f7a8b9c0d4',
        employeeId: mockEmpId,
        regularizationStatus: RegularizationStatus.NONE,
        save: jest.fn().mockResolvedValue(true),
      };

      (AttendanceModel.findOne as jest.Mock).mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/v1/attendance/regularize')
        .set('Authorization', `Bearer ${token}`)
        .send({
          attendanceId: '64f1a2b3c4d5e6f7a8b9c0d4',
          requestedCheckIn: '2026-11-01T09:00:00.000Z',
          requestedCheckOut: '2026-11-01T18:00:00.000Z',
          reason: 'Biometric fingerprint scanner malfunction',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockRecord.save).toHaveBeenCalled();
    });
  });
});
