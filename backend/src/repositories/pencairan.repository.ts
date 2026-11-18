import { prisma } from '../config/prisma';
import { StatusPencairan, MetodePencairan, Prisma } from '@prisma/client';

export class PencairanRepository {
  async generateNomorPencairan(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WDR-${dateStr}-${randomSuffix}`;
  }

  async create(data: {
    userId: string;
    rwPos: string;
    jumlahNominal: number;
    metode: MetodePencairan;
    infoRekening?: string | null;
    catatan?: string | null;
  }) {
    const nomorPencairan = await this.generateNomorPencairan();

    return prisma.pencairanTabungan.create({
      data: {
        nomorPencairan,
        userId: data.userId,
        rwPos: data.rwPos,
        jumlahNominal: new Prisma.Decimal(data.jumlahNominal),
        metode: data.metode,
        infoRekening: data.infoRekening || null,
        catatan: data.catatan || null,
        status: StatusPencairan.MENUNGGU,
      },
      include: {
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
      },
    });
  }

  async findById(id: string) {
    return prisma.pencairanTabungan.findUnique({
      where: { id },
      include: {
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

  async findPendingByRw(rwPos?: string) {
    const where: Prisma.PencairanTabunganWhereInput = {
      status: StatusPencairan.MENUNGGU,
    };
    if (rwPos) {
      where.rwPos = rwPos;
    }

    return prisma.pencairanTabungan.findMany({
      where,
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: {
    userId?: string;
    rwPos?: string;
    status?: StatusPencairan;
    take?: number;
    skip?: number;
  }) {
    const { userId, rwPos, status, take = 50, skip = 0 } = params;

    const where: Prisma.PencairanTabunganWhereInput = {};
    if (userId) where.userId = userId;
    if (rwPos) where.rwPos = rwPos;
    if (status) where.status = status;

    return prisma.pencairanTabungan.findMany({
      where,
      include: {
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
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async approvePencairan(id: string, petugasId: string, catatanPetugas?: string) {
    return prisma.$transaction(async (tx) => {
      const pencairan = await tx.pencairanTabungan.findUnique({
        where: { id },
        include: { warga: true },
      });

      if (!pencairan) {
        throw new Error('Permohonan pencairan tidak ditemukan.');
      }

      if (pencairan.status !== StatusPencairan.MENUNGGU) {
        throw new Error(`Permohonan ini sudah diproses (${pencairan.status}).`);
      }

      const nominal = Number(pencairan.jumlahNominal);
      const saldoSaatIni = Number(pencairan.warga.saldoTabungan);

      if (saldoSaatIni < nominal) {
        throw new Error(
          `Saldo tabungan nasabah tidak mencukupi (Tersedia: Rp ${saldoSaatIni.toLocaleString(
            'id-ID'
          )}, Diajukan: Rp ${nominal.toLocaleString('id-ID')}).`
        );
      }

      // 1. Kurangi saldo tabungan warga
      const updatedWarga = await tx.user.update({
        where: { id: pencairan.userId },
        data: {
          saldoTabungan: {
            decrement: new Prisma.Decimal(nominal),
          },
        },
      });

      // 2. Jika Tunai, kurangi Saldo Kas Pos RW jika ada
      if (pencairan.metode === MetodePencairan.TUNAI) {
        const kasPos = await tx.kasPos.findUnique({
          where: { rw: pencairan.rwPos },
        });
        if (kasPos && Number(kasPos.saldoKas) >= nominal) {
          await tx.kasPos.update({
            where: { rw: pencairan.rwPos },
            data: {
              saldoKas: {
                decrement: new Prisma.Decimal(nominal),
              },
            },
          });
        }
      }

      // 3. Update status permohonan pencairan
      const updatedPencairan = await tx.pencairanTabungan.update({
        where: { id },
        data: {
          status: StatusPencairan.DISETUJUI,
          disetujuiOlehId: petugasId,
          catatanPetugas: catatanPetugas || 'Disetujui oleh petugas RW.',
        },
        include: {
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

      return {
        pencairan: updatedPencairan,
        saldoBaruWarga: Number(updatedWarga.saldoTabungan),
      };
    });
  }

  async rejectPencairan(id: string, petugasId: string, catatanPetugas?: string) {
    const pencairan = await prisma.pencairanTabungan.findUnique({
      where: { id },
    });

    if (!pencairan) {
      throw new Error('Permohonan pencairan tidak ditemukan.');
    }

    if (pencairan.status !== StatusPencairan.MENUNGGU) {
      throw new Error(`Permohonan ini sudah diproses (${pencairan.status}).`);
    }

    return prisma.pencairanTabungan.update({
      where: { id },
      data: {
        status: StatusPencairan.DITOLAK,
        disetujuiOlehId: petugasId,
        catatanPetugas: catatanPetugas || 'Ditolak oleh petugas RW.',
      },
      include: {
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
      },
    });
  }
}

export const pencairanRepository = new PencairanRepository();
