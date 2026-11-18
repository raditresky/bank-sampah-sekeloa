import { pencairanRepository } from '../repositories/pencairan.repository';
import { userRepository } from '../repositories/user.repository';
import { CreatePencairanInput } from '../validations/pencairan.validation';
import { JwtPayload } from '../utils/jwt.util';
import { UserRole, StatusPencairan } from '@prisma/client';

export class PencairanService {
  async createPencairan(user: JwtPayload, input: CreatePencairanInput) {
    const dbUser = await userRepository.findById(user.id);
    if (!dbUser) {
      const error: any = new Error('Data pengguna tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const nominal = Number(input.jumlahNominal);
    const saldo = Number(dbUser.saldoTabungan);

    if (saldo < nominal) {
      const error: any = new Error(
        `Saldo tabungan Anda tidak mencukupi untuk penarikan ini. (Saldo Anda: Rp ${saldo.toLocaleString(
          'id-ID'
        )}, Pengajuan: Rp ${nominal.toLocaleString('id-ID')}).`
      );
      error.statusCode = 400;
      throw error;
    }

    return pencairanRepository.create({
      userId: user.id,
      rwPos: user.rw,
      jumlahNominal: nominal,
      metode: input.metode,
      infoRekening: input.infoRekening,
      catatan: input.catatan,
    });
  }

  async getPendingRequests(user: JwtPayload) {
    return pencairanRepository.findPendingByRw(user.rw);
  }

  async getAllRequests(user: JwtPayload, status?: StatusPencairan) {
    const isWarga = user.role === UserRole.WARGA;

    return pencairanRepository.findAll({
      userId: isWarga ? user.id : undefined,
      rwPos: isWarga ? undefined : user.rw,
      status,
    });
  }

  async approvePencairan(petugas: JwtPayload, id: string, catatanPetugas?: string) {
    return pencairanRepository.approvePencairan(id, petugas.id, catatanPetugas);
  }

  async rejectPencairan(petugas: JwtPayload, id: string, catatanPetugas?: string) {
    return pencairanRepository.rejectPencairan(id, petugas.id, catatanPetugas);
  }
}

export const pencairanService = new PencairanService();
