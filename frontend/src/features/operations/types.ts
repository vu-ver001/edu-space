export type OperationsRole = 'STAFF' | 'ADMIN';

export interface OperationsUser {
  id: number;
  email: string;
  fullName: string;
  role: OperationsRole;
}

export type TimelineEventType = 'BOOKING' | 'MAINTENANCE';

export type TimelineStatus =
  | 'CONFIRMED'
  | 'PENDING_APPROVAL'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface OperationsTimelineEvent {
  eventType: TimelineEventType;
  eventId: number;
  displayCode: string;
  spaceId: number;
  spaceName: string;
  startTime: string;
  endTime: string;
  status: TimelineStatus;
  title: string;
  purpose: string;
  participantName?: string;
  participantCount?: number;
  tableLabel?: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface OperationsSpace {
  id: number;
  name: string;
  location?: string;
  tone?: string;
}

export interface TimelineQuery {
  spaceId?: number;
  from: string;
  to: string;
  eventType?: TimelineEventType | '';
  status?: string;
}

export type AuditAction =
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'STAFF_CHECKED_IN_BOOKING'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_UPDATED'
  | 'MAINTENANCE_CANCELLED';

export type AuditTargetType = 'BOOKING' | 'MAINTENANCE' | 'STUDENT';

export interface OperationsAuditLog {
  id: number;
  actorUserId: number;
  actorName: string;
  actorEmail: string;
  actorRole: OperationsRole;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: number;
  targetLabel: string;
  spaceName: string;
  details: string;
  createdAt: string;
}

export interface AuditQuery {
  action?: AuditAction | '';
  spaceName?: string;
  targetType?: AuditTargetType | '';
  actorUserId?: number;
  from?: string;
  to?: string;
}

export interface AuditPage {
  content: OperationsAuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
