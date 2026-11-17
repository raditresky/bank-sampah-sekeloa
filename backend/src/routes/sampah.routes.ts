import { Router } from 'express';
import { sampahController } from '../controllers/sampah.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { updateHargaSchema, queryKatalogSchema } from '../validations/sampah.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/v1/sampah - Bisa diakses semua user terautentikasi
router.get(
  '/',
  authenticate,
  validateQuery(queryKatalogSchema),
  (req, res, next) => sampahController.getKatalog(req, res, next)
);

// PATCH /api/v1/sampah/:id/harga - Khusus Admin RW & Petugas Bank Sampah
router.patch(
  '/:id/harga',
  authenticate,
  requireRole(UserRole.ADMIN_RW, UserRole.PETUGAS_BANK_SAMPAH),
  validateBody(updateHargaSchema),
  (req, res, next) => sampahController.updateHarga(req, res, next)
);

export default router;

