import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

router.get('/', DepartmentController.list);
router.get('/:id', DepartmentController.getById);

// Admin-only management
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN), DepartmentController.create);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  DepartmentController.update,
);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  DepartmentController.delete,
);

export const departmentRoutes = router;
