import api from '../../../services/api';
import type {
  BookingStatus,
  PendingBooking,
  StaffBooking,
  StaffTimeline,
} from '../types/staff';

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
   * POST /api/bookings/{bookingId}/check-in
   * Dùng chung API check-in lõi cho Student/Staff/Admin.
   */
  staffAssistedCheckIn: async (bookingId: number): Promise<StaffBooking> => {
    const res = await api.post<StaffBooking>(`/api/bookings/${bookingId}/check-in`);
    return res.data;
  },

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
