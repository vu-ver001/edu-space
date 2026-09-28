import api from '../../../../services/api';
import type { 
  Facility, 
  SpaceType, 
  SpaceSeat, 
  SpaceTable, 
  SpaceImage,
  Space, 
  ConflictDetail, 
  SearchFilter,
  MaintenanceSchedule 
} from '../types/space.types';

export * from '../types/space.types';

export interface AvailabilityResponse {
  spaceId: number;
  available: boolean;
  conflicts: ConflictDetail[];
}

export const spaceService = {
  // Lấy toàn bộ danh sách không gian
  getAllSpaces: async (): Promise<Space[]> => {
    const res = await api.get<Space[]>('/api/spaces');
    return res.data;
  },

  // Chi tiết một không gian
  getSpaceById: async (id: number): Promise<Space> => {
    const res = await api.get<Space>(`/api/spaces/${id}`);
    return res.data;
  },

  // Tìm kiếm phòng trống theo bộ lọc (Module M03)
  searchAvailableSpaces: async (filter: SearchFilter): Promise<Space[]> => {
    const params: Record<string, any> = {};
    if (filter.date) params.date = filter.date;
    if (filter.startTime) params.startTime = filter.startTime;
    if (filter.endTime) params.endTime = filter.endTime;
    if (filter.participantCount) params.participantCount = filter.participantCount;
    if (filter.spaceTypeId) params.spaceTypeId = filter.spaceTypeId;
    if (filter.facilityIds && filter.facilityIds.length > 0) {
      params.facilityIds = filter.facilityIds.join(',');
    }
    if (filter.building) params.building = filter.building;

    const res = await api.get<Space[]>('/api/spaces/available', { params });
    return res.data;
  },

  // Kiểm tra khả dụng của một phòng cụ thể (Contract chuẩn)
  checkAvailability: async (spaceId: number, startTime: string, endTime: string): Promise<AvailabilityResponse> => {
    const res = await api.get<AvailabilityResponse>(`/api/spaces/${spaceId}/availability`, {
      params: { startTime, endTime }
    });
    return res.data;
  },

  // Danh mục loại không gian (Đồng bộ chuẩn API của Kim Tuyến)
  getSpaceTypes: async (): Promise<SpaceType[]> => {
    const res = await api.get<SpaceType[]>('/api/space-types');
    return res.data;
  },

  // Danh mục tiện ích (Đồng bộ chuẩn API của Kim Tuyến)
  getFacilities: async (): Promise<Facility[]> => {
    const res = await api.get<Facility[]>('/api/facilities');
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

  // Danh sách hình ảnh của một không gian (bảng space_images)
  getImagesBySpace: async (spaceId: number): Promise<SpaceImage[]> => {
    const res = await api.get<SpaceImage[]>(`/api/spaces/${spaceId}/images`);
    return res.data;
  },

  // Khung giờ mở cửa & đóng cửa của tòa nhà và các chính sách hạn mức (Đồng bộ từ CSDL)
  getOperatingHours: async (): Promise<{
    openingHour: string;
    closingHour: string;
    maxDurationMinutes?: number;
    maxBookingsPerDay?: number;
    checkInGraceMinutes?: number;
  }> => {
    const res = await api.get('/api/spaces/operating-hours');
    return res.data;
  },

  // Danh sách các đợt bảo trì sắp tới của không gian (Chỉ thời điểm hiện tại và tương lai)
  getMaintenancesBySpace: async (spaceId: number): Promise<MaintenanceSchedule[]> => {
    const res = await api.get<MaintenanceSchedule[]>(`/api/spaces/${spaceId}/maintenances`);
    return res.data;
  }
};


