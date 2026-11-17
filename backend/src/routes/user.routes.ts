import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Endpoint khusus Admin RW & Petugas Bank Sampah
router.get(
  '/nasabah',
  authenticate,
  requireRole(UserRole.ADMIN_RW, UserRole.PETUGAS_BANK_SAMPAH),
  (req: any, res, next) => userController.searchNasabah(req, res, next)
);

router.get(
  '/qr/:kodeNasabah',
  authenticate,
  requireRole(UserRole.ADMIN_RW, UserRole.PETUGAS_BANK_SAMPAH),
  (req: any, res, next) => userController.getByKodeNasabah(req, res, next)
);

export default router;

