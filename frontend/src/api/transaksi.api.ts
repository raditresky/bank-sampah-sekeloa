import api from './client';
import { Transaksi, StatusPembayaran } from '../types';

export interface CreateTransaksiPayload {
  userId: string;
  statusPembayaran: StatusPembayaran;
  clientOfflineId?: string | null;
  items: {
    sampahAnorganikId: string;
    kuantitas: number;
  }[];
}

export const transaksiApi = {
  create: async (payload: CreateTransaksiPayload): Promise<{ success: boolean; data: Transaksi; message: string }> => {
    const res = await api.post('/transaksi', payload);
    return res.data;
  },

  getRiwayat: async (params?: {
    startDate?: string;
    endDate?: string;
    take?: number;
    skip?: number;
  }): Promise<{ success: boolean; data: { total: number; items: Transaksi[] } }> => {
    const res = await api.get('/transaksi', { params });
    return res.data;
  },

  getDetail: async (id: string): Promise<{ success: boolean; data: Transaksi }> => {
    const res = await api.get(`/transaksi/${id}`);
    return res.data;
  },
};

