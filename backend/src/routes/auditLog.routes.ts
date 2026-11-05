import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN));

router.get('/', AuditLogController.list);

export const auditLogRoutes = router;
