import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/bank_sampah_sekeloa',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_banksampah_sekeloa_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_INVITE_CODE: process.env.ADMIN_INVITE_CODE || 'SEKELOA_JUARA_2026',
  KATALOG_PASSWORD: process.env.KATALOG_PASSWORD || 'sekeloasampiahjuara123!',
};

