import api from './client';
import { User, UserRole } from '../types';

export interface RegisterPayload {
  nama: string;
  nomorHp: string;
  password: string;
  rw: string;
  rt?: string;
  unitBankSampah?: string;
  role: UserRole;
  kodeAksesPengurus?: string;
}

export interface LoginPayload {
  nomorHp: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

