import { prisma } from '../config/prisma';
import { UserRole, Prisma } from '@prisma/client';

export class UserRepository {
  async findByNomorHp(nomorHp: string) {
    return prisma.user.findUnique({
      where: { nomorHp },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByKodeNasabah(kodeNasabah: string) {
    return prisma.user.findUnique({
      where: { kodeNasabah },
    });
  }

  async searchNasabah(params: { query?: string; rw?: string }) {
    const { query, rw } = params;

    const where: Prisma.UserWhereInput = {
      role: UserRole.WARGA,
    };

    if (rw) {
      where.rw = rw;
    }

    if (query && query.trim().length > 0) {
      where.OR = [
        { nama: { contains: query } },
        { nomorHp: { contains: query } },
        { kodeNasabah: { contains: query } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        kodeNasabah: true,
        nama: true,
        nomorHp: true,
        rw: true,
        rt: true,
        unitBankSampah: true,
        saldoTabungan: true,
        createdAt: true,
      },
      orderBy: { nama: 'asc' },
      take: 50,
    });
  }

  async createUser(data: {
    kodeNasabah: string;
    nama: string;
    nomorHp: string;
    passwordHash: string;
    rw: string;
    rt?: string | null;
    unitBankSampah?: string | null;
    role: UserRole;
    saldoTabungan?: number;
  }) {
    return prisma.user.create({
      data: {
        kodeNasabah: data.kodeNasabah,
        nama: data.nama,
        nomorHp: data.nomorHp,
        passwordHash: data.passwordHash,
        rw: data.rw,
        rt: data.rt || null,
        unitBankSampah: data.unitBankSampah || null,
        role: data.role,
        saldoTabungan: data.saldoTabungan ?? 0,
      },
    });
  }

  async generateUniqueKodeNasabah(rw: string): Promise<string> {
    // Ambil angka dari string RW, contoh: "RW 08" -> "08", "RW 3" -> "03"
    const rwDigitsMatch = rw.match(/\d+/);
    const rwDigits = rwDigitsMatch ? rwDigitsMatch[0].padStart(2, '0') : '00';

    let isUnique = false;
    let generatedCode = '';

    while (!isUnique) {
      const randomSuffix = Math.floor(100 + Math.random() * 900).toString(); // 3 digit
      generatedCode = `BS-SKL-${rwDigits}${randomSuffix}`;

      const existing = await prisma.user.findUnique({
        where: { kodeNasabah: generatedCode },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return generatedCode;
  }
}

export const userRepository = new UserRepository();

