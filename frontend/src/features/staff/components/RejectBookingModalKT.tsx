import React, { useState } from 'react';
import type { PendingBooking } from '../types/staff';

interface RejectBookingModalKTProps {
  isOpen: boolean;
  booking: PendingBooking | null;
  bookingCount?: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const RejectBookingModalKT: React.FC<RejectBookingModalKTProps> = ({
  isOpen,
  booking,
  bookingCount = 1,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const isBulk = bookingCount > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi từ chối yêu cầu.');
    }
  };

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <div className="staff-modal-title-group">
            <span style={{ fontSize: '24px' }}>🚫</span>
            <div>
              <h3 className="staff-modal-title">
                {isBulk ? `Từ chối ${bookingCount} yêu cầu đặt phòng` : `Từ chối yêu cầu đặt phòng #${booking.id}`}
              </h3>
              <p className="staff-modal-subtitle">
                {isBulk
                  ? 'Lý do bên dưới sẽ được áp dụng cho tất cả booking đã chọn.'
                  : `${booking.spaceName} • ${booking.studentName} (${booking.studentEmail})`}
              </p>
            </div>
          </div>
          <button className="staff-modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="staff-alert staff-alert-error" style={{ margin: '16px 24px 0' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="staff-modal-form" noValidate>
          <div className="staff-form-group">
            <label className="staff-form-label">
              Lý do từ chối <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              className={`staff-textarea ${error ? 'input-error' : ''}`}
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: Không gian ưu tiên cho sự kiện cấp trường; Khung giờ trùng lịch bảo trì thiết bị..."
              disabled={isLoading}
            />
            <small style={{ color: '#64748b', fontSize: '12px' }}>
              Lý do này sẽ được ghi vào nhật ký kiểm toán và thông báo đến sinh viên.
            </small>
          </div>

          <div className="staff-modal-footer">
            <button
              type="button"
              className="staff-btn staff-btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="staff-btn staff-btn-danger"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
