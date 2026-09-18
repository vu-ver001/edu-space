import React, { useEffect, useState } from 'react';
import { PortalLayout } from '../components/PortalLayout';
import { StatusBadge } from '../components/StatusBadge';
import { AuditLogModal } from '../components/AuditLogModal';
import type { Booking } from '../services/bookingService';
import { bookingService } from '../services/bookingService';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedBookingForAudit, setSelectedBookingForAudit] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    bookingService
      .getMyBookings()
      .then(setBookings)
      .catch((err) => {
        setError(err?.response?.data?.message || 'Không thể tải danh sách đặt phòng');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();

    const handleUserSwitch = () => {
      fetchBookings();
    };
    window.addEventListener('user-switched', handleUserSwitch);
    return () => window.removeEventListener('user-switched', handleUserSwitch);
  }, []);

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt chỗ này?')) return;
    setActionLoading(true);
    try {
      await bookingService.cancelBooking(id, 'Người dùng chủ động hủy');
      setToastMessage('✓ Hủy đặt chỗ thành công và đã giải phóng phòng.');
      setTimeout(() => setToastMessage(null), 4000);
      fetchBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể hủy booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    setActionLoading(true);
    try {
      await bookingService.checkIn(id);
      setToastMessage('🎉 Check-in thành công! Bạn có thể bắt đầu sử dụng phòng.');
      setTimeout(() => setToastMessage(null), 4000);
      fetchBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể check-in booking này');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ACTIVE') {
      return b.status === 'CONFIRMED' || b.status === 'PENDING_APPROVAL' || b.status === 'CHECKED_IN';
    }
    if (activeTab === 'PENDING') return b.status === 'PENDING_APPROVAL';
    if (activeTab === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (activeTab === 'HISTORY') {
      return b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'NO_SHOW' || b.status === 'REJECTED';
    }
    return true;
  });

  return (
    <PortalLayout pageTitle="Lịch đặt của tôi">
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Tabs Filter Bar */}
      <div className="portal-tabs-card">
        <div className="portal-tabs-list">
          {[
            { key: 'ALL', label: 'Tất cả', count: bookings.length },
            {
              key: 'ACTIVE',
              label: 'Đang hoạt động',
              count: bookings.filter((b) => b.isOccupying).length
            },
            {
              key: 'PENDING',
              label: 'Chờ duyệt',
              count: bookings.filter((b) => b.status === 'PENDING_APPROVAL').length
            },
            {
              key: 'CONFIRMED',
              label: 'Đã xác nhận',
              count: bookings.filter((b) => b.status === 'CONFIRMED').length
            },
            {
              key: 'HISTORY',
              label: 'Lịch sử',
              count: bookings.filter((b) => !b.isOccupying).length
            }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`portal-tab-pill ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="pill-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-portal-refresh"
          onClick={fetchBookings}
          disabled={loading}
          title="Tải lại dữ liệu"
        >
          🔄 Cập nhật
        </button>
      </div>

      {/* Danh sách Bookings */}
      {loading ? (
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>Đang tải danh sách đặt phòng...</p>
        </div>
      ) : error ? (
        <div className="portal-error-card">
          <span>⚠️</span>
          <h4>Lỗi tải dữ liệu</h4>
          <p>{error}</p>
          <button className="btn-portal-retry" onClick={fetchBookings}>Thử lại</button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="portal-empty-card">
          <span>📅</span>
          <h4>Không có lịch đặt phòng nào</h4>
          <p>Hiện không có yêu cầu nào trong mục này.</p>
        </div>
      ) : (
        <div className="portal-table-card">
          <table className="portal-data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Không gian</th>
                <th>Ngày sử dụng</th>
                <th>Khung giờ</th>
                <th>Số người & Mục đích</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const startDt = new Date(b.startTime);
                const endDt = new Date(b.endTime);
                const now = new Date();
                const isPastStart = now >= startDt;

                return (
                  <tr key={b.id}>
                    <td>
                      <span className="booking-id-chip">#{b.id}</span>
                    </td>
                    <td>
                      <div className="room-name-cell">
                        <strong>{b.spaceName}</strong>
                        <small>{b.building} • {b.floor}</small>
                      </div>
                    </td>
                    <td>
                      <span className="date-text">
                        {startDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className="time-range-text">
                        {startDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <div className="purpose-cell">
                        <span>👥 {b.participantCount} người</span>
                        {b.selectedSeats && b.selectedSeats.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#4f46e5',
                              backgroundColor: '#eef2ff',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              border: '1px solid #c7d2fe'
                            }}>
                              💺 Chỗ ngồi: {b.selectedSeats.join(', ')}
                            </span>
                          </div>
                        )}
                        {b.purpose && <small>"{b.purpose}"</small>}
                      </div>
                    </td>
                    <td>
                      <div className="status-cell-flex">
                        <StatusBadge status={b.status} size="sm" />
                        {b.status === 'REJECTED' && b.rejectReason && (
                          <small className="cell-note text-danger">Lý do: {b.rejectReason}</small>
                        )}
                        {b.status === 'CONFIRMED' && b.canCheckIn && (
                          <small className="cell-note text-success">Cửa sổ check-in đang mở</small>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-flex">
                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className={`btn-table-checkin ${b.canCheckIn ? 'active' : 'disabled'}`}
                            onClick={() => handleCheckIn(b.id)}
                            disabled={!b.canCheckIn || actionLoading}
                            title={b.canCheckIn ? 'Nhấn để check-in' : 'Mở trong khoảng 15 phút trước/sau giờ bắt đầu'}
                          >
                            {b.canCheckIn ? '✓ Check-in' : 'Chờ giờ check-in'}
                          </button>
                        )}

                        {b.canCancel && (
                          <button
                            type="button"
                            className="btn-table-cancel"
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={actionLoading || isPastStart}
                            title="Hủy đặt chỗ trước giờ bắt đầu"
                          >
                            Hủy
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-audit"
                          onClick={() => setSelectedBookingForAudit(b)}
                          title="Xem nhật ký kiểm toán"
                        >
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Audit Log */}
      {selectedBookingForAudit && (
        <AuditLogModal
          booking={selectedBookingForAudit}
          onClose={() => setSelectedBookingForAudit(null)}
        />
      )}
    </PortalLayout>
  );
};
