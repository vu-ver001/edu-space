import api from '../../../../services/api';
import type { DashboardStatisticsResponse } from '../types/statistics';

export const statisticsService = {
  async getDashboardStatistics(from?: string, to?: string): Promise<DashboardStatisticsResponse> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get<DashboardStatisticsResponse>('/api/admin/statistics', { params });
    return res.data;
  },

  async exportExcel(from?: string, to?: string): Promise<Blob> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    try {
      const res = await api.get('/api/admin/statistics/export-excel', {
        params,
        responseType: 'blob',
      });
      return res.data;
    } catch (err: any) {
      if (err?.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          if (json.message) {
            throw new Error(json.message);
          }
        } catch (parseErr) {
          if (text) throw new Error(text);
        }
      }
      throw err;
    }
  },
};
