import { prisma } from '../config/prisma';
import { StatusPembayaran, Prisma } from '@prisma/client';
import { generateNomorTransaksi } from '../utils/transaction-code.util';

export interface CreateTransaksiPayload {
  userId: string;
  petugasId: string;
  rwPos: string;
  statusPembayaran: StatusPembayaran;
  clientOfflineId?: string | null;
  totalBerat: number;
  totalHarga: number;
  items: {
    sampahAnorganikId: string;
    kuantitas: number;
    hargaSatuan: number;
    subtotal: number;
  }[];
}

export class TransaksiRepository {
  async findByClientOfflineId(clientOfflineId: string) {
    return prisma.transaksiSampah.findUnique({
      where: { clientOfflineId },
      include: {
        items: {
          include: {
            sampah: true,
          },
        },
        warga: {
          select: {
            id: true,
            nama: true,
            kodeNasabah: true,
            nomorHp: true,
            rw: true,
            rt: true,
            saldoTabungan: true,
          },
        },
        petugas: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });
  }

  async createTransaksiWithTransaction(payload: CreateTransaksiPayload) {
    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check untuk PWA Offline Sync
      if (payload.clientOfflineId) {
        const existingTrx = await tx.transaksiSampah.findUnique({
          where: { clientOfflineId: payload.clientOfflineId },
          include: {
            items: {
              include: {
                sampah: true,
              },
            },
            warga: true,
            petugas: true,
          },
        });

        if (existingTrx) {
          return existingTrx;
        }
      }

      const nomorTransaksi = generateNomorTransaksi();

      // 2. Buat Record Header Transaksi & Detail Items
      const createdTransaksi = await tx.transaksiSampah.create({
        data: {
          nomorTransaksi,
          userId: payload.userId,
          petugasId: payload.petugasId,
          rwPos: payload.rwPos,
          totalBerat: new Prisma.Decimal(payload.totalBerat),
          totalHarga: new Prisma.Decimal(payload.totalHarga),
          statusPembayaran: payload.statusPembayaran,
          clientOfflineId: payload.clientOfflineId || null,
          items: {
            create: payload.items.map((item) => ({
              sampahAnorganikId: item.sampahAnorganikId,
              kuantitas: new Prisma.Decimal(item.kuantitas),
              hargaSatuan: new Prisma.Decimal(item.hargaSatuan),
              subtotal: new Prisma.Decimal(item.subtotal),
            })),
          },
        },
        include: {
          items: {
            include: {
              sampah: true,
            },
          },
          warga: {
            select: {
              id: true,
              nama: true,
              kodeNasabah: true,
              nomorHp: true,
              rw: true,
              rt: true,
              saldoTabungan: true,
            },
          },
          petugas: {
            select: {
              id: true,
              nama: true,
              role: true,
            },
          },
        },
      });

      // 3. Mutasi Saldo
      if (payload.statusPembayaran === StatusPembayaran.TABUNGAN) {
        // Tabungan: Saldo nasabah bertambah
        await tx.user.update({
          where: { id: payload.userId },
          data: {
            saldoTabungan: {
              increment: new Prisma.Decimal(payload.totalHarga),
            },
          },
        });
      } else if (payload.statusPembayaran === StatusPembayaran.TUNAI) {
        // Tunai: Saldo Kas Pos RW terpotong
        await tx.kasPos.update({
          where: { rw: payload.rwPos },
          data: {
            saldoKas: {
              decrement: new Prisma.Decimal(payload.totalHarga),
            },
          },
        });
      }

      return createdTransaksi;
    });
  }

  async findById(id: string) {
    return prisma.transaksiSampah.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sampah: true,
          },
        },
        warga: {
          select: {
            id: true,
            nama: true,
            kodeNasabah: true,
            nomorHp: true,
            rw: true,
            rt: true,
            saldoTabungan: true,
          },
        },
        petugas: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    rwPos?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    take?: number;
    skip?: number;
  }) {
    const { rwPos, userId, startDate, endDate, take = 50, skip = 0 } = params;

    const where: Prisma.TransaksiSampahWhereInput = {};

    if (rwPos) {
      where.rwPos = rwPos;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [total, items] = await Promise.all([
      prisma.transaksiSampah.count({ where }),
      prisma.transaksiSampah.findMany({
        where,
        include: {
          items: {
            include: {
              sampah: true,
            },
          },
          warga: {
            select: {
              id: true,
              nama: true,
              kodeNasabah: true,
              nomorHp: true,
              rw: true,
              rt: true,
            },
          },
          petugas: {
            select: {
              id: true,
              nama: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    return { total, items };
  }
}

export const transaksiRepository = new TransaksiRepository();

