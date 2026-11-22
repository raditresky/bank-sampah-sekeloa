import { Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export class UserController {
  async createNasabah(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Pastikan role yang didaftarkan lewat admin adalah WARGA
      // Simpan informasi admin pendaftar ke field unitBankSampah (contoh: "Didaftarkan oleh Admin: Budi (RW 08)")
      const adminNama = req.user?.nama || 'Petugas RW';
      const adminRw = req.user?.rw || 'RW 08';
      const pendaftarInfo = `Didaftarkan oleh Admin: ${adminNama} (${adminRw})`;

      const payload = {
        ...req.body,
        role: UserRole.WARGA,
        rw: req.body.rw || req.user?.rw || 'RW 08',
        unitBankSampah: pendaftarInfo,
      };
      const result = await authService.register(payload);
      return sendSuccess(res, result.user, 'Nasabah baru berhasil didaftarkan.', 201);
    } catch (error) {
      next(error);
    }
  }

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

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await userRepository.findById(id);

      if (!user) {
        return sendError(res, `Nasabah dengan ID '${id}' tidak ditemukan.`, 404);
      }

      const { passwordHash: _, ...safeUser } = user;
      return sendSuccess(res, safeUser, 'Data nasabah berhasil ditemukan.');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
