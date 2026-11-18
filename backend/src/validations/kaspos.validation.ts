import { z } from 'zod';

export const updateSaldoKasSchema = z.object({
  userId: z.string().uuid().optional(),
  saldoKas: z
    .number()
    .min(0, 'Saldo kas tidak boleh bernilai negatif')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  catatan: z.string().optional(),
});

export type UpdateSaldoKasInput = z.infer<typeof updateSaldoKasSchema>;
