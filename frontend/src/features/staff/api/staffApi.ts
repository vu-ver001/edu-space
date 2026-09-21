import api from '../../../services/api';
import type { PendingBooking, StaffTimeline } from '../types/staff';

export const staffApi = {
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
   * POST /api/staff/bookings/{bookingId}/approve
   * Duyệt booking sang CONFIRMED
   */
  approveBooking: async (bookingId: number): Promise<any> => {
    const res = await api.post(`/api/staff/bookings/${bookingId}/approve`);
    return res.data;
  },

  /**
   * POST /api/staff/bookings/{bookingId}/reject
   * Từ chối booking (bắt buộc lý do R-20)
   */
  rejectBooking: async (bookingId: number, reason: string): Promise<any> => {
    const res = await api.post(`/api/staff/bookings/${bookingId}/reject`, { reason });
    return res.data;
  },

  /**
   * POST /api/staff/bookings/{bookingId}/check-in
   * Staff hỗ trợ Check-in tại quầy cho sinh viên
   */
  staffAssistedCheckIn: async (bookingId: number): Promise<any> => {
    const res = await api.post(`/api/staff/bookings/${bookingId}/check-in`);
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
