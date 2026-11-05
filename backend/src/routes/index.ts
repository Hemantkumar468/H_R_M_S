import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { departmentRoutes } from './department.routes';
import { designationRoutes } from './designation.routes';
import { employeeRoutes } from './employee.routes';
import { attendanceRoutes } from './attendance.routes';
import { leaveRoutes } from './leave.routes';
import { holidayRoutes } from './holiday.routes';
import { payrollRoutes } from './payroll.routes';
import { auditLogRoutes } from './auditLog.routes';
import { notificationRoutes } from './notification.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/payroll', payrollRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);

export const apiRoutes = router;
