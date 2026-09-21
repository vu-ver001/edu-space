import { CHECK_IN_FIXTURES } from '../mocks/fixtures';
import type {
  CheckInActor,
  CheckInBooking,
  CheckInResult,
  CheckInServiceError,
  CheckInService,
} from '../types/checkIn';

const REQUEST_DELAY_MS = 450;
let bookings = structuredClone(CHECK_IN_FIXTURES);
let failureMode: 'NONE' | 'NETWORK' = 'NONE';

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const serviceError = (code: CheckInServiceError['code'], message: string) => {
  const error = new Error(message) as CheckInServiceError;
  error.code = code;
  return error;
};

export const checkInService: CheckInService & {
  reset: () => void;
  setFailureMode: (mode: 'NONE' | 'NETWORK') => void;
} = {
  async listBookings(_actor: CheckInActor): Promise<CheckInBooking[]> {
    await wait(250);
    if (failureMode === 'NETWORK') {
      throw serviceError('NETWORK_ERROR', 'Không thể kết nối đến máy chủ demo.');
    }
    return structuredClone(bookings);
  },

  async checkIn(bookingId: number, actor: CheckInActor): Promise<CheckInResult> {
    await wait(REQUEST_DELAY_MS);
    if (failureMode === 'NETWORK') {
      throw serviceError('NETWORK_ERROR', 'Không thể kết nối đến máy chủ demo.');
    }

    const booking = bookings.find((item) => item.bookingId === bookingId);
    if (!booking) {
      throw serviceError('BOOKING_NOT_FOUND', 'Không tìm thấy booking này.');
    }

    if (actor.role === 'STUDENT' && booking.studentId !== actor.id) {
      throw serviceError(
        'BOOKING_ACCESS_DENIED',
        'Sinh viên chỉ được check-in booking của mình.',
      );
    }

    if (booking.status !== 'CONFIRMED') {
      throw serviceError(
        'BOOKING_STATUS_INVALID',
        'Chỉ booking đã xác nhận mới có thể check-in.',
      );
    }

    if (booking.demoState === 'TOO_EARLY') {
      throw serviceError(
        'CHECKIN_TOO_EARLY',
        'Chưa đến thời gian check-in cho booking này.',
      );
    }

    if (booking.demoState === 'CLOSED') {
      throw serviceError(
        'CHECKIN_WINDOW_CLOSED',
        'Đã quá hạn check-in cho booking này.',
      );
    }

    const checkedInAt = '2026-09-16T09:00:00+07:00';
    booking.status = 'CHECKED_IN';
    booking.checkedInAt = checkedInAt;
    booking.checkedInBy = actor.name;

    return {
      bookingId: booking.bookingId,
      status: 'CHECKED_IN',
      checkedInAt,
      checkedInBy: actor.name,
    };
  },

  reset() {
    bookings = structuredClone(CHECK_IN_FIXTURES);
  },

  setFailureMode(mode: 'NONE' | 'NETWORK') {
    failureMode = mode;
  },
};
