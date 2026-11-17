import { sampahRepository } from '../repositories/sampah.repository';
import { QueryKatalogInput, UpdateHargaInput } from '../validations/sampah.validation';

export class SampahService {
  async getKatalog(query: QueryKatalogInput) {
    return sampahRepository.findAll({
      kategori: query.kategori,
      search: query.search,
      satuan: query.satuan,
      isActive: true,
    });
  }

  async updateHarga(id: string, input: UpdateHargaInput) {
    const existing = await sampahRepository.findById(id);
    if (!existing) {
      const error: any = new Error(`Item sampah dengan kode '${id}' tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    return sampahRepository.updateHarga(id, input.hargaSatuan);
  }
}

export const sampahService = new SampahService();

