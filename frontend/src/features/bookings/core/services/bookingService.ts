import api from '../../../../services/api';
import type { Booking, BookingStatus, BookingAuditLog, CreateBookingPayload, BulkBookingOperationResponse } from '../types/booking.types';

export * from '../types/booking.types';

export const bookingService = {
  // Tạo booking mới (10 bước validate tuần tự)
  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    const res = await api.post<Booking>('/api/bookings', payload);
    return res.data;
  },

  // Lấy danh sách booking của tôi
  getMyBookings: async (status?: BookingStatus): Promise<Booking[]> => {
    const params = status ? { status } : {};
    const res = await api.get<Booking[]>('/api/bookings/my-bookings', { params });
    return res.data;
  },

  // Chi tiết booking
  getBookingById: async (id: number): Promise<Booking> => {
    const res = await api.get<Booking>(`/api/bookings/${id}`);
    return res.data;
  },

  // Xem lịch sử thao tác của booking
  getAuditLogs: async (id: number): Promise<BookingAuditLog[]> => {
    const res = await api.get<BookingAuditLog[]>(`/api/bookings/${id}/audit-logs`);
    return res.data;
  },

  // Hủy booking
  cancelBooking: async (id: number, reason?: string): Promise<Booking> => {
    const params = reason ? { reason } : {};
    const res = await api.post<Booking>(`/api/bookings/${id}/cancel`, null, { params });
    return res.data;
  },

  // Duyệt booking (Staff)
  approveBooking: async (id: number): Promise<Booking> => {
    const res = await api.post<Booking>(`/api/bookings/${id}/approve`);
    return res.data;
  },

  // Từ chối booking (Staff)
  rejectBooking: async (id: number, rejectReason: string): Promise<Booking> => {
    const res = await api.post<Booking>(`/api/bookings/${id}/reject`, { rejectReason });
    return res.data;
  },

  // Duyệt hàng loạt booking (Staff/Admin)
  bulkApproveBookings: async (bookingIds: number[]): Promise<BulkBookingOperationResponse> => {
    const res = await api.post<BulkBookingOperationResponse>('/api/bookings/bulk-approve', { bookingIds });
    return res.data;
  },

  // Từ chối hàng loạt booking (Staff/Admin)
  bulkRejectBookings: async (bookingIds: number[], rejectReason: string): Promise<BulkBookingOperationResponse> => {
    const res = await api.post<BulkBookingOperationResponse>('/api/bookings/bulk-reject', { bookingIds, rejectReason });
    return res.data;
  },

  // Check-in (Sinh viên hoặc Staff hỗ trợ)
  checkIn: async (id: number): Promise<Booking> => {
    const res = await api.post<Booking>(`/api/bookings/${id}/check-in`);
    return res.data;
  },

  // Lấy danh sách booking chờ duyệt (Staff)
  getPendingBookings: async (): Promise<Booking[]> => {
    const res = await api.get<Booking[]>('/api/bookings/pending');
    return res.data;
  },

  // Lấy danh sách ghế đang bận theo thời gian thực
  getOccupiedSeats: async (spaceId: number, startTime: string, endTime: string): Promise<string[]> => {
    const res = await api.get<string[]>(`/api/spaces/${spaceId}/occupied-seats`, {
      params: { startTime, endTime }
    });
    return res.data;
  }
};
