import { prisma } from '../config/prisma';
import { kasPosRepository } from '../repositories/kaspos.repository';
import { userRepository } from '../repositories/user.repository';
import { JwtPayload } from '../utils/jwt.util';
import { UserRole } from '@prisma/client';

export class DashboardService {
  async getSummary(user: JwtPayload) {
    if (user.role === UserRole.WARGA) {
      return this.getWargaSummary(user.id);
    } else {
      return this.getAdminSummary(user);
    }
  }

  private async getWargaSummary(userId: string) {
    const warga = await userRepository.findById(userId);
    if (!warga) {
      const error: any = new Error('Pengguna tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    // 1. Hitung total tabungan dari setoran sampah bertipe TABUNGAN
    const setoranTabunganAgg = await prisma.transaksiSampah.aggregate({
      where: {
        userId,
        statusPembayaran: 'TABUNGAN',
      },
      _sum: {
        totalHarga: true,
      },
    });
    const totalSetoranTabungan = Number(setoranTabunganAgg._sum.totalHarga || 0);

    // 2. Hitung total pencairan tabungan yang telah DISETUJUI
    const pencairanAgg = await prisma.pencairanTabungan.aggregate({
      where: {
        userId,
        status: 'DISETUJUI',
      },
      _sum: {
        jumlahNominal: true,
      },
    });
    const totalPencairanDisetujui = Number(pencairanAgg._sum.jumlahNominal || 0);

    // Saldo tabungan riil: akumulasi setoran tabungan - pencairan disetujui (minimal 0)
    // Ditambahkan dengan nilai saldoTabungan manual jika ada saldo awal
    const saldoTabunganDihitung = Math.max(0, totalSetoranTabungan - totalPencairanDisetujui);
    const saldoTabunganAkhir = saldoTabunganDihitung > 0 ? saldoTabunganDihitung : Number(warga.saldoTabungan || 0);

    // Agregasi seluruh transaksi warga (berat & nilai disetor)
    const agregasi = await prisma.transaksiSampah.aggregate({
      where: { userId },
      _sum: {
        totalBerat: true,
        totalHarga: true,
      },
      _count: {
        id: true,
      },
    });

    const transaksiTerakhir = await prisma.transaksiSampah.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            sampah: true,
          },
        },
      },
    });

    return {
      role: UserRole.WARGA,
      nasabah: {
        id: warga.id,
        nama: warga.nama,
        kodeNasabah: warga.kodeNasabah,
        nomorHp: warga.nomorHp,
        rw: warga.rw,
        rt: warga.rt,
        saldoTabungan: saldoTabunganAkhir,
      },
      statistik: {
        totalBeratDisetor: Number(agregasi._sum.totalBerat || 0),
        totalNilaiDisetor: Number(agregasi._sum.totalHarga || 0),
        totalFrekuensiSetoran: agregasi._count.id,
      },
      transaksiTerakhir,
    };
  }

  private async getAdminSummary(user: JwtPayload) {
    const rw = user.rw;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Kas Pos RW dihitung otomatis:
    // Saldo Kas = Total Nilai Transaksi Setoran Sampah di RW tersebut - Total Pencairan Tabungan yang Telah Disetujui di RW tersebut
    const totalSetoranAgg = await prisma.transaksiSampah.aggregate({
      where: { rwPos: rw },
      _sum: { totalHarga: true },
    });
    const totalSetoranRw = Number(totalSetoranAgg._sum.totalHarga || 0);

    const totalPencairanAgg = await prisma.pencairanTabungan.aggregate({
      where: {
        rwPos: rw,
        status: 'DISETUJUI',
      },
      _sum: { jumlahNominal: true },
    });
    const totalPencairanRw = Number(totalPencairanAgg._sum.jumlahNominal || 0);

    // Saldo kas riil saat ini (tidak boleh negatif)
    const saldoKasRw = Math.max(0, totalSetoranRw - totalPencairanRw);

    const kasPos = await kasPosRepository.findByRw(rw);

    // Transaksi hari ini di RW
    const transaksiHariIni = await prisma.transaksiSampah.findMany({
      where: {
        rwPos: rw,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        userId: true,
        totalBerat: true,
        totalHarga: true,
      },
    });

    let totalKgHariIni = 0;
    let nilaiTransaksiHariIni = 0;
    const uniqueWargaHariIni = new Set<string>();

    for (const trx of transaksiHariIni) {
      totalKgHariIni += Number(trx.totalBerat);
      nilaiTransaksiHariIni += Number(trx.totalHarga);
      uniqueWargaHariIni.add(trx.userId);
    }

    // 5 Transaksi Terkini di RW
    const transaksiTerkini = await prisma.transaksiSampah.findMany({
      where: { rwPos: rw },
      include: {
        warga: {
          select: {
            nama: true,
            kodeNasabah: true,
            rw: true,
            rt: true,
          },
        },
        petugas: {
          select: {
            nama: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const targetKg = kasPos ? Number(kasPos.targetKg) : 500;
    const progressPersen = Math.min(100, Math.round((totalKgHariIni / targetKg) * 100));

    return {
      role: 'ADMIN_OR_PETUGAS',
      pos: {
        rw,
        namaUnit: kasPos?.namaUnit || `Pos Sampiah ${rw}`,
        saldoKas: saldoKasRw,
        targetKg,
        progressPersen,
      },
      statistikHariIni: {
        totalKg: Math.round(totalKgHariIni * 100) / 100,
        nilaiTransaksi: nilaiTransaksiHariIni,
        wargaMenyetor: uniqueWargaHariIni.size,
      },
      transaksiTerkini,
    };
  }
}

export const dashboardService = new DashboardService();

