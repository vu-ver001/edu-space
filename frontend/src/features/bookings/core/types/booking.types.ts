export type BookingStatus = 
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'COMPLETED';

export interface Booking {
  id: number;
  bookingCode?: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  spaceId: number;
  spaceName: string;
  spaceTypeName: string;
  requiresApproval: boolean;
  building: string;
  floor: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose?: string;
  status: BookingStatus;
  statusDisplayName: string;
  isOccupying: boolean;
  rejectReason?: string;
  rejectedAt?: string;
  expireReason?: string;
  expiredAt?: string;
  checkedInAt?: string;
  createdAt: string;
  canCancel: boolean;
  canCheckIn: boolean;
  tableId?: number;
  tableCode?: string;
  selectedSeats?: string[];
}

export interface BookingAuditLog {
  id: number;
  bookingId: number;
  action: string;
  actionDescription: string;
  performedByName: string;
  performedByEmail: string;
  performedAt: string;
  reason?: string;
  note?: string;
}

export interface CreateBookingPayload {
  spaceId: number;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose?: string;
  tableId?: number;
  selectedSeats?: string[];
}

export interface BulkBookingFailureItem {
  bookingId: number;
  bookingCode?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface BulkBookingOperationResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  successfulBookings: Booking[];
  failedBookings: BulkBookingFailureItem[];
}

