import { Router } from 'express';
import { DesignationController } from '../controllers/designation.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

router.get('/', DesignationController.list);
router.get('/:id', DesignationController.getById);

// Admin-only management
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  DesignationController.create,
);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  DesignationController.update,
);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  DesignationController.delete,
);

export const designationRoutes = router;
