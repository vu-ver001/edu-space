// ==========================================
// EduSpace - Feature: Staff Operations Types
// Author: Nguyen Thi Kim Tuyen
// ==========================================

export type BookingStatus =
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface PendingBooking {
  id: number;
  spaceId: number;
  spaceName: string;
  spaceTypeName?: string;
  building?: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose?: string;
  status: BookingStatus;
  createdAt: string;
  bookingMode?: string;
  tableId?: number;
  tableCode?: string;
  selectedSeats?: string[];
  statusDisplayName?: string;
  requiresApproval?: boolean;
}

export interface StaffBooking extends PendingBooking {
  statusDisplayName?: string;
  isOccupying?: boolean;
  rejectReason?: string;
  rejectedAt?: string;
  expireReason?: string;
  expiredAt?: string;
  checkedInAt?: string;
  checkedInBy?: number;
  canCancel?: boolean;
  canCheckIn?: boolean;
  floor?: string;
}

export type TimelineEventType = 'BOOKING' | 'MAINTENANCE';

export interface StaffTimelineEvent {
  eventType: TimelineEventType;
  eventId: number;
  spaceId: number;
  spaceName: string;
  startTime: string;
  endTime: string;
  status: string;
  title: string;
  bookingMode?: string;
  tableId?: number;
  tableCode?: string;
  selectedSeats?: string[];
  participantCount?: number;
  purpose?: string;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  reason?: string;
  createdBy?: number;
  creatorEmail?: string;
  createdAt: string;
}

export interface StaffTimeline {
  spaceId: number;
  spaceName: string;
  from: string;
  to: string;
  events: StaffTimelineEvent[];
}

export interface MaintenanceBlock {
  id: number;
  spaceId: number;
  spaceName: string;
  reason: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  createdBy?: number;
  creatorEmail?: string;
}

export interface MaintenanceCreateRequest {
  reason: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface MaintenanceUpdateRequest {
  reason: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export type StaffAuditAction =
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'STAFF_CHECK_IN'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_UPDATED'
  | 'MAINTENANCE_DELETED';

export interface StaffAuditLog {
  id: number;
  actorUserId: number;
  actorEmail: string;
  action: StaffAuditAction;
  actionDescription?: string;
  targetType: string;
  targetId: number;
  spaceId?: number;
  details?: string;
  createdAt: string;
}
