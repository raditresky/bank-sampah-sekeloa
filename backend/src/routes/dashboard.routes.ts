import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/dashboard/summary - Role-adaptive dashboard summary
router.get('/summary', authenticate, (req: any, res, next) =>
  dashboardController.getSummary(req, res, next)
);

export default router;

