import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { documentUpload } from '../config/multer';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

// List & Read
router.get('/', EmployeeController.list);
router.get('/:id', EmployeeController.getById);

// Create
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN), EmployeeController.create);

// Update profile
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  EmployeeController.update,
);

// Update employment status (active, probation, notice, exited)
router.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  EmployeeController.updateStatus,
);

// Upload document with Multer
router.post(
  '/:id/documents',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  documentUpload.single('file'),
  EmployeeController.uploadDocument,
);

// Delete document
router.delete(
  '/:id/documents/:documentId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  EmployeeController.deleteDocument,
);

// Delete / Archive employee
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  EmployeeController.delete,
);

export const employeeRoutes = router;
