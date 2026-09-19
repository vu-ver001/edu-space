import api from './api';

export type BookingStatus = 
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'COMPLETED';

export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  spaceId: number;
  spaceName: string;
  spaceTypeName: string;
  requiresApproval: boolean;
  building: string;
  floor: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose?: string;
  status: BookingStatus;
  statusDisplayName: string;
  isOccupying: boolean;
  rejectReason?: string;
  rejectedAt?: string;
  expireReason?: string;
  expiredAt?: string;
  checkedInAt?: string;
  createdAt: string;
  canCancel: boolean;
  canCheckIn: boolean;
  selectedSeats?: string[];
}

export interface BookingAuditLog {
  id: number;
  bookingId: number;
  action: string;
  actionDescription: string;
  performedByName: string;
  performedByEmail: string;
  performedAt: string;
  reason?: string;
  note?: string;
}

export interface CreateBookingPayload {
  spaceId: number;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose?: string;
  selectedSeats?: string[];
}

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

  // Lấy danh sách ghế đang bận theo thời gian thực (MoMo Cinema)
  getOccupiedSeats: async (spaceId: number, startTime: string, endTime: string): Promise<string[]> => {
    const res = await api.get<string[]>(`/api/spaces/${spaceId}/occupied-seats`, {
      params: { startTime, endTime }
    });
    return res.data;
  }
};
