import { Router } from 'express';
import { kasPosController } from '../controllers/kaspos.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateSaldoKasSchema } from '../validations/kaspos.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/v1/kaspos/petugas - Ambil data kas user sendiri
router.get(
  '/petugas',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => kasPosController.getPetugasKasList(req, res, next)
);

// PUT /api/v1/kaspos/update - Update saldo kas user sendiri
router.put(
  '/update',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(updateSaldoKasSchema),
  (req: any, res, next) => kasPosController.updateSaldoKas(req, res, next)
);

export default router;
