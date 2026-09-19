import React, { useState } from 'react';
import type { Space } from '../services/spaceService';
import { bookingService } from '../services/bookingService';

interface Props {
  space: Space;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultCount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<Props> = ({
  space,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  defaultCount,
  onClose,
  onSuccess
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(defaultDate || today);
  const [startTime, setStartTime] = useState<string>(
    defaultStartTime ? defaultStartTime.substring(0, 5) : '09:00'
  );
  const [endTime, setEndTime] = useState<string>(
    defaultEndTime ? defaultEndTime.substring(0, 5) : '11:00'
  );
  const [participantCount, setParticipantCount] = useState<number>(defaultCount || 2);
  const [purpose, setPurpose] = useState<string>('Thảo luận đồ án môn học');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string; details?: any[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setSubmitting(true);

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    try {
      await bookingService.createBooking({
        spaceId: space.id,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount,
        purpose
      });
      onSuccess();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && data.code) {
        setErrorInfo({
          code: data.code,
          message: data.message,
          details: data.details
        });
      } else {
        setErrorInfo({
          code: 'CONNECTION_ERROR',
          message: err?.message || 'Không thể kết nối đến máy chủ Backend'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header modal */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📝</span>
            <div>
              <h3 className="modal-title">Đặt Không Gian: {space.name}</h3>
              <p className="modal-subtitle">
                📍 {space.building} • {space.floor} • Sức chứa tối đa: {space.capacity} người
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Thông báo loại phòng */}
        <div className={`policy-notice-box ${space.requiresApproval ? 'notice-approval' : 'notice-auto'}`}>
          {space.requiresApproval ? (
            <div>
              <strong>⚠️ Lưu ý phê duyệt (Staff Approval):</strong> Phòng này thuộc diện kiểm soát đặc biệt. Yêu cầu sẽ bắt đầu ở trạng thái <code>PENDING_APPROVAL</code> và cần Staff xét duyệt trước giờ bắt đầu.
            </div>
          ) : (
            <div>
              <strong>✓ Đặt chỗ tức thì (Instant Confirmation):</strong> Không gian sẽ được xác nhận ngay <code>CONFIRMED</code> nếu không bị xung đột lịch hoặc bảo trì.
            </div>
          )}
        </div>

        {/* Lỗi nghiệp vụ nếu có */}
        {errorInfo && (
          <div className="error-banner">
            <div className="error-header">
              <span className="error-icon">🚫</span>
              <strong>{errorInfo.code}</strong>
            </div>
            <p className="error-msg">{errorInfo.message}</p>
            {errorInfo.details && errorInfo.details.length > 0 && (
              <div className="error-details-box">
                {errorInfo.details.map((d: any, idx: number) => (
                  <div key={idx} className="error-detail-item">
                    • <strong>{d.type || 'XUNG ĐỘT'}:</strong> {d.description || `Từ ${d.startTime} đến ${d.endTime}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">📅 Ngày sử dụng *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">👥 Số người tham gia *</label>
              <input
                type="number"
                className="form-input"
                value={participantCount}
                onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                min={1}
                max={space.capacity}
                required
              />
              <small className="form-hint">Tối đa {space.capacity} người</small>
            </div>

            <div className="form-group">
              <label className="form-label">⏰ Giờ bắt đầu *</label>
              <select
                className="form-select"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">⌛ Giờ kết thúc *</label>
              <select
                className="form-select"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">🎯 Mục đích sử dụng không gian</label>
            <input
              type="text"
              className="form-input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="VD: Học nhóm ôn thi, Thuyết trình đồ án, Thảo luận bài tập..."
            />
          </div>

          {/* Footer nút bấm */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel-modal"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-submit-booking"
              disabled={submitting}
            >
              {submitting ? 'Đang kiểm tra & Đặt phòng...' : 'Xác Nhận Đặt Không Gian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
