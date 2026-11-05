import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

// Employee operations
router.get('/my-payslips', PayrollController.getMyPayslips);
router.get('/payslips/:id/download', PayrollController.downloadPayslip);

// Admin & HR operations
router.get(
  '/structure/:employeeId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  PayrollController.getSalaryStructure,
);
router.post(
  '/structure/:employeeId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  PayrollController.upsertSalaryStructure,
);
router.post(
  '/run',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  PayrollController.runPayroll,
);
router.get(
  '/monthly',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  PayrollController.listMonthlyPayroll,
);

export const payrollRoutes = router;
