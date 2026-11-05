import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

// Public / common leave routes
router.get('/types', LeaveController.getLeaveTypes);
router.post(
  '/types',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  LeaveController.createLeaveType,
);

// Employee operations
router.post('/apply', LeaveController.apply);
router.get('/my', LeaveController.getMyLeaves);
router.get('/balances', LeaveController.getMyBalances);

// Specific employee leave records (HR / Manager)
router.get(
  '/employee/:employeeId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  LeaveController.getByEmployeeId,
);
router.get(
  '/employee/:employeeId/balances',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  LeaveController.getBalancesByEmployeeId,
);

// Team calendar
router.get('/calendar', LeaveController.getTeamCalendar);

// Manager / Admin approval
router.get(
  '/pending',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  LeaveController.listPending,
);
router.patch(
  '/:id/resolve',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER),
  LeaveController.resolve,
);

export const leaveRoutes = router;
