import axios from 'axios';
import api from '../../../services/api';
import type {
  BookingStatus,
  BulkBookingOperationResponse,
  PendingBooking,
  StaffBooking,
  StaffTimeline,
} from '../types/staff';

/** Structured view of a failed check-in request, extracted without leaking axios internals. */
export interface ApiErrorDetail {
  code: string;
  message: string;
  status?: number;
}

type ApiErrorBody = { code?: string; message?: string };

const toApiError = (error: unknown, fallback: string): ApiErrorDetail => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const isNetworkFailure = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    return {
      code: body?.code ?? (isNetworkFailure ? 'NETWORK_ERROR' : 'INTERNAL_ERROR'),
      message: body?.message ?? fallback,
      status: error.response?.status,
    };
  }
  return { code: 'NETWORK_ERROR', message: fallback };
};

export const staffApi = {
  /**
   * GET /api/staff/bookings?status={optional}
   * Danh sách quản lý booking dành cho Staff/Admin
   */
  getBookings: async (status?: BookingStatus): Promise<StaffBooking[]> => {
    const params = status ? { status } : {};
    const res = await api.get<StaffBooking[]>('/api/staff/bookings', { params });
    return res.data;
  },

  /**
   * GET /api/staff/bookings/pending?spaceId={optional}
   * Danh sách đặt phòng chờ Staff duyệt
   */
  getPendingBookings: async (spaceId?: number): Promise<PendingBooking[]> => {
    const params = spaceId ? { spaceId } : {};
    const res = await api.get<PendingBooking[]>('/api/staff/bookings/pending', { params });
    return res.data;
  },

  /**
   * POST /api/bookings/{bookingId}/approve
   * Gọi trực tiếp API lõi booking do phân hệ Booking cung cấp.
   */
  approveBooking: async (bookingId: number): Promise<StaffBooking> => {
    const res = await api.post<StaffBooking>(`/api/bookings/${bookingId}/approve`);
    return res.data;
  },

  /**
   * POST /api/bookings/{bookingId}/reject
   * Gọi trực tiếp API lõi booking; rejectReason là tên trường backend yêu cầu.
   */
  rejectBooking: async (bookingId: number, reason: string): Promise<StaffBooking> => {
    const res = await api.post<StaffBooking>(`/api/bookings/${bookingId}/reject`, { rejectReason: reason });
    return res.data;
  },

  /**
   * POST /api/bookings/bulk-approve
   * Duyệt nhiều booking trong một request.
   */
  bulkApproveBookings: async (bookingIds: number[]): Promise<BulkBookingOperationResponse> => {
    const res = await api.post<BulkBookingOperationResponse>('/api/bookings/bulk-approve', { bookingIds });
    return res.data;
  },

  /**
   * POST /api/bookings/bulk-reject
   * Từ chối nhiều booking với một lý do chung.
   */
  bulkRejectBookings: async (
    bookingIds: number[],
    rejectReason: string,
  ): Promise<BulkBookingOperationResponse> => {
    const res = await api.post<BulkBookingOperationResponse>('/api/bookings/bulk-reject', {
      bookingIds,
      rejectReason,
    });
    return res.data;
  },

  /**
   * POST /api/bookings/{bookingId}/check-in
   * Dùng chung API check-in lõi cho Student/Staff/Admin.
   */
  staffAssistedCheckIn: async (bookingId: number): Promise<StaffBooking> => {
    const res = await api.post<StaffBooking>(`/api/bookings/${bookingId}/check-in`);
    return res.data;
  },

  /**
   * POST /api/staff/check-in/scan
   * Quét mã một lần của sinh viên; backend tự tra token về booking rồi chạy
   * chung lệnh check-in. Trả về BookingResponse đầy đủ để hiển thị kết quả.
   */
  scanCheckInToken: async (token: string): Promise<StaffBooking> => {
    const res = await api.post<StaffBooking>('/api/staff/check-in/scan', { token });
    return res.data;
  },

  /**
   * Bọc lỗi của luồng check-in thành ApiErrorDetail để tầng UI không đụng axios.
   */
  scanCheckInError: (error: unknown): ApiErrorDetail =>
    toApiError(error, 'Không thể xác minh mã check-in lúc này.'),

  /**
   * GET /api/staff/spaces/{spaceId}/timeline?from={ISO}&to={ISO}
   * Timeline kết hợp cả Booking và Bảo trì
   */
  getSpaceTimeline: async (
    spaceId: number,
    from: string,
    to: string
  ): Promise<StaffTimeline> => {
    const res = await api.get<StaffTimeline>(`/api/staff/spaces/${spaceId}/timeline`, {
      params: { from, to },
    });
    return res.data;
  },
};
