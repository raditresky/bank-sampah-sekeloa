import { prisma } from '../config/prisma';

export class KasPosRepository {
  async findByRw(rw: string) {
    return prisma.kasPos.findUnique({
      where: { rw },
    });
  }

  async findAll() {
    return prisma.kasPos.findMany({
      orderBy: { rw: 'asc' },
    });
  }

  async updateSaldo(rw: string, delta: number) {
    return prisma.kasPos.update({
      where: { rw },
      data: {
        saldoKas: {
          increment: delta,
        },
      },
    });
  }
}

export const kasPosRepository = new KasPosRepository();

