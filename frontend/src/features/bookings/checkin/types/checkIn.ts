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
  | 'BOOKING_ACCESS_DENIED'
  | 'BOOKING_STATUS_INVALID'
  | 'BOOKING_NOT_FOUND'
  | 'UNAUTHORIZED'
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
  checkInOpenAt: string;
  checkInDeadline: string;
  status: BookingStatus;
  demoState?: CheckInDemoState;
  checkedInAt?: string;
  checkedInBy?: string;
};

export type CheckInResult = {
  bookingId: number;
  status: 'CHECKED_IN';
  checkedInAt: string;
  checkedInBy: string;
};

export type CheckInServiceError = Error & {
  code: CheckInErrorCode;
};
