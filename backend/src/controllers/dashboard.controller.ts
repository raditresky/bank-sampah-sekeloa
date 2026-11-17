import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DashboardController {
  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary(req.user!);
      return sendSuccess(res, summary, 'Ringkasan dashboard berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

