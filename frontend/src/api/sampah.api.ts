import api from './client';
import { SampahItem, KategoriSampah } from '../types';

export interface GetKatalogParams {
  kategori?: KategoriSampah;
  search?: string;
  satuan?: string;
}

export interface CreateSampahPayload {
  id: string;
  nama: string;
  kategori: KategoriSampah;
  satuan?: string;
  hargaSatuan: number;
  deskripsi?: string;
  isActive?: boolean;
  adminPassword?: string;
}

export interface UpdateSampahPayload {
  nama?: string;
  kategori?: KategoriSampah;
  satuan?: string;
  hargaSatuan?: number;
  deskripsi?: string;
  isActive?: boolean;
  adminPassword?: string;
}

export const sampahApi = {
  getKatalog: async (params?: GetKatalogParams): Promise<{ success: boolean; data: SampahItem[] }> => {
    const res = await api.get('/sampah', { params });
    return res.data;
  },

  create: async (
    payload: CreateSampahPayload
  ): Promise<{ success: boolean; data: SampahItem; message: string }> => {
    const res = await api.post('/sampah', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: UpdateSampahPayload
  ): Promise<{ success: boolean; data: SampahItem; message: string }> => {
    const res = await api.put(`/sampah/${id}`, payload);
    return res.data;
  },

  delete: async (id: string, adminPassword?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/sampah/${id}`, {
      headers: adminPassword ? { 'x-katalog-password': adminPassword } : undefined,
    });
    return res.data;
  },

  updateHarga: async (
    id: string,
    hargaSatuan: number
  ): Promise<{ success: boolean; data: SampahItem; message: string }> => {
    const res = await api.patch(`/sampah/${id}/harga`, { hargaSatuan });
    return res.data;
  },
};

