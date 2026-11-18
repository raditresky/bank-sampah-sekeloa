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

  async create(data: {
    id: string;
    kategori: KategoriSampah;
    nama: string;
    satuan?: string;
    deskripsi?: string | null;
    hargaSatuan: number;
    isActive?: boolean;
  }) {
    return prisma.sampahAnorganik.create({
      data: {
        id: data.id,
        kategori: data.kategori,
        nama: data.nama,
        satuan: data.satuan || 'Kg',
        deskripsi: data.deskripsi || null,
        hargaSatuan: data.hargaSatuan,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      kategori: KategoriSampah;
      nama: string;
      satuan: string;
      deskripsi: string | null;
      hargaSatuan: number;
      isActive: boolean;
    }>
  ) {
    return prisma.sampahAnorganik.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const txCount = await prisma.detailTransaksiSampah.count({
      where: { sampahAnorganikId: id },
    });

    if (txCount > 0) {
      // Soft-delete jika sudah ada riwayat transaksi
      return prisma.sampahAnorganik.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Hard-delete jika belum pernah dipakai transaksi
    return prisma.sampahAnorganik.delete({
      where: { id },
    });
  }
}

export const sampahRepository = new SampahRepository();

