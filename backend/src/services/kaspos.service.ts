import { prisma } from '../config/prisma';
import { JwtPayload } from '../utils/jwt.util';
import { Prisma } from '@prisma/client';
import { UpdateSaldoKasInput } from '../validations/kaspos.validation';

export class KasPosService {
  async getPetugasKasList(currentUser: JwtPayload) {
    // Ambil data kas pos RW petugas saat ini agar tersinkronisasi per RW
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        nama: true,
        nomorHp: true,
        role: true,
        rw: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return [];
    }

    // Saldo kas otomatis dihitung dari akumulasi transaksi setoran dikurangi pencairan yang disetujui di RW
    const totalSetoranAgg = await prisma.transaksiSampah.aggregate({
      where: { rwPos: user.rw },
      _sum: { totalHarga: true },
    });
    const totalSetoranRw = Number(totalSetoranAgg._sum.totalHarga || 0);

    const totalPencairanAgg = await prisma.pencairanTabungan.aggregate({
      where: {
        rwPos: user.rw,
        status: 'DISETUJUI',
      },
      _sum: { jumlahNominal: true },
    });
    const totalPencairanRw = Number(totalPencairanAgg._sum.jumlahNominal || 0);

    const saldoKasRw = Math.max(0, totalSetoranRw - totalPencairanRw);

    return [
      {
        id: user.id,
        nama: user.nama,
        nomorHp: user.nomorHp,
        role: user.role,
        rw: user.rw,
        saldoKas: saldoKasRw,
        updatedAt: kasPos?.updatedAt || user.updatedAt,
      },
    ];
  }

  async updateSaldoKas(currentUser: JwtPayload, input: UpdateSaldoKasInput) {
    throw new Error('Saldo kas dihitung otomatis dari akumulasi transaksi nasabah dan pencairan per RW, sehingga tidak dapat diubah manual.');
  }
}

export const kasPosService = new KasPosService();
