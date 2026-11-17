import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z
  .object({
    nama: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(255),
    nomorHp: z
      .string()
      .min(10, 'Nomor HP minimal 10 digit')
      .max(20, 'Nomor HP maksimal 20 digit')
      .regex(/^[0-9+]+$/, 'Format nomor HP hanya boleh berisi angka'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    rw: z.string().min(1, 'RW wajib diisi').max(10),
    rt: z.string().max(10).optional().nullable(),
    unitBankSampah: z.string().max(255).optional().nullable(),
    role: z.nativeEnum(UserRole).default(UserRole.WARGA),
    kodeAksesPengurus: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role !== UserRole.WARGA) {
        return !!data.kodeAksesPengurus && data.kodeAksesPengurus.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Kode Akses Pengurus wajib diisi untuk registrasi Petugas atau Admin RW',
      path: ['kodeAksesPengurus'],
    }
  );

export const loginSchema = z.object({
  nomorHp: z.string().min(1, 'Nomor HP wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

