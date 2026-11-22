import api from './client';
import { User, UserRole } from '../types';

export interface CreateNasabahPayload {
  nama: string;
  nomorHp: string;
  password?: string;
  rw: string;
  rt?: string;
  role?: UserRole;
}

export const userApi = {
  createNasabah: async (payload: CreateNasabahPayload): Promise<{ success: boolean; data: User; message: string }> => {
    const res = await api.post('/users/nasabah', payload);
    return res.data;
  },

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

  getById: async (id: string): Promise<{ success: boolean; data: User }> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
};

