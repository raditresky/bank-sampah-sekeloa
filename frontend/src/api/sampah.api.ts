import api from './client';
import { SampahItem, KategoriSampah } from '../types';

export interface GetKatalogParams {
  kategori?: KategoriSampah;
  search?: string;
  satuan?: string;
}

export const sampahApi = {
  getKatalog: async (params?: GetKatalogParams): Promise<{ success: boolean; data: SampahItem[] }> => {
    const res = await api.get('/sampah', { params });
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

