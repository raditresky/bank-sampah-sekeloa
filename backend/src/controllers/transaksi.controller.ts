import { Response, NextFunction } from 'express';
import { transaksiService } from '../services/transaksi.service';
import { sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class TransaksiController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transaksiService.createTransaksi(req.user!, req.body);
      return sendSuccess(res, result, 'Transaksi penimbangan berhasil dicatat.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getRiwayat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transaksiService.getRiwayat(req.user!, req.query as any);
      return sendSuccess(res, result, 'Riwayat transaksi berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await transaksiService.getDetail(id, req.user!);
      return sendSuccess(res, result, 'Detail struk digital berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }
}

export const transaksiController = new TransaksiController();
