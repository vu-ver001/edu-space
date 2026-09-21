import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { AuditLogModal } from '../components/AuditLogModal';
import type { Booking } from '../services/bookingService';
import { bookingService } from '../services/bookingService';
import './MyBookingsPage.css';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [selectedBookingForAudit, setSelectedBookingForAudit] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    bookingService
      .getMyBookings()
      .then(setBookings)
      .catch((err) => {
        setError(err?.response?.data?.message || 'Không thể tải danh sách đặt phòng.');
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

  // Xác nhận hủy đặt phòng
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      await bookingService.cancelBooking(cancellingBooking.id, cancelReason.trim() || 'Người dùng chủ động hủy');
      setToastMessage(`✓ Đã hủy thành công đơn #${cancellingBooking.id}. Phòng đã được giải phóng.`);
      setTimeout(() => setToastMessage(null), 4000);
      setCancellingBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể hủy đơn đặt phòng này.');
    } finally {
      setActionLoading(false);
    }
  };

  // Check-in trực tiếp
  const handleCheckIn = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await bookingService.checkIn(booking.id);
      setToastMessage(`🎉 Check-in thành công tại ${booking.spaceName}! Bạn có thể bắt đầu sử dụng phòng.`);
      setTimeout(() => setToastMessage(null), 4500);
      fetchBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể check-in lúc này.');
    } finally {
      setActionLoading(false);
    }
  };

  // Tính toán số liệu thống kê (Metrics)
  const metrics = useMemo(() => {
    const total = bookings.length;
    const occupying = bookings.filter((b) => b.isOccupying).length;
    const pending = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;
    const readyCheckIn = bookings.filter((b) => b.status === 'CONFIRMED' && b.canCheckIn).length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    return { total, occupying, pending, readyCheckIn, confirmed, completed };
  }, [bookings]);

  // Bộ lọc danh sách
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'ACTIVE') {
        if (!b.isOccupying) return false;
      } else if (activeTab === 'PENDING') {
        if (b.status !== 'PENDING_APPROVAL') return false;
      } else if (activeTab === 'CONFIRMED') {
        if (b.status !== 'CONFIRMED') return false;
      } else if (activeTab === 'CHECKED_IN') {
        if (b.status !== 'CHECKED_IN') return false;
      } else if (activeTab === 'HISTORY') {
        if (b.isOccupying) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.spaceName?.toLowerCase().includes(q);
        const matchType = b.spaceTypeName?.toLowerCase().includes(q);
        const matchPurpose = b.purpose?.toLowerCase().includes(q);
        const matchBuilding = b.building?.toLowerCase().includes(q);
        const matchId = String(b.id).includes(q);
        if (!matchName && !matchType && !matchPurpose && !matchBuilding && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  // Helper định dạng ngày tháng chuẩn như Check-in
  const parseDateInfo = (isoString: string) => {
    const d = new Date(isoString);
    const dayNum = d.getDate().toString().padStart(2, '0');
    const monthNum = `THÁNG ${d.getMonth() + 1}`;
    const fullDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { dayNum, monthNum, fullDate, timeStr };
  };

  return (
    <div className="my-bookings-container">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="astp-toast-float">
          <div style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}>
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="mb-header">
        <div className="mb-header-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D72FE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <circle cx="8" cy="15" r="1.2" fill="#1D72FE"/>
              <circle cx="12" cy="15" r="1.2" fill="#1D72FE"/>
              <circle cx="16" cy="15" r="1.2" fill="#1D72FE"/>
            </svg>
            Lịch đặt của tôi
          </h1>
          <p>
            Theo dõi tiến độ xét duyệt, nhận phòng điểm danh và quản lý toàn bộ các lượt đặt chỗ học tập của bạn.
          </p>
        </div>

        <div className="mb-header-actions">
          <button
            type="button"
            className="btn-mb-refresh"
            onClick={fetchBookings}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'mbRotate 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (Viền xanh nhẹ tinh tế từng khung) */}
      <div className="mb-metrics-grid">
        <div className="mb-metric-card">
          <div className="mb-metric-icon-box active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
            </svg>
          </div>
          <div className="mb-metric-info">
            <span className="mb-metric-val">{metrics.occupying}</span>
            <span className="mb-metric-label">Đang giữ chỗ</span>
            <span className="mb-metric-subtext">Hạn mức tối đa 2 đơn/ngày</span>
          </div>
        </div>

        <div className="mb-metric-card">
          <div className="mb-metric-icon-box pending">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 22h14M5 2h14"/>
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
            </svg>
          </div>
          <div className="mb-metric-info">
            <span className="mb-metric-val">{metrics.pending}</span>
            <span className="mb-metric-label">Chờ Staff duyệt</span>
            <span className="mb-metric-subtext">Phòng hội thảo/cần duyệt trước</span>
          </div>
        </div>

        <div className="mb-metric-card">
          <div className="mb-metric-icon-box checkin">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              <circle cx="18" cy="4" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="mb-metric-info">
            <span className="mb-metric-val">{metrics.readyCheckIn > 0 ? `${metrics.readyCheckIn} sẵn sàng` : metrics.confirmed}</span>
            <span className="mb-metric-label">Đã xác nhận & Check-in</span>
            <span className="mb-metric-subtext">
              {metrics.readyCheckIn > 0 ? '🟢 Cửa sổ check-in đang mở!' : 'Mở trước giờ bắt đầu 15p'}
            </span>
          </div>
        </div>

        <div className="mb-metric-card">
          <div className="mb-metric-icon-box completed">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div className="mb-metric-info">
            <span className="mb-metric-val">{metrics.completed}</span>
            <span className="mb-metric-label">Đã hoàn thành</span>
            <span className="mb-metric-subtext">Tổng số {metrics.total} lượt đặt trong lịch sử</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Filter Tabs & Search */}
      <div className="mb-toolbar-card">
        <div className="mb-tabs-nav">
          {[
            { key: 'ALL', label: 'Tất cả', count: metrics.total },
            { key: 'ACTIVE', label: 'Đang hoạt động', count: metrics.occupying },
            { key: 'PENDING', label: 'Chờ duyệt', count: metrics.pending },
            { key: 'CONFIRMED', label: 'Đã xác nhận', count: metrics.confirmed },
            { key: 'CHECKED_IN', label: 'Đã check-in', count: bookings.filter(b => b.status === 'CHECKED_IN').length },
            { key: 'HISTORY', label: 'Lịch sử / Đã kết thúc', count: bookings.filter(b => !b.isOccupying).length }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`mb-tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="mb-tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="mb-toolbar-right">
          <div className="mb-search-box">
            <svg className="mb-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="mb-search-input"
              placeholder="Tìm theo tên phòng, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 4. Nội dung chính: Danh sách Bookings DẠNG THẺ (CARDS VIEW) */}
      {loading ? (
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>Đang tải danh sách đặt phòng của bạn...</p>
        </div>
      ) : error ? (
        <div className="portal-error-card">
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h4 style={{ margin: '8px 0', color: '#991B1B' }}>Không thể tải dữ liệu</h4>
          <p style={{ color: '#64748B' }}>{error}</p>
          <button className="btn-portal-retry" onClick={fetchBookings}>Thử lại</button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mb-empty-state">
          <span className="mb-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <h3>Không tìm thấy lượt đặt phòng nào</h3>
          <p>
            {searchQuery
              ? 'Không có kết quả nào khớp với từ khóa tìm kiếm của bạn.'
              : 'Bạn chưa có yêu cầu đặt chỗ nào trong danh mục này.'}
          </p>
          <button
            type="button"
            className="btn-mb-new-booking"
            style={{ margin: '0 auto' }}
            onClick={() => navigate('/spaces')}
          >
            Khám phá phòng học & Đặt ngay
          </button>
        </div>
      ) : (
        /* DẠNG THẺ TRỰC QUAN DUY NHẤT (CARDS VIEW) */
        <div className="mb-cards-grid">
          {filteredBookings.map((b) => {
            const startInfo = parseDateInfo(b.startTime);
            const endInfo = parseDateInfo(b.endTime);

            // Phân biệt mô hình đặt chỗ
            const isPerSeat = b.selectedSeats && b.selectedSeats.length > 0;
            const isPerTable = Boolean(b.tableId || b.tableCode);

            return (
              <div
                key={b.id}
                className={`mb-booking-card ${b.isOccupying ? 'occupying' : ''} ${b.canCheckIn ? 'checkin-ready' : ''}`}
              >
                <div>
                  {/* Thanh trên cùng của Thẻ */}
                  <div className="mb-card-top-bar">
                    <span className="mb-card-booking-id">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      Đơn #{b.id}
                    </span>
                    <StatusBadge status={b.status} size="md" />
                  </div>

                  {/* Phần thân chính của Thẻ */}
                  <div className="mb-card-main">
                    {/* Khối Ngày Tháng Chuẩn Giao Diện Check-in (Ảnh 2) */}
                    <div className="mb-date-box">
                      <strong className="mb-date-day">{startInfo.dayNum}</strong>
                      <span className="mb-date-month">{startInfo.monthNum}</span>
                    </div>

                    {/* Chi tiết Không gian & Thời gian */}
                    <div className="mb-space-details">
                      <div className="mb-space-name-row">
                        <Link to={`/spaces/${b.spaceId}`} className="mb-space-title">
                          {b.spaceName}
                        </Link>

                        {/* Huy hiệu mô hình đặt */}
                        {isPerTable ? (
                          <span className="mb-mode-pill table">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3, verticalAlign: '-1px' }}>
                              <rect x="2" y="5" width="20" height="4" rx="1"/>
                              <line x1="6" y1="9" x2="4" y2="20"/>
                              <line x1="18" y1="9" x2="20" y2="20"/>
                            </svg>
                            {b.tableCode ? `Bàn ${b.tableCode}` : `Bàn #${b.tableId}`}
                          </span>
                        ) : isPerSeat ? (
                          <span className="mb-mode-pill seat">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3, verticalAlign: '-1px' }}>
                              <path d="M7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6"/>
                              <path d="M4 11h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z"/>
                              <line x1="6" y1="19" x2="6" y2="22"/>
                              <line x1="18" y1="19" x2="18" y2="22"/>
                            </svg>
                            {b.selectedSeats?.length} ghế ({b.selectedSeats?.join(', ')})
                          </span>
                        ) : (
                          <span className="mb-mode-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3, verticalAlign: '-1px' }}>
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            Toàn bộ phòng
                          </span>
                        )}
                      </div>

                      <div className="mb-space-location">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{b.building} • {b.floor}</span>
                        <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                        <span style={{ color: '#475569' }}>{b.spaceTypeName}</span>
                      </div>

                      <div className="mb-time-badge-row">
                        <span className="mb-time-tag">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D72FE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {startInfo.timeStr} – {endInfo.timeStr}
                        </span>
                        <span className="mb-participants-tag">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: '-1px' }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          {b.participantCount} người
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mục đích sử dụng */}
                  {b.purpose && (
                    <div className="mb-purpose-box">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0, marginTop: 1 }}>
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 3.33-1.67 5-5 6v2z"/>
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 3.33-1.67 5-5 6v2z"/>
                      </svg>
                      <span>"{b.purpose}"</span>
                    </div>
                  )}

                  {/* Các trạng thái thông báo cụ thể từ CSDL */}
                  {b.status === 'CONFIRMED' && b.canCheckIn && (
                    <div className="mb-alert-box ready">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <div>
                        <strong>Cửa sổ check-in đang mở!</strong> Hãy bấm nút check-in bên dưới để xác nhận có mặt sử dụng phòng.
                      </div>
                    </div>
                  )}

                  {b.status === 'CONFIRMED' && !b.canCheckIn && (
                    <div className="mb-alert-box muted">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <div>
                        Phòng đã được giữ chỗ. Cửa sổ check-in sẽ tự động mở trước giờ bắt đầu 15 phút.
                      </div>
                    </div>
                  )}

                  {b.status === 'PENDING_APPROVAL' && (
                    <div className="mb-alert-box muted" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div>
                        Đơn đang chờ Staff quản lý không gian xét duyệt. Bạn có thể chủ động hủy trước giờ bắt đầu nếu đổi kế hoạch.
                      </div>
                    </div>
                  )}

                  {b.status === 'REJECTED' && b.rejectReason && (
                    <div className="mb-alert-box danger">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <div>
                        <strong>Lý do từ chối:</strong> {b.rejectReason}
                      </div>
                    </div>
                  )}

                  {b.status === 'EXPIRED' && (
                    <div className="mb-alert-box muted">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M10 2h4M12 14v-4M4 10a8 8 0 1 1 16 0c0 4.418-3.582 8-8 8s-8-3.582-8-8z"/>
                      </svg>
                      <div>
                        <strong>Hết hạn xử lý:</strong> {b.expireReason || 'Đã quá giờ bắt đầu mà chưa được duyệt.'}
                      </div>
                    </div>
                  )}

                  {b.status === 'NO_SHOW' && (
                    <div className="mb-alert-box danger">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="18" y1="8" x2="23" y2="13"/>
                        <line x1="23" y1="8" x2="18" y2="13"/>
                      </svg>
                      <div>
                        <strong>Vắng mặt (No-show):</strong> {b.expireReason || 'Quá 15 phút sau giờ bắt đầu mà không thực hiện check-in.'}
                      </div>
                    </div>
                  )}

                  {b.status === 'CHECKED_IN' && (
                    <div className="mb-alert-box ready">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <div>
                        <strong>Đã check-in điểm danh thành công.</strong> Chúc bạn có buổi học tập và làm việc hiệu quả!
                      </div>
                    </div>
                  )}
                </div>

                {/* Các nút thao tác ở chân Thẻ */}
                <div className="mb-card-actions">
                  <div className="mb-actions-left">
                    {/* Nút Check-in nổi bật nếu đủ điều kiện */}
                    {b.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        className="btn-card-checkin"
                        onClick={() => handleCheckIn(b)}
                        disabled={!b.canCheckIn || actionLoading}
                        style={{
                          opacity: b.canCheckIn ? 1 : 0.65,
                          cursor: b.canCheckIn ? 'pointer' : 'not-allowed',
                          background: b.canCheckIn ? undefined : '#94A3B8'
                        }}
                        title={b.canCheckIn ? 'Bấm để check-in có mặt' : 'Chưa đến giờ check-in (mở trước giờ bắt đầu 15 phút)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {b.canCheckIn ? 'Check-in ngay' : 'Chưa đến giờ check-in'}
                      </button>
                    )}

                    {/* Nút Hủy nếu được phép */}
                    {b.canCancel && (
                      <button
                        type="button"
                        className="btn-card-cancel"
                        onClick={() => {
                          setCancellingBooking(b);
                          setCancelReason('');
                        }}
                        disabled={actionLoading}
                        title="Hủy đơn đặt phòng này"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Hủy đặt chỗ
                      </button>
                    )}
                  </div>

                  <div className="mb-actions-right">
                    {/* Xem chi tiết phòng */}
                    <button
                      type="button"
                      className="btn-card-icon-action btn-action-view"
                      onClick={() => navigate(`/spaces/${b.spaceId}`)}
                      title="Xem phòng"
                      aria-label="Xem phòng"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>

                    {/* Xem Audit Log */}
                    <button
                      type="button"
                      className="btn-card-icon-action btn-action-audit"
                      onClick={() => setSelectedBookingForAudit(b)}
                      title="Nhật ký đặt phòng"
                      aria-label="Nhật ký đặt phòng"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal Xác Nhận Hủy Đặt Phòng (Cancel Booking Modal) */}
      {cancellingBooking && (
        <div className="mb-modal-overlay" onClick={() => setCancellingBooking(null)}>
          <div className="mb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Xác nhận hủy đặt chỗ
              </h3>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="mb-modal-body">
              <p style={{ margin: '0 0 16px', color: '#334155', fontSize: '0.925rem', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn hủy lượt đặt tại <strong>{cancellingBooking.spaceName}</strong> vào ngày <strong>{parseDateInfo(cancellingBooking.startTime).fullDate}</strong>?
              </p>

              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#991B1B',
                fontSize: '0.85rem',
                marginBottom: '16px',
                lineHeight: 1.4
              }}>
                📌 <strong>Lưu ý:</strong> Ngay sau khi hủy, phòng sẽ được giải phóng lập tức trong cơ sở dữ liệu để các bạn sinh viên khác có thể đặt.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Lý do hủy (tùy chọn)
                </label>
                <input
                  type="text"
                  className="mb-search-input"
                  style={{ width: '100%', height: '40px', padding: '0 12px' }}
                  placeholder="Ví dụ: Bận lịch thi đột xuất, đổi kế hoạch nhóm..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-modal-footer">
              <button
                type="button"
                className="btn-modal-back"
                onClick={() => setCancellingBooking(null)}
                disabled={actionLoading}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="btn-modal-confirm-cancel"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Xem Nhật Ký Kiểm Toán (Audit Log Modal) */}
      {selectedBookingForAudit && (
        <AuditLogModal
          booking={selectedBookingForAudit}
          onClose={() => setSelectedBookingForAudit(null)}
        />
      )}
    </div>
  );
};
