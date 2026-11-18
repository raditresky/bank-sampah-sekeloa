import { Router } from 'express';
import { pencairanController } from '../controllers/pencairan.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createPencairanSchema } from '../validations/pencairan.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// POST /api/v1/pencairan - Warga mengajukan pencairan saldo
router.post(
  '/',
  authenticate,
  validateBody(createPencairanSchema),
  (req: any, res, next) => pencairanController.create(req, res, next)
);

// GET /api/v1/pencairan - Mengambil daftar pencairan (Warga / Admin)
router.get('/', authenticate, (req: any, res, next) =>
  pencairanController.getAll(req, res, next)
);

// GET /api/v1/pencairan/pending - Khusus Admin RW melihat antrean pencairan
router.get(
  '/pending',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => pencairanController.getPending(req, res, next)
);

// POST /api/v1/pencairan/:id/approve - Khusus Admin RW menyetujui pencairan
router.post(
  '/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => pencairanController.approve(req, res, next)
);

// POST /api/v1/pencairan/:id/reject - Khusus Admin RW menolak pencairan
router.post(
  '/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN_RW),
  (req: any, res, next) => pencairanController.reject(req, res, next)
);

export default router;
