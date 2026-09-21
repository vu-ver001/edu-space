import api from '../../../services/api';
import type { Facility, FacilityCreateRequest, FacilityUpdateRequest } from '../types/space';

export const facilityApi = {
  // Lấy toàn bộ danh mục tiện ích (kèm số lượng không gian đang dùng)
  getAllFacilities: async (): Promise<Facility[]> => {
    const res = await api.get<Facility[]>('/api/admin/facilities');
    return res.data;
  },

  // Chi tiết tiện ích
  getFacilityById: async (id: number): Promise<Facility> => {
    const res = await api.get<Facility>(`/api/admin/facilities/${id}`);
    return res.data;
  },

  // Tạo tiện ích mới
  createFacility: async (data: FacilityCreateRequest): Promise<Facility> => {
    const res = await api.post<Facility>('/api/admin/facilities', data);
    return res.data;
  },

  // Cập nhật tiện ích
  updateFacility: async (id: number, data: FacilityUpdateRequest): Promise<Facility> => {
    const res = await api.put<Facility>(`/api/admin/facilities/${id}`, data);
    return res.data;
  },

  // Xóa mềm tiện ích
  deleteFacility: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/facilities/${id}`);
  },
};
