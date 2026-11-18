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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await sampahService.createSampah(req.body);
      return sendSuccess(
        res,
        created,
        `Item sampah '${created.nama}' berhasil ditambahkan ke katalog.`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await sampahService.updateSampah(id, req.body);
      return sendSuccess(res, updated, `Item sampah '${updated.nama}' berhasil diperbarui.`);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const password =
        (req.headers['x-katalog-password'] as string) ||
        (req.query.password as string) ||
        (req.body?.adminPassword as string);
      const result = await sampahService.deleteSampah(id, password);
      return sendSuccess(res, result, `Item sampah dengan kode '${id}' berhasil dihapus.`);
    } catch (error) {
      next(error);
    }
  }
}

export const sampahController = new SampahController();
