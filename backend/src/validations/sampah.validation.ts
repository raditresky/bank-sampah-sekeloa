import { z } from 'zod';
import { KategoriSampah } from '@prisma/client';

export const updateHargaSchema = z.object({
  hargaSatuan: z
    .number()
    .positive('Harga satuan harus lebih besar dari 0')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
});

export const queryKatalogSchema = z.object({
  kategori: z.nativeEnum(KategoriSampah).optional(),
  search: z.string().optional(),
  satuan: z.string().optional(),
});

export type UpdateHargaInput = z.infer<typeof updateHargaSchema>;
export type QueryKatalogInput = z.infer<typeof queryKatalogSchema>;

