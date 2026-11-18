import { Router } from 'express';
import { sampahController } from '../controllers/sampah.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  updateHargaSchema,
  queryKatalogSchema,
  createSampahSchema,
  updateSampahSchema,
} from '../validations/sampah.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/v1/sampah - Bisa diakses semua user terautentikasi
router.get(
  '/',
  authenticate,
  validateQuery(queryKatalogSchema),
  (req, res, next) => sampahController.getKatalog(req, res, next)
);

// POST /api/v1/sampah - Khusus Admin RW
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(createSampahSchema),
  (req, res, next) => sampahController.create(req, res, next)
);

// PUT /api/v1/sampah/:id - Khusus Admin RW
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(updateSampahSchema),
  (req, res, next) => sampahController.update(req, res, next)
);

// DELETE /api/v1/sampah/:id - Khusus Admin RW
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req, res, next) => sampahController.delete(req, res, next)
);

// PATCH /api/v1/sampah/:id/harga - Khusus Admin RW
router.patch(
  '/:id/harga',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  validateBody(updateHargaSchema),
  (req, res, next) => sampahController.updateHarga(req, res, next)
);

export default router;

