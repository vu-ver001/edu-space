import React, { useEffect, useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import type { Booking } from '../services/bookingService';
import { bookingService } from '../services/bookingService';

export const CoreApprovalDemo: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPending = () => {
    setLoading(true);
    setError(null);
    bookingService
        .getPendingBookings()
        .then(setPendingBookings)
        .catch((err) => {
          setError(err?.response?.data?.message || 'Không thể tải danh sách chờ duyệt');
        })
        .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (booking: Booking) => {
    if (!window.confirm(`Xác nhận duyệt yêu cầu đặt phòng "${booking.spaceName}" cho sinh viên ${booking.studentName}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await bookingService.approveBooking(booking.id);
      setToastMessage(`✓ Đã duyệt thành công Booking #${booking.id} sang CONFIRMED.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi duyệt booking');
      fetchPending();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;
    if (!rejectReason.trim()) {
      alert('Lý do từ chối là bắt buộc (Quy tắc R-20)');
      return;
    }

    setActionLoading(true);
    try {
      await bookingService.rejectBooking(rejectingBooking.id, rejectReason.trim());
      setToastMessage(`✕ Đã từ chối Booking #${rejectingBooking.id} với lý do: "${rejectReason}".`);
      setTimeout(() => setToastMessage(null), 4000);
      setRejectingBooking(null);
      setRejectReason('');
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi từ chối booking');
      fetchPending();
    } finally {
      setActionLoading(false);
    }
  };

  return (
      <>
        <div className="page-header-override" style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Duyệt đặt chỗ (Staff)</h2>
        </div>

        {toastMessage && (
            <div className="portal-toast">
              <span>{toastMessage}</span>
              <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
            </div>
        )}

        {/* Thông tin quy tắc phê duyệt nội bộ */}
        <div className="portal-notice-card">
          <div className="notice-icon">🛡️</div>
          <div className="notice-text">
            <strong>Bàn làm việc phê duyệt phòng chuyên dụng (Staff Workflow):</strong>
            <span>
            Theo quy tắc R-18, Staff chỉ có thể duyệt khi <code>now &lt; startTime</code> (nếu quá giờ, booking tự chuyển sang <code>EXPIRED</code>). Khi từ chối bắt buộc nhập lý do theo quy tắc R-20.
          </span>
          </div>
        </div>

        {/* Tiêu đề & Cập nhật */}
        <div className="results-control-bar">
          <div className="results-info-group">
            <h4 className="results-heading">Danh sách yêu cầu chờ duyệt</h4>
            <span className="results-badge">
            {pendingBookings.length} yêu cầu cần xử lý
          </span>
          </div>

          <button
              type="button"
              className="btn-portal-refresh"
              onClick={fetchPending}
              disabled={loading}
              title="Tải lại dữ liệu"
          >
            🔄 Cập nhật
          </button>
        </div>

        {/* Danh sách yêu cầu chờ duyệt */}
        {loading ? (
            <div className="portal-loading-card">
              <div className="portal-spinner" />
              <p>Đang tải danh sách chờ duyệt...</p>
            </div>
        ) : error ? (
            <div className="portal-error-card">
              <span>⚠️</span>
              <h4>Lỗi tải dữ liệu</h4>
              <p>{error}</p>
              <button className="btn-portal-retry" onClick={fetchPending}>Thử lại</button>
            </div>
        ) : pendingBookings.length === 0 ? (
            <div className="portal-empty-card">
              <span>✨</span>
              <h4>Không có yêu cầu chờ duyệt</h4>
              <p>Hiện tại tất cả các yêu cầu đặt phòng đã được xử lý xong.</p>
            </div>
        ) : (
            <div className="portal-table-card">
              <table className="portal-data-table">
                <thead>
                <tr>
                  <th>Mã</th>
                  <th>Phòng yêu cầu</th>
                  <th>Sinh viên đặt</th>
                  <th>Khung giờ</th>
                  <th>Số người & Mục đích</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Quyết định</th>
                </tr>
                </thead>
                <tbody>
                {pendingBookings.map((b) => {
                  const startDt = new Date(b.startTime);
                  const endDt = new Date(b.endTime);

                  return (
                      <tr key={b.id}>
                        <td>
                          <span className="booking-id-chip">#{b.id}</span>
                        </td>
                        <td>
                          <div className="room-name-cell">
                            <strong>{b.spaceName}</strong>
                            <small>{b.spaceTypeName} • {b.building}</small>
                          </div>
                        </td>
                        <td>
                          <div className="student-cell">
                            <strong>{b.studentName}</strong>
                            <small>{b.studentEmail}</small>
                          </div>
                        </td>
                        <td>
                          <div className="time-range-cell">
                            <strong>{startDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                            <small>{startDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                          </div>
                        </td>
                        <td>
                          <div className="purpose-cell">
                            <span>👥 {b.participantCount} người</span>
                            {b.purpose && <small>"{b.purpose}"</small>}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={b.status} size="sm" />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions-flex" style={{ justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn-table-reject"
                                onClick={() => setRejectingBooking(b)}
                                disabled={actionLoading}
                            >
                              ✕ Từ chối
                            </button>
                            <button
                                type="button"
                                className="btn-table-approve"
                                onClick={() => handleApprove(b)}
                                disabled={actionLoading}
                            >
                              ✓ Duyệt ngay
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

        {/* Modal từ chối (bắt buộc nhập lý do) */}
        {rejectingBooking && (
            <div className="modal-backdrop" onClick={() => setRejectingBooking(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title-group">
                    <span className="modal-icon">🚫</span>
                    <div>
                      <h3 className="modal-title">Từ chối đặt phòng #{rejectingBooking.id}</h3>
                      <p className="modal-subtitle">
                        {rejectingBooking.spaceName} • {rejectingBooking.studentName}
                      </p>
                    </div>
                  </div>
                  <button
                      className="modal-close-btn"
                      onClick={() => setRejectingBooking(null)}
                      type="button"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleConfirmReject} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">
                      Lý do từ chối (Bắt buộc theo quy tắc R-20) *
                    </label>
                    <textarea
                        className="internal-input"
                        style={{ minHeight: '90px' }}
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="VD: Không gian ưu tiên cho sự kiện cấp khoa; Yêu cầu chưa cung cấp kế hoạch chi tiết..."
                        required
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel-modal"
                        onClick={() => setRejectingBooking(null)}
                        disabled={actionLoading}
                    >
                      Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        className="btn-confirm-reject"
                        disabled={actionLoading || !rejectReason.trim()}
                    >
                      {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </>
  );
};