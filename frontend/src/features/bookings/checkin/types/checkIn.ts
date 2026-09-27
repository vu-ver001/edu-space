export type CheckInRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export type BookingStatus =
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'COMPLETED';

export type CheckInErrorCode =
  | 'CHECKIN_TOO_EARLY'
  | 'CHECKIN_WINDOW_EXPIRED'
  | 'CHECKIN_FORBIDDEN'
  | 'INVALID_STATUS_FOR_CHECKIN'
  | 'BOOKING_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CHECKIN_POLICY'
  | 'CHECKIN_TOKEN_INVALID'
  | 'INTERNAL_ERROR'
  | 'STAFF_BOOKING_LIST_UNAVAILABLE'
  | 'NETWORK_ERROR';

export type CheckInActor = {
  id: string;
  name: string;
  email: string;
  role: CheckInRole;
};

export type CheckInBooking = {
  bookingId: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  spaceId?: number;
  spaceName: string;
  spaceTypeName?: string;
  building: string;
  participantCount?: number;
  purpose?: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  checkInOpenAt?: string;
  checkInDeadline?: string;
  status: BookingStatus;
  canCheckIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  checkedInById?: number;
};

export type CheckInResult = {
  bookingId: number;
  status: 'CHECKED_IN';
  checkedInAt: string;
  checkedInBy?: string;
  checkedInById?: number;
};

export type CheckInToken = {
  bookingId: number;
  token: string;
  issuedAt: string;
  expiresAt: string;
};

export type CheckInServiceError = Error & {
  code: CheckInErrorCode | string;
  status?: number;
};

export type CheckInService = {
  listBookings: (actor: CheckInActor) => Promise<CheckInBooking[]>;
  checkIn: (bookingId: number, actor: CheckInActor) => Promise<CheckInResult>;
};
