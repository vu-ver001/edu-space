import api from './api';

export interface Facility {
  id: number;
  name: string;
  icon?: string;
}

export interface SpaceType {
  id: number;
  name: string;
  bookingMode?: 'WHOLE_SPACE' | 'PER_SEAT' | 'PER_TABLE';
  requiresApproval: boolean;
  description?: string;
}

export interface SpaceSeat {
  id: number;
  spaceId: number;
  seatCode: string;
  status: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface SpaceTable {
  id: number;
  spaceId: number;
  tableCode: string;
  capacity: number;
  status: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface Space {
  id: number;
  name: string;
  spaceTypeId: number;
  spaceTypeName: string;
  bookingMode?: 'WHOLE_SPACE' | 'PER_SEAT' | 'PER_TABLE';
  requiresApproval: boolean;
  building: string;
  floor: string;
  capacity: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  imageUrl?: string;
  description?: string;
  facilities: Facility[];
  isAvailable?: boolean;
  allowSeatSelection?: boolean;
  allowTableSelection?: boolean;
  spaceType?: SpaceType;
}

export interface ConflictDetail {
  type: string;
  referenceId: number;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface AvailabilityResponse {
  spaceId: number;
  available: boolean;
  conflicts: ConflictDetail[];
}

export interface SearchFilter {
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: string;
  endDateTime?: string;
  participantCount?: number;
  spaceTypeId?: number;
  facilityIds?: number[];
  building?: string;
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

  // Tìm kiếm phòng trống theo bộ lọc
  searchAvailableSpaces: async (filter: SearchFilter): Promise<Space[]> => {
    const params: Record<string, any> = {};
    if (filter.date) params.date = filter.date;
    if (filter.startTime) params.startTime = filter.startTime;
    if (filter.endTime) params.endTime = filter.endTime;
    if (filter.startDateTime) params.startDateTime = filter.startDateTime;
    if (filter.endDateTime) params.endDateTime = filter.endDateTime;
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

  // Danh mục loại không gian
  getSpaceTypes: async (): Promise<SpaceType[]> => {
    const res = await api.get<SpaceType[]>('/api/spaces/types');
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
  }
};
