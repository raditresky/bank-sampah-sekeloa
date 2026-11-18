import { Router } from 'express';
import { transaksiController } from '../controllers/transaksi.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createTransaksiSchema } from '../validations/transaksi.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// POST /api/v1/transaksi - Hanya Admin RW
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(createTransaksiSchema),
  (req: any, res, next) => transaksiController.create(req, res, next)
);

// GET /api/v1/transaksi - Seluruh user terautentikasi (Admin melihat RW, Warga melihat miliknya)
router.get('/', authenticate, (req: any, res, next) =>
  transaksiController.getRiwayat(req, res, next)
);

// GET /api/v1/transaksi/:id - Struk digital detail
router.get('/:id', authenticate, (req: any, res, next) =>
  transaksiController.getDetail(req, res, next)
);

export default router;

