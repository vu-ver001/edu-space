import axios from 'axios';
import api from '../../../../services/api';
import type {
  BookingStatus,
  CheckInActor,
  CheckInBooking,
  CheckInResult,
  CheckInService,
  CheckInServiceError,
} from '../types/checkIn';

type BookingResponseDto = {
  id: number;
  studentId: number;
  studentName?: string | null;
  studentEmail?: string | null;
  spaceName?: string | null;
  building?: string | null;
  floor?: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  checkedInAt?: string | null;
  checkedInBy?: number | null;
  canCheckIn?: boolean;
};

type ApiErrorDto = {
  code?: string;
  message?: string;
};

const toError = (error: unknown, fallback: string): CheckInServiceError => {
  const serviceError = new Error(fallback) as CheckInServiceError;

  if (axios.isAxiosError<ApiErrorDto>(error)) {
    const payload = error.response?.data;
    const isNetworkFailure = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    serviceError.code = payload?.code ?? (isNetworkFailure ? 'NETWORK_ERROR' : 'INTERNAL_ERROR');
    serviceError.message = payload?.message ?? fallback;
    serviceError.status = error.response?.status;
    return serviceError;
  }

  serviceError.code = 'NETWORK_ERROR';
  return serviceError;
};

const toBuildingLabel = (building?: string | null, floor?: string | null) => {
  if (building && floor) return `${building} · Tầng ${floor}`;
  return building || (floor ? `Tầng ${floor}` : 'Chưa có thông tin vị trí');
};

export const mapBookingResponse = (data: BookingResponseDto): CheckInBooking => ({
  bookingId: data.id,
  studentId: String(data.studentId),
  studentName: data.studentName || data.studentEmail || `Sinh viên #${data.studentId}`,
  studentCode: data.studentEmail || `ID ${data.studentId}`,
  spaceName: data.spaceName || `Phòng #${data.id}`,
  building: toBuildingLabel(data.building, data.floor),
  startTime: data.startTime,
  endTime: data.endTime,
  status: data.status,
  canCheckIn: data.canCheckIn,
  checkedInAt: data.checkedInAt ?? undefined,
  checkedInById: data.checkedInBy ?? undefined,
});

const toResult = (data: BookingResponseDto): CheckInResult => ({
  bookingId: data.id,
  status: 'CHECKED_IN',
  checkedInAt: data.checkedInAt || '',
  checkedInById: data.checkedInBy ?? undefined,
});

/** Adapter for the real booking/check-in API. The server remains the source of truth. */
export const checkInApiService = {
  async listBookings(actor: CheckInActor): Promise<CheckInBooking[]> {
    if (actor.role !== 'STUDENT') {
      const error = new Error('API hiện chưa có endpoint tra cứu booking cho Staff.') as CheckInServiceError;
      error.code = 'STAFF_BOOKING_LIST_UNAVAILABLE';
      throw error;
    }

    try {
      const response = await api.get<BookingResponseDto[]>('/api/bookings/my-bookings');
      return response.data.map(mapBookingResponse);
    } catch (error) {
      throw toError(error, 'Không thể tải booking của bạn.');
    }
  },

  async getBooking(bookingId: number): Promise<CheckInBooking> {
    try {
      const response = await api.get<BookingResponseDto>(`/api/bookings/${bookingId}`);
      return mapBookingResponse(response.data);
    } catch (error) {
      throw toError(error, 'Không thể tải thông tin booking.');
    }
  },

  async checkIn(bookingId: number, _actor: CheckInActor): Promise<CheckInResult> {
    try {
      const response = await api.post<BookingResponseDto>(`/api/bookings/${bookingId}/check-in`);
      return toResult(response.data);
    } catch (error) {
      throw toError(error, 'Không thể check-in lúc này.');
    }
  },
} satisfies CheckInService & {
  getBooking: (bookingId: number) => Promise<CheckInBooking>;
};
