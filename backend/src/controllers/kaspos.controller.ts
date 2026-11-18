import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { kasPosService } from '../services/kaspos.service';
import { sendSuccess } from '../utils/response.util';

export class KasPosController {
  async getPetugasKasList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const list = await kasPosService.getPetugasKasList(req.user!);
      return sendSuccess(res, list, 'Daftar kas petugas berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }

  async updateSaldoKas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await kasPosService.updateSaldoKas(req.user!, req.body);
      return sendSuccess(
        res,
        result,
        `Saldo kas untuk ${result.nama} berhasil diperbarui menjadi Rp ${Number(
          result.saldoKas
        ).toLocaleString('id-ID')}.`
      );
    } catch (error) {
      next(error);
    }
  }
}

export const kasPosController = new KasPosController();
