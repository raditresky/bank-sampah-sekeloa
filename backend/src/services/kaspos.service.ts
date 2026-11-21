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

    const kasPos = await prisma.kasPos.findUnique({
      where: { rw: user.rw },
    });

    const saldoKasRw = kasPos ? Number(kasPos.saldoKas) : 0;

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
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { rw: true, nama: true, nomorHp: true, role: true },
    });

    if (!user) {
      throw new Error('User tidak ditemukan.');
    }

    const nominal = Number(input.saldoKas);

    // Sinkronisasi: Update kas_pos RW dan saldo_kas semua admin/petugas di RW tersebut
    const updatedKasPos = await prisma.$transaction(async (tx) => {
      const kasPos = await tx.kasPos.upsert({
        where: { rw: user.rw },
        create: {
          rw: user.rw,
          namaUnit: `Pos Sampiah ${user.rw}`,
          saldoKas: new Prisma.Decimal(nominal),
        },
        update: {
          saldoKas: new Prisma.Decimal(nominal),
        },
      });

      await tx.user.updateMany({
        where: { rw: user.rw, role: 'ADMIN_RW' },
        data: {
          saldoKas: new Prisma.Decimal(nominal),
        },
      });

      return kasPos;
    });

    return {
      id: currentUser.id,
      nama: user.nama,
      nomorHp: user.nomorHp,
      role: user.role,
      rw: user.rw,
      saldoKas: Number(updatedKasPos.saldoKas),
      updatedAt: updatedKasPos.updatedAt,
    };
  }
}

export const kasPosService = new KasPosService();
