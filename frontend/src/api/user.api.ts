import api from './client';
import { User } from '../types';

export const userApi = {
  searchNasabah: async (q?: string, rw?: string): Promise<{ success: boolean; data: User[] }> => {
    const res = await api.get('/users/nasabah', {
      params: { q, rw },
    });
    return res.data;
  },

  getByKodeNasabah: async (kodeNasabah: string): Promise<{ success: boolean; data: User }> => {
    const res = await api.get(`/users/qr/${encodeURIComponent(kodeNasabah)}`);
    return res.data;
  },
};

