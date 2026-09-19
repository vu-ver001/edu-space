import type { SpaceType, BookingMode } from './spaceType';

export interface Facility {
  id: number;
  name: string;
  icon?: string;
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

export interface SpaceImage {
  id: number;
  spaceId: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Space {
  id: number;
  name: string;
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
