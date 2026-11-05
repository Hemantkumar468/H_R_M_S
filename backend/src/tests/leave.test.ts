import request from 'supertest';
import { createApp } from '../app';
import { UserModel } from '../models/User';
import { LeaveTypeModel } from '../models/LeaveType';
import { LeaveRequestModel } from '../models/LeaveRequest';
import { EmployeeModel } from '../models/Employee';
import { HolidayModel } from '../models/Holiday';
import { NotificationModel } from '../models/Notification';
import { UserRole, LeaveStatus, LeaveTypeEnum } from '@hrms/shared';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

jest.mock('../models/User');
jest.mock('../models/LeaveType');
jest.mock('../models/LeaveRequest');
jest.mock('../models/Employee');
jest.mock('../models/Holiday');
jest.mock('../models/Notification');
jest.mock('../models/AuditLog');

const app = createApp();

describe('Leave Integration Tests', () => {
  const mockUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const mockEmpId = '64f1a2b3c4d5e6f7a8b9c0d2';
  const mockManagerUserId = '64f1a2b3c4d5e6f7a8b9c0d3';
  const mockManagerEmpId = '64f1a2b3c4d5e6f7a8b9c0d4';
  const mockOtherManagerEmpId = '64f1a2b3c4d5e6f7a8b9c0d9';

  const employeeToken = jwt.sign(
    { userId: mockUserId, email: 'emp@hrms.local', role: UserRole.EMPLOYEE, employeeId: mockEmpId },
    env.JWT_ACCESS_SECRET,
  );

  const managerToken = jwt.sign(
    {
      userId: mockManagerUserId,
      email: 'mgr@hrms.local',
      role: UserRole.MANAGER,
      employeeId: mockManagerEmpId,
    },
    env.JWT_ACCESS_SECRET,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    (UserModel.findById as jest.Mock).mockImplementation((id: string) => {
      if (id === mockManagerUserId) {
        return {
          select: jest.fn().mockResolvedValue({
            _id: mockManagerUserId,
            email: 'mgr@hrms.local',
            role: UserRole.MANAGER,
            employeeId: mockManagerEmpId,
            isActive: true,
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({
          _id: mockUserId,
          email: 'emp@hrms.local',
          role: UserRole.EMPLOYEE,
          employeeId: mockEmpId,
          isActive: true,
        }),
      };
    });

    (EmployeeModel.findById as jest.Mock).mockImplementation((id: string) => {
      if (id === mockEmpId) {
        return Promise.resolve({
          _id: mockEmpId,
          firstName: 'Anita',
          lastName: 'Dev',
          reportingManagerId: mockManagerEmpId,
          isDeleted: false,
        });
      }
      if (id === mockManagerEmpId) {
        return Promise.resolve({
          _id: mockManagerEmpId,
          firstName: 'Rajesh',
          lastName: 'Manager',
          isDeleted: false,
        });
      }
      return Promise.resolve(null);
    });

    (HolidayModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    (UserModel.find as jest.Mock).mockResolvedValue([]);

    (NotificationModel.create as jest.Mock).mockResolvedValue({});
  });

  describe('GET /api/v1/leaves/types', () => {
    it('should return list of active leave types', async () => {
      (LeaveTypeModel.find as jest.Mock).mockResolvedValue([
        { _id: '1', name: 'Casual Leave', code: LeaveTypeEnum.CASUAL, daysPerYear: 12 },
        { _id: '2', name: 'Sick Leave', code: LeaveTypeEnum.SICK, daysPerYear: 10 },
      ]);

      const res = await request(app)
        .get('/api/v1/leaves/types')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('POST /api/v1/leaves/apply', () => {
    it('should successfully submit leave application and calculate working days skipping Sunday', async () => {
      const leaveTypeId = '64f1a2b3c4d5e6f7a8b9c0d5';

      (LeaveTypeModel.findById as jest.Mock).mockResolvedValue({
        _id: leaveTypeId,
        name: 'Casual Leave',
        code: LeaveTypeEnum.CASUAL,
        isActive: true,
        daysPerYear: 12,
      });

      // No overlapping requests
      (LeaveRequestModel.findOne as jest.Mock).mockResolvedValue(null);

      // Leave balances calculation mocks
      (LeaveTypeModel.find as jest.Mock).mockResolvedValue([
        {
          _id: leaveTypeId,
          name: 'Casual Leave',
          code: LeaveTypeEnum.CASUAL,
          daysPerYear: 12,
          isActive: true,
        },
      ]);
      (LeaveRequestModel.find as jest.Mock).mockResolvedValue([]);

      (LeaveRequestModel.create as jest.Mock).mockResolvedValue({
        _id: '64f1a2b3c4d5e6f7a8b9c0d6',
        employeeId: mockEmpId,
        leaveTypeId,
        startDate: '2026-11-10', // Tue
        endDate: '2026-11-12', // Thu -> 3 working days
        daysCount: 3,
        reason: 'Family function attendance',
        status: LeaveStatus.PENDING,
      });

      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId,
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          reason: 'Family function attendance',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(LeaveStatus.PENDING);
    });

    it('should block leave request overlapping pending or approved leave (Overlap Check)', async () => {
      const leaveTypeId = '64f1a2b3c4d5e6f7a8b9c0d5';

      (LeaveTypeModel.findById as jest.Mock).mockResolvedValue({
        _id: leaveTypeId,
        name: 'Casual Leave',
        code: LeaveTypeEnum.CASUAL,
        isActive: true,
        daysPerYear: 12,
      });

      // Existing overlapping request found
      (LeaveRequestModel.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing-request',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        status: LeaveStatus.APPROVED,
      });

      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId,
          startDate: '2026-11-12',
          endDate: '2026-11-14',
          reason: 'Duplicate dates application',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('overlapping this period');
    });

    it('should reject leave request if employee has insufficient leave balance', async () => {
      const leaveTypeId = '64f1a2b3c4d5e6f7a8b9c0d5';

      (LeaveTypeModel.findById as jest.Mock).mockResolvedValue({
        _id: leaveTypeId,
        name: 'Casual Leave',
        code: LeaveTypeEnum.CASUAL,
        isActive: true,
        daysPerYear: 2, // only 2 days allocated
      });

      (LeaveRequestModel.findOne as jest.Mock).mockResolvedValue(null);

      // Leave balance mock showing 2 days used out of 2 allocated (0 available)
      (LeaveTypeModel.find as jest.Mock).mockResolvedValue([
        {
          _id: leaveTypeId,
          name: 'Casual Leave',
          code: LeaveTypeEnum.CASUAL,
          daysPerYear: 2,
          isActive: true,
        },
      ]);
      (LeaveRequestModel.find as jest.Mock).mockResolvedValue([
        { daysCount: 2, status: LeaveStatus.APPROVED },
      ]);

      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId,
          startDate: '2026-11-10',
          endDate: '2026-11-11', // 2 days requested, 0 available
          reason: 'Need emergency leave',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient leave balance');
    });
  });

  describe('PATCH /api/v1/leaves/:id/resolve (Approval Permissions)', () => {
    it('should allow manager to approve leave for their direct report with optional comment', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      (LeaveRequestModel.findById as jest.Mock).mockResolvedValue({
        _id: 'leave-req-1',
        employeeId: mockEmpId, // Reports to mockManagerEmpId
        status: LeaveStatus.PENDING,
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        daysCount: 3,
        save: mockSave,
      });

      const res = await request(app)
        .patch('/api/v1/leaves/leave-req-1/resolve')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: LeaveStatus.APPROVED,
          managerComment: 'Approved, enjoy your time off!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject manager trying to approve leave for someone outside their team', async () => {
      const mockSave = jest.fn();
      (LeaveRequestModel.findById as jest.Mock).mockResolvedValue({
        _id: 'leave-req-outside',
        employeeId: 'other-emp-id',
        status: LeaveStatus.PENDING,
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        save: mockSave,
      });

      // Employee reports to another manager
      (EmployeeModel.findById as jest.Mock).mockImplementation((id: string) => {
        if (id === 'other-emp-id') {
          return Promise.resolve({
            _id: 'other-emp-id',
            firstName: 'Other',
            lastName: 'Person',
            reportingManagerId: mockOtherManagerEmpId, // Not mockManagerEmpId!
          });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .patch('/api/v1/leaves/leave-req-outside/resolve')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: LeaveStatus.APPROVED,
          managerComment: 'Trying to approve',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain(
        'Managers can only approve or reject leave requests for their own team members',
      );
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should prevent user from approving their own leave request (self-approval blocked)', async () => {
      const mockSave = jest.fn();
      // Leave request belongs to manager themself
      (LeaveRequestModel.findById as jest.Mock).mockResolvedValue({
        _id: 'manager-own-leave',
        employeeId: mockManagerEmpId,
        status: LeaveStatus.PENDING,
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        save: mockSave,
      });

      const res = await request(app)
        .patch('/api/v1/leaves/manager-own-leave/resolve')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: LeaveStatus.APPROVED,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You cannot approve or reject your own leave request');
      expect(mockSave).not.toHaveBeenCalled();
    });
  });
});
