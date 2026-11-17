import Dexie, { Table } from 'dexie';
import { SampahItem, StatusPembayaran, User } from '../types';

export interface PendingTransaction {
  id?: number;
  clientOfflineId: string;
  userId: string;
  wargaNama: string;
  wargaKodeNasabah: string;
  statusPembayaran: StatusPembayaran;
  totalBerat: number;
  totalHarga: number;
  items: {
    sampahAnorganikId: string;
    namaSampah: string;
    kuantitas: number;
    hargaSatuan: number;
    subtotal: number;
  }[];
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export class BankSampahDatabase extends Dexie {
  pendingTransactions!: Table<PendingTransaction, number>;
  cachedSampah!: Table<SampahItem, string>;
  cachedNasabah!: Table<User, string>;

  constructor() {
    super('BankSampahSekeloaDB');
    this.version(1).stores({
      pendingTransactions: '++id, clientOfflineId, syncStatus, createdAt',
      cachedSampah: 'id, kategori, nama',
      cachedNasabah: 'id, kodeNasabah, nama, rw',
    });
  }
}

export const db = new BankSampahDatabase();

