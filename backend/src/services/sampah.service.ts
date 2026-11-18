import { env } from '../config/env';
import { sampahRepository } from '../repositories/sampah.repository';
import {
  QueryKatalogInput,
  UpdateHargaInput,
  CreateSampahInput,
  UpdateSampahInput,
} from '../validations/sampah.validation';

export class SampahService {
  private verifyPassword(providedPassword?: string) {
    if (!providedPassword || providedPassword.trim() !== env.KATALOG_PASSWORD) {
      const error: any = new Error(
        'Kata sandi otorisasi katalog salah! Perubahan ditolak.'
      );
      error.statusCode = 403;
      throw error;
    }
  }

  async getKatalog(query: QueryKatalogInput) {
    return sampahRepository.findAll({
      kategori: query.kategori,
      search: query.search,
      satuan: query.satuan,
      isActive: true,
    });
  }

  async createSampah(input: CreateSampahInput) {
    this.verifyPassword(input.adminPassword);

    const existing = await sampahRepository.findById(input.id);
    if (existing) {
      const error: any = new Error(`Kode sampah '${input.id}' sudah digunakan.`);
      error.statusCode = 409;
      throw error;
    }

    const { adminPassword: _, ...createData } = input;
    return sampahRepository.create(createData);
  }

  async updateSampah(id: string, input: UpdateSampahInput) {
    this.verifyPassword(input.adminPassword);

    const existing = await sampahRepository.findById(id);
    if (!existing) {
      const error: any = new Error(`Item sampah dengan kode '${id}' tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }

    const { adminPassword: _, ...updateData } = input;
    return sampahRepository.update(id, updateData);
  }

  async deleteSampah(id: string, password?: string) {
    this.verifyPassword(password);

    const existing = await sampahRepository.findById(id);
    if (!existing) {
      const error: any = new Error(`Item sampah dengan kode '${id}' tidak ditemukan.`);
      error.statusCode = 404;
      throw error;
    }
    return sampahRepository.delete(id);
  }

  async updateHarga(id: string, input: UpdateHargaInput) {
    if (input.adminPassword) {
      this.verifyPassword(input.adminPassword);
    }

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

