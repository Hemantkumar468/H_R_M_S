import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

// Employee operations
router.post('/check-in', AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);
router.get('/today', AttendanceController.getTodayStatus);
router.get('/my', AttendanceController.getMyAttendance);
router.post('/regularize', AttendanceController.requestRegularization);

// Manager / HR operations
router.get('/team', AttendanceController.getTeamAttendance);
router.get(
  '/regularizations/pending',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  AttendanceController.listPendingRegularizations,
);
router.patch(
  '/regularizations/:id/resolve',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  AttendanceController.resolveRegularization,
);

export const attendanceRoutes = router;
