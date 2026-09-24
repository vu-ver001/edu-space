import type { SpaceType, BookingMode } from './spaceType';

export interface Facility {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  spaceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityCreateRequest {
  name: string;
  description?: string;
}

export interface FacilityUpdateRequest {
  name: string;
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

export interface SeatCreateRequest {
  seatCode: string;
  status?: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface SeatUpdateRequest {
  seatCode: string;
  status: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface SeatBulkCreateRequest {
  seatCodes: string[];
}

export interface SpaceTableCreateRequest {
  tableCode: string;
  capacity: number;
  status?: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface SpaceTableUpdateRequest {
  tableCode: string;
  capacity: number;
  status: 'AVAILABLE' | 'INACTIVE';
  description?: string;
}

export interface SpaceImage {
  id: number;
  spaceId: number;
  imageUrl: string;
  isPrimary?: boolean;
  primary?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Ảnh đang được chỉnh sửa trong form quản lý không gian. */
export interface SpaceFormImage {
  id: string;
  type: 'file' | 'url' | 'existing';
  spaceImageId?: number;
  file?: File;
  url?: string;
  previewUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Space {
  id: number;
  name: string;
  spaceCode: string;
  spaceTypeId: number;
  spaceTypeName?: string;
  bookingMode?: BookingMode;
  requiresApproval?: boolean;
  building: string;
  floor: string;
  capacity: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  primaryImageUrl?: string;
  imageUrl?: string;
  images?: SpaceImage[];
  description?: string;
  facilities: Facility[];
  isAvailable?: boolean;
  allowSeatSelection?: boolean;
  allowTableSelection?: boolean;
  spaceType?: SpaceType;
  activeSeatCount?: number;
  activeTableCount?: number;
  activeTableCapacity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpaceCreateRequest {
  name: string;
  spaceCode: string;
  spaceTypeId: number;
  building: string;
  floor: string;
  capacity: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  description?: string;
  facilityIds?: number[];
  imageUrl?: string;
}

export interface SpaceUpdateRequest {
  name: string;
  spaceCode: string;
  spaceTypeId: number;
  building: string;
  floor: string;
  capacity: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  description?: string;
  facilityIds?: number[];
  imageUrl?: string;
}

