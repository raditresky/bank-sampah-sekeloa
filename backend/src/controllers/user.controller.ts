import { Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { sendSuccess, sendError } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  async searchNasabah(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string | undefined;
      const rw = (req.query.rw as string | undefined) || req.user?.rw;

      const nasabah = await userRepository.searchNasabah({ query: q, rw });
      return sendSuccess(res, nasabah, 'Pencarian nasabah berhasil.');
    } catch (error) {
      next(error);
    }
  }

  async getByKodeNasabah(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const kodeNasabah = req.params.kodeNasabah as string;
      const user = await userRepository.findByKodeNasabah(kodeNasabah);

      if (!user) {
        return sendError(res, `Nasabah dengan kode '${kodeNasabah}' tidak ditemukan.`, 404);
      }

      const { passwordHash: _, ...safeUser } = user;
      return sendSuccess(res, safeUser, 'Data nasabah berhasil ditemukan.');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
