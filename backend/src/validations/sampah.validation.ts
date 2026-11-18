import { z } from 'zod';
import { KategoriSampah } from '@prisma/client';

export const createSampahSchema = z.object({
  id: z
    .string()
    .min(1, 'Kode sampah / ID wajib diisi')
    .max(10, 'Kode sampah maksimal 10 karakter')
    .toUpperCase(),
  kategori: z.nativeEnum(KategoriSampah, {
    errorMap: () => ({ message: 'Kategori harus salah satu dari PLASTIK, KERTAS, LOGAM, KACA, LAINNYA' }),
  }),
  nama: z.string().min(2, 'Nama sampah minimal 2 karakter').max(255),
  satuan: z.string().min(1, 'Satuan wajib diisi').default('Kg'),
  deskripsi: z.string().optional().nullable(),
  hargaSatuan: z
    .number()
    .positive('Harga satuan harus lebih besar dari 0')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  isActive: z.boolean().default(true).optional(),
  adminPassword: z.string().min(1, 'Password otorisasi katalog wajib diisi'),
});

export const updateSampahSchema = z.object({
  kategori: z.nativeEnum(KategoriSampah).optional(),
  nama: z.string().min(2, 'Nama sampah minimal 2 karakter').max(255).optional(),
  satuan: z.string().min(1, 'Satuan wajib diisi').optional(),
  deskripsi: z.string().optional().nullable(),
  hargaSatuan: z
    .number()
    .positive('Harga satuan harus lebih besar dari 0')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number))
    .optional(),
  isActive: z.boolean().optional(),
  adminPassword: z.string().min(1, 'Password otorisasi katalog wajib diisi'),
});

export const updateHargaSchema = z.object({
  hargaSatuan: z
    .number()
    .positive('Harga satuan harus lebih besar dari 0')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  adminPassword: z.string().min(1, 'Password otorisasi katalog wajib diisi').optional(),
});

export const queryKatalogSchema = z.object({
  kategori: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.nativeEnum(KategoriSampah).optional()
  ),
  search: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  satuan: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
});

export type CreateSampahInput = z.infer<typeof createSampahSchema>;
export type UpdateSampahInput = z.infer<typeof updateSampahSchema>;
export type UpdateHargaInput = z.infer<typeof updateHargaSchema>;
export type QueryKatalogInput = z.infer<typeof queryKatalogSchema>;

