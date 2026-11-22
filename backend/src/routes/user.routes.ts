import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { registerSchema } from '../validations/auth.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Endpoint khusus Admin RW: Buat Nasabah Baru di RW
router.post(
  '/nasabah',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(registerSchema),
  (req: any, res, next) => userController.createNasabah(req, res, next)
);

// Endpoint khusus Admin RW: Cari nasabah
router.get(
  '/nasabah',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => userController.searchNasabah(req, res, next)
);

router.get(
  '/qr/:kodeNasabah',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => userController.getByKodeNasabah(req, res, next)
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => userController.getById(req, res, next)
);

export default router;

