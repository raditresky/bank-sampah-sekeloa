import api from './client';

export interface PetugasKasItem {
  id: string;
  nama: string;
  nomorHp: string;
  role: string;
  saldoKas: number;
  updatedAt: string;
}

export const kasPosApi = {
  getPetugasKasList: async (): Promise<{ data: PetugasKasItem[] }> => {
    const res = await api.get('/kaspos/petugas');
    return res.data;
  },
  updateSaldoKas: async (payload: {
    userId?: string;
    saldoKas: number;
    catatan?: string;
  }): Promise<{ data: PetugasKasItem; message: string }> => {
    const res = await api.put('/kaspos/update', payload);
    return res.data;
  },
};
