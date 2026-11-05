import { Router } from 'express';
import { HolidayController } from '../controllers/holiday.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@hrms/shared';

const router = Router();

router.use(authenticate);

router.get('/', HolidayController.list);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN), HolidayController.create);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.HR_ADMIN),
  HolidayController.delete,
);

export const holidayRoutes = router;
