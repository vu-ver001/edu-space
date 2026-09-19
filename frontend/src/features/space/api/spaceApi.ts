import api from '../../../services/api';
import type { Space, SpaceSeat, SpaceTable, Facility } from '../types/space';

export const spaceApi = {
  // Lấy toàn bộ danh sách không gian
  getAllSpaces: async (params?: Record<string, any>): Promise<Space[]> => {
    const res = await api.get<Space[]>('/api/spaces', { params });
    return res.data;
  },

  // Chi tiết một không gian
  getSpaceById: async (id: number): Promise<Space> => {
    const res = await api.get<Space>(`/api/spaces/${id}`);
    return res.data;
  },

  // Danh mục tiện ích
  getFacilities: async (): Promise<Facility[]> => {
    const res = await api.get<Facility[]>('/api/spaces/facilities');
    return res.data;
  },

  // Danh sách chỗ ngồi của một không gian PER_SEAT
  getSeatsBySpace: async (spaceId: number): Promise<SpaceSeat[]> => {
    const res = await api.get<SpaceSeat[]>(`/api/spaces/${spaceId}/seats`);
    return res.data;
  },

  // Danh sách bàn của một không gian PER_TABLE
  getTablesBySpace: async (spaceId: number): Promise<SpaceTable[]> => {
    const res = await api.get<SpaceTable[]>(`/api/spaces/${spaceId}/tables`);
    return res.data;
  },

  // Admin APIs
  createSpace: async (data: any): Promise<Space> => {
    const res = await api.post<Space>('/api/admin/spaces', data);
    return res.data;
  },

  updateSpace: async (id: number, data: any): Promise<Space> => {
    const res = await api.put<Space>(`/api/admin/spaces/${id}`, data);
    return res.data;
  },

  deleteSpace: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/spaces/${id}`);
  }
};
