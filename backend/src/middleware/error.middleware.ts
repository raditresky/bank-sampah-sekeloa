import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.util';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  console.error('Unhandled Application Error:', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validasi data gagal.', 400, errorMessages);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? `pada bidang ${err.meta.target}` : '';
    return sendError(res, `Data duplikat terdeteksi ${target}.`, 409, err.meta);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'Data tidak ditemukan.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

