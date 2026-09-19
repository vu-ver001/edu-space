export interface PolicyResponse {
  id: number;
  maxBookingsPerDay: number;
  maxDurationMinutes: number;
  checkInGraceMinutes: number;
  maxRequestRatePerHour: number;
  checkInEarlyOpenMinutes: number;
  checkInCloseOffsetMinutes: number;
  openingHour?: string;
  closingHour?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface PolicyUpdateRequest {
  maxBookingsPerDay: number;
  maxDurationMinutes: number;
  maxRequestRatePerHour: number;
  checkInEarlyOpenMinutes: number;
  checkInGraceMinutes: number;
  checkInCloseOffsetMinutes: number;
  openingHour?: string;
  closingHour?: string;
}

export interface AuditLogResponse {
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  performedAt: string;
}

export interface SpaceTypeItem {
  id: number;
  name: string;
  description?: string | null;
  bookingMode: 'WHOLE_SPACE' | 'PER_SEAT' | 'PER_TABLE';
  requiresApproval: boolean;
}
