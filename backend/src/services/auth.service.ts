import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { RegisterInput, LoginInput } from '../validations/auth.validation';
import { signToken } from '../utils/jwt.util';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

export class AuthService {
  async register(input: RegisterInput) {
    // 1. Mitigasi Registrasi Petugas/Admin RW: Validasi Kode Akses Pengurus
    if (input.role !== UserRole.WARGA) {
      if (!input.kodeAksesPengurus || input.kodeAksesPengurus.trim() !== env.ADMIN_INVITE_CODE) {
        const error: any = new Error(
          'Kode Akses Pengurus tidak valid. Hubungi pengurus RW setempat.'
        );
        error.statusCode = 403;
        throw error;
      }
    }

    // 2. Cek apakah nomor HP sudah terdaftar
    const existingUser = await userRepository.findByNomorHp(input.nomorHp);
    if (existingUser) {
      const error: any = new Error('Nomor HP sudah terdaftar di sistem.');
      error.statusCode = 409;
      throw error;
    }

    // 3. Generate Kode Nasabah Unik (Payload QR Code)
    const kodeNasabah = await userRepository.generateUniqueKodeNasabah(input.rw);

    // 4. Hash Password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 5. Simpan User
    const newUser = await userRepository.createUser({
      kodeNasabah,
      nama: input.nama,
      nomorHp: input.nomorHp,
      passwordHash,
      rw: input.rw,
      rt: input.rt,
      unitBankSampah: input.unitBankSampah,
      role: input.role,
    });

    // 6. Sign JWT
    const token = signToken({
      id: newUser.id,
      nomorHp: newUser.nomorHp,
      role: newUser.role,
      rw: newUser.rw,
      unitBankSampah: newUser.unitBankSampah,
    });

    const { passwordHash: _, ...safeUser } = newUser;

    return {
      token,
      user: safeUser,
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByNomorHp(input.nomorHp);
    if (!user) {
      const error: any = new Error('Nomor HP atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Nomor HP atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const token = signToken({
      id: user.id,
      nomorHp: user.nomorHp,
      role: user.role,
      rw: user.rw,
      unitBankSampah: user.unitBankSampah,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      token,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error: any = new Error('Data pengguna tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();

