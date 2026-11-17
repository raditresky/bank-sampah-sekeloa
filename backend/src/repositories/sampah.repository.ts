import { prisma } from '../config/prisma';
import { KategoriSampah, Prisma } from '@prisma/client';

export class SampahRepository {
  async findAll(params: {
    kategori?: KategoriSampah;
    search?: string;
    satuan?: string;
    isActive?: boolean;
  }) {
    const { kategori, search, satuan, isActive = true } = params;

    const where: Prisma.SampahAnorganikWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (kategori) {
      where.kategori = kategori;
    }

    if (satuan) {
      where.satuan = satuan;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { id: { contains: search } },
        { nama: { contains: search } },
        { deskripsi: { contains: search } },
      ];
    }

    return prisma.sampahAnorganik.findMany({
      where,
      orderBy: [{ kategori: 'asc' }, { id: 'asc' }],
    });
  }

  async findById(id: string) {
    return prisma.sampahAnorganik.findUnique({
      where: { id },
    });
  }

  async findManyByIds(ids: string[]) {
    return prisma.sampahAnorganik.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async updateHarga(id: string, hargaSatuan: number) {
    return prisma.sampahAnorganik.update({
      where: { id },
      data: {
        hargaSatuan,
      },
    });
  }
}

export const sampahRepository = new SampahRepository();

