export type BookingMode = 'WHOLE_SPACE' | 'PER_SEAT' | 'PER_TABLE';

export interface SpaceType {
  id: number;
  name: string;
  description?: string;
  bookingMode: BookingMode;
  requiresApproval: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpaceTypeCreateRequest {
  name: string;
  description?: string;
  bookingMode: BookingMode;
  requiresApproval: boolean;
}

export interface SpaceTypeUpdateRequest {
  name: string;
  description?: string;
  bookingMode: BookingMode;
  requiresApproval: boolean;
}
