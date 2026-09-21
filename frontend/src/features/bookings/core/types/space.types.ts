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

export interface SearchFilter {
  date: string;
  startTime: string;
  endTime: string;
  participantCount?: number;
  spaceTypeId?: number;
  building?: string;
  facilityIds?: number[];
  bookingMode?: 'WHOLE_SPACE' | 'PER_SEAT' | 'PER_TABLE';
}
