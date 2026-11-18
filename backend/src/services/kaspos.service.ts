import { prisma } from '../config/prisma';
import { JwtPayload } from '../utils/jwt.util';
import { Prisma } from '@prisma/client';
import { UpdateSaldoKasInput } from '../validations/kaspos.validation';

export class KasPosService {
  async getPetugasKasList(currentUser: JwtPayload) {
    // Hanya mengembalikan kas diri sendiri
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        nama: true,
        nomorHp: true,
        role: true,
        saldoKas: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return [];
    }

    return [
      {
        ...user,
        saldoKas: Number(user.saldoKas),
      },
    ];
  }

  async updateSaldoKas(currentUser: JwtPayload, input: UpdateSaldoKasInput) {
    // Hanya bisa mengubah kas diri sendiri
    const targetUserId = currentUser.id;
    const nominal = Number(input.saldoKas);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        saldoKas: new Prisma.Decimal(nominal),
      },
      select: {
        id: true,
        nama: true,
        nomorHp: true,
        role: true,
        saldoKas: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      saldoKas: Number(updatedUser.saldoKas),
    };
  }
}

export const kasPosService = new KasPosService();
