import api from '../../../services/api';
import type {
  Space,
  SpaceSeat,
  SpaceTable,
  Facility,
  SpaceCreateRequest,
  SpaceUpdateRequest,
  SeatCreateRequest,
  SeatUpdateRequest,
  SeatBulkCreateRequest,
  SpaceTableCreateRequest,
  SpaceTableUpdateRequest,
} from '../types/space';
import type { SpaceActionResponse } from '../types/api';

export const spaceApi = {
  // Lấy danh sách không gian công khai / bộ lọc
  getAllSpaces: async (params?: Record<string, any>): Promise<Space[]> => {
    const res = await api.get<Space[]>('/api/spaces', { params });
    return res.data;
  },

  // Lấy toàn bộ không gian cho Admin (bao gồm cả INACTIVE)
  getAllAdminSpaces: async (): Promise<Space[]> => {
    try {
      const res = await api.get<Space[]>('/api/admin/spaces');
      return res.data;
    } catch {
      const fallback = await api.get<Space[]>('/api/spaces');
      return fallback.data;
    }
  },

  // Chi tiết một không gian
  getSpaceById: async (id: number): Promise<Space> => {
    const res = await api.get<Space>(`/api/spaces/${id}`);
    return res.data;
  },

  // Danh mục tiện ích (chuẩn hóa về endpoint /api/admin/facilities)
  getFacilities: async (): Promise<Facility[]> => {
    const res = await api.get<Facility[]>('/api/admin/facilities');
    return res.data;
  },

  // Danh sách chỗ ngồi của một không gian PER_SEAT
  getSeatsBySpace: async (spaceId: number): Promise<SpaceSeat[]> => {
    const res = await api.get<SpaceSeat[]>(`/api/spaces/${spaceId}/seats`);
    return res.data;
  },

  // Quản lý chỗ ngồi (Seat) - Admin
  createSeat: async (spaceId: number, data: SeatCreateRequest): Promise<SpaceActionResponse<SpaceSeat>> => {
    const res = await api.post<SpaceActionResponse<SpaceSeat>>(`/api/admin/spaces/${spaceId}/seats`, data);
    return res.data;
  },

  bulkCreateSeats: async (spaceId: number, data: SeatBulkCreateRequest | string[]): Promise<SpaceActionResponse<SpaceSeat[]>> => {
    const payload = Array.isArray(data) ? { seatCodes: data } : data;
    const res = await api.post<SpaceActionResponse<SpaceSeat[]>>(`/api/admin/spaces/${spaceId}/seats/bulk`, payload);
    return res.data;
  },

  updateSeat: async (seatId: number, data: SeatUpdateRequest): Promise<SpaceActionResponse<SpaceSeat>> => {
    const res = await api.put<SpaceActionResponse<SpaceSeat>>(`/api/admin/seats/${seatId}`, data);
    return res.data;
  },

  deleteSeat: async (seatId: number): Promise<SpaceActionResponse<null>> => {
    const res = await api.delete<SpaceActionResponse<null>>(`/api/admin/seats/${seatId}`);
    return res.data;
  },

  // Danh sách bàn của một không gian PER_TABLE
  getTablesBySpace: async (spaceId: number): Promise<SpaceTable[]> => {
    const res = await api.get<SpaceTable[]>(`/api/spaces/${spaceId}/tables`);
    return res.data;
  },

  // Quản lý bàn (Table) - Admin
  createTable: async (spaceId: number, data: SpaceTableCreateRequest): Promise<SpaceActionResponse<SpaceTable>> => {
    const res = await api.post<SpaceActionResponse<SpaceTable>>(`/api/admin/spaces/${spaceId}/tables`, data);
    return res.data;
  },

  updateTable: async (tableId: number, data: SpaceTableUpdateRequest): Promise<SpaceActionResponse<SpaceTable>> => {
    const res = await api.put<SpaceActionResponse<SpaceTable>>(`/api/admin/tables/${tableId}`, data);
    return res.data;
  },

  deleteTable: async (tableId: number): Promise<SpaceActionResponse<null>> => {
    const res = await api.delete<SpaceActionResponse<null>>(`/api/admin/tables/${tableId}`);
    return res.data;
  },

  // Admin APIs
  createSpace: async (data: SpaceCreateRequest): Promise<SpaceActionResponse<Space>> => {
    const res = await api.post<SpaceActionResponse<Space>>('/api/admin/spaces', data);
    return res.data;
  },

  updateSpace: async (id: number, data: SpaceUpdateRequest): Promise<SpaceActionResponse<Space>> => {
    const res = await api.put<SpaceActionResponse<Space>>(`/api/admin/spaces/${id}`, data);
    return res.data;
  },

  deleteSpace: async (id: number): Promise<SpaceActionResponse<null>> => {
    const res = await api.delete<SpaceActionResponse<null>>(`/api/admin/spaces/${id}`);
    return res.data;
  }
};
