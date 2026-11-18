import { z } from 'zod';
import { MetodePencairan, StatusPencairan } from '@prisma/client';

export const createPencairanSchema = z.object({
  jumlahNominal: z
    .number()
    .min(5000, 'Minimal nominal penarikan adalah Rp 5.000')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  metode: z.nativeEnum(MetodePencairan).default(MetodePencairan.TUNAI),
  infoRekening: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const updateStatusPencairanSchema = z.object({
  status: z.enum([StatusPencairan.DISETUJUI, StatusPencairan.DITOLAK]),
  catatanPetugas: z.string().optional().nullable(),
});

export type CreatePencairanInput = z.infer<typeof createPencairanSchema>;
export type UpdateStatusPencairanInput = z.infer<typeof updateStatusPencairanSchema>;
