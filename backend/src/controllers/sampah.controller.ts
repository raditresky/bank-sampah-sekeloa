import { Request, Response, NextFunction } from 'express';
import { sampahService } from '../services/sampah.service';
import { sendSuccess } from '../utils/response.util';

export class SampahController {
  async getKatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const katalog = await sampahService.getKatalog(req.query as any);
      return sendSuccess(res, katalog, 'Daftar katalog sampah berhasil diambil.');
    } catch (error) {
      next(error);
    }
  }

  async updateHarga(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await sampahService.updateHarga(id, req.body);
      return sendSuccess(res, updated, `Harga untuk kode '${id}' berhasil diperbarui.`);
    } catch (error) {
      next(error);
    }
  }
}

export const sampahController = new SampahController();
