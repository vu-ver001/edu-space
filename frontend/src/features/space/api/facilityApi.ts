import api from '../../../services/api';
import type { Facility, FacilityCreateRequest, FacilityUpdateRequest } from '../types/space';
import type { SpaceActionResponse } from '../types/api';

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
  createFacility: async (data: FacilityCreateRequest): Promise<SpaceActionResponse<Facility>> => {
    const res = await api.post<SpaceActionResponse<Facility>>('/api/admin/facilities', data);
    return res.data;
  },

  // Cập nhật tiện ích
  updateFacility: async (id: number, data: FacilityUpdateRequest): Promise<SpaceActionResponse<Facility>> => {
    const res = await api.put<SpaceActionResponse<Facility>>(`/api/admin/facilities/${id}`, data);
    return res.data;
  },

  // Xóa mềm tiện ích
  deleteFacility: async (id: number): Promise<SpaceActionResponse<null>> => {
    const res = await api.delete<SpaceActionResponse<null>>(`/api/admin/facilities/${id}`);
    return res.data;
  },
};
