import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { pencairanService } from '../services/pencairan.service';
import { sendSuccess } from '../utils/response.util';

export class PencairanController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await pencairanService.createPencairan(req.user!, req.body);
      return sendSuccess(
        res,
        result,
        `Pengajuan pencairan sebesar Rp ${Number(result.jumlahNominal).toLocaleString(
          'id-ID'
        )} berhasil dikirimkan ke pengurus RW.`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getPending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const results = await pencairanService.getPendingRequests(req.user!);
      return sendSuccess(res, results, 'Daftar permohonan pencairan pending berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as any;
      const results = await pencairanService.getAllRequests(req.user!, status);
      return sendSuccess(res, results, 'Daftar riwayat pencairan berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const catatan = req.body?.catatanPetugas as string | undefined;
      const result = await pencairanService.approvePencairan(req.user!, id, catatan);
      return sendSuccess(
        res,
        result,
        `Permohonan pencairan berhasil disetujui. Saldo nasabah telah diperbarui.`
      );
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const catatan = req.body?.catatanPetugas as string | undefined;
      const result = await pencairanService.rejectPencairan(req.user!, id, catatan);
      return sendSuccess(res, result, 'Permohonan pencairan telah ditolak.');
    } catch (error) {
      next(error);
    }
  }
}

export const pencairanController = new PencairanController();
