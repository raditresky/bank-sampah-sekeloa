import api from './client';
import { DashboardAdminSummary, DashboardWargaSummary } from '../types';

export const dashboardApi = {
  getSummary: async (): Promise<{
    success: boolean;
    data: DashboardAdminSummary | DashboardWargaSummary;
  }> => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
};

