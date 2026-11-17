import { transaksiRepository } from '../repositories/transaksi.repository';
import { sampahRepository } from '../repositories/sampah.repository';
import { userRepository } from '../repositories/user.repository';
import { kasPosRepository } from '../repositories/kaspos.repository';
import { CreateTransaksiInput } from '../validations/transaksi.validation';
import { JwtPayload } from '../utils/jwt.util';
import { StatusPembayaran, UserRole } from '@prisma/client';

export class TransaksiService {
  async createTransaksi(petugas: JwtPayload, input: CreateTransaksiInput) {
    // 1. Validasi Warga Nasabah
    const warga = await userRepository.findById(input.userId);
    if (!warga) {
      const error: any = new Error('Nasabah tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Ambil master data sampah untuk snapshot harga server-side
    const sampahIds = input.items.map((item) => item.sampahAnorganikId);
    const sampahRecords = await sampahRepository.findManyByIds(sampahIds);

    const sampahMap = new Map<string, (typeof sampahRecords)[0]>();
    sampahRecords.forEach((s) => sampahMap.set(s.id, s));

    // Validasi apakah seluruh item valid
    for (const item of input.items) {
      const sampah = sampahMap.get(item.sampahAnorganikId);
      if (!sampah) {
        const error: any = new Error(`Item sampah '${item.sampahAnorganikId}' tidak ditemukan.`);
        error.statusCode = 400;
        throw error;
      }
      if (!sampah.isActive) {
        const error: any = new Error(`Item sampah '${sampah.nama}' sedang dinonaktifkan.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Kalkulasi Server-Side Subtotal, Total Berat, & Total Harga
    let totalBerat = 0;
    let totalHarga = 0;

    const calculatedItems = input.items.map((item) => {
      const sampah = sampahMap.get(item.sampahAnorganikId)!;
      const kuantitas = Number(item.kuantitas);
      const hargaSatuan = Number(sampah.hargaSatuan);
      const subtotal = Math.round(kuantitas * hargaSatuan);

      totalBerat += kuantitas;
      totalHarga += subtotal;

      return {
        sampahAnorganikId: item.sampahAnorganikId,
        kuantitas,
        hargaSatuan,
        subtotal,
      };
    });

    // 4. Jika pembayaran TUNAI, periksa kecukupan Saldo Kas Pos RW
    if (input.statusPembayaran === StatusPembayaran.TUNAI) {
      const kasPos = await kasPosRepository.findByRw(petugas.rw);
      if (!kasPos) {
        const error: any = new Error(`Data Kas Pos untuk ${petugas.rw} tidak ditemukan.`);
        error.statusCode = 404;
        throw error;
      }

      if (Number(kasPos.saldoKas) < totalHarga) {
        const error: any = new Error(
          `Saldo kas pos RW tidak mencukupi (Tersedia: Rp ${Number(
            kasPos.saldoKas
          ).toLocaleString('id-ID')}, Dibutuhkan: Rp ${totalHarga.toLocaleString('id-ID')}).`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // 5. Eksekusi Transaksi Database (Atomic)
    return transaksiRepository.createTransaksiWithTransaction({
      userId: input.userId,
      petugasId: petugas.id,
      rwPos: petugas.rw,
      statusPembayaran: input.statusPembayaran,
      clientOfflineId: input.clientOfflineId,
      totalBerat: Math.round(totalBerat * 100) / 100,
      totalHarga,
      items: calculatedItems,
    });
  }

  async getRiwayat(
    user: JwtPayload,
    filters: {
      startDate?: string;
      endDate?: string;
      take?: number;
      skip?: number;
    }
  ) {
    const isWarga = user.role === UserRole.WARGA;

    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;

    return transaksiRepository.findAll({
      userId: isWarga ? user.id : undefined,
      rwPos: isWarga ? undefined : user.rw,
      startDate: start,
      endDate: end,
      take: filters.take ? Number(filters.take) : 50,
      skip: filters.skip ? Number(filters.skip) : 0,
    });
  }

  async getDetail(id: string, user: JwtPayload) {
    const transaksi = await transaksiRepository.findById(id);
    if (!transaksi) {
      const error: any = new Error('Transaksi tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    // Jika Warga, pastikan transaksi adalah milik dirinya sendiri
    if (user.role === UserRole.WARGA && transaksi.userId !== user.id) {
      const error: any = new Error('Anda tidak memiliki akses ke struk transaksi ini.');
      error.statusCode = 403;
      throw error;
    }

    return transaksi;
  }
}

export const transaksiService = new TransaksiService();

