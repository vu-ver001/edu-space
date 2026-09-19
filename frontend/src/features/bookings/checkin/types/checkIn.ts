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

export type CheckInDemoState = 'AVAILABLE' | 'TOO_EARLY' | 'CLOSED';

export type CheckInErrorCode =
  | 'CHECKIN_TOO_EARLY'
  | 'CHECKIN_WINDOW_CLOSED'
  | 'CHECKIN_WINDOW_EXPIRED'
  | 'BOOKING_ACCESS_DENIED'
  | 'CHECKIN_FORBIDDEN'
  | 'BOOKING_STATUS_INVALID'
  | 'INVALID_STATUS_FOR_CHECKIN'
  | 'BOOKING_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CHECKIN_POLICY'
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
  spaceName: string;
  building: string;
  startTime: string;
  endTime: string;
  checkInOpenAt?: string;
  checkInDeadline?: string;
  status: BookingStatus;
  canCheckIn?: boolean;
  demoState?: CheckInDemoState;
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

export type CheckInServiceError = Error & {
  code: CheckInErrorCode | string;
  status?: number;
};

export type CheckInService = {
  listBookings: (actor: CheckInActor) => Promise<CheckInBooking[]>;
  checkIn: (bookingId: number, actor: CheckInActor) => Promise<CheckInResult>;
  reset?: () => void;
};
