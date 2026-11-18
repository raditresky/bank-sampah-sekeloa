import api from './client';
import { Pencairan, StatusPencairan, MetodePencairan } from '../types';

export interface CreatePencairanPayload {
  jumlahNominal: number;
  metode: MetodePencairan;
  infoRekening?: string;
  catatan?: string;
}

export const pencairanApi = {
  create: async (
    payload: CreatePencairanPayload
  ): Promise<{ success: boolean; data: Pencairan; message: string }> => {
    const res = await api.post('/pencairan', payload);
    return res.data;
  },

  getPending: async (): Promise<{ success: boolean; data: Pencairan[] }> => {
    const res = await api.get('/pencairan/pending');
    return res.data;
  },

  getAll: async (params?: { status?: StatusPencairan }): Promise<{ success: boolean; data: Pencairan[] }> => {
    const res = await api.get('/pencairan', { params });
    return res.data;
  },

  approve: async (
    id: string,
    catatanPetugas?: string
  ): Promise<{ success: boolean; data: { pencairan: Pencairan; saldoBaruWarga: number }; message: string }> => {
    const res = await api.post(`/pencairan/${id}/approve`, { catatanPetugas });
    return res.data;
  },

  reject: async (
    id: string,
    catatanPetugas?: string
  ): Promise<{ success: boolean; data: Pencairan; message: string }> => {
    const res = await api.post(`/pencairan/${id}/reject`, { catatanPetugas });
    return res.data;
  },
};
