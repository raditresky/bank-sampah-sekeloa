import { z } from 'zod';
import { StatusPembayaran } from '@prisma/client';

export const createTransaksiItemSchema = z.object({
  sampahAnorganikId: z.string().min(1, 'ID Sampah wajib diisi'),
  kuantitas: z
    .number()
    .positive('Kuantitas / berat harus lebih besar dari 0')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
});

export const createTransaksiSchema = z.object({
  userId: z.string().uuid('Format ID Nasabah tidak valid'),
  statusPembayaran: z.nativeEnum(StatusPembayaran).default(StatusPembayaran.TABUNGAN),
  clientOfflineId: z.string().optional().nullable(),
  items: z.array(createTransaksiItemSchema).min(1, 'Minimal harus ada 1 item sampah yang ditimbang'),
});

export type CreateTransaksiInput = z.infer<typeof createTransaksiSchema>;

