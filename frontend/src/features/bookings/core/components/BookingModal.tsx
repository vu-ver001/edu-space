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
  const [participantCount, setParticipantCount] = useState<number | string>(defaultCount || 2);
  const [purpose, setPurpose] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string; details?: any[] } | null>(null);

  const bookingMode = space.bookingMode || space.spaceType?.bookingMode || (
    space.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space.spaceTypeName?.toLowerCase().includes('ghế') || space.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );
  const isPerSeat = bookingMode === 'PER_SEAT';
  // LOGIC MỚI: PER_SEAT duyệt tức thì (false), PER_TABLE & WHOLE_SPACE chờ Staff duyệt (true)
  const requiresApproval = space.requiresApproval !== undefined ? space.requiresApproval : !isPerSeat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);

    // LOGIC MỚI: Bắt buộc nhập lý do đối với per-table và whole-space
    if (requiresApproval && (!purpose || !purpose.trim())) {
      setErrorInfo({
        code: 'PURPOSE_REQUIRED',
        message: 'Vui lòng nhập mục đích sử dụng (bắt buộc đối với phòng trọn gói và đặt theo bàn).'
      });
      return;
    }

    if (startTime >= endTime) {
      setErrorInfo({
        code: 'INVALID_TIME_RANGE',
        message: 'Thời gian bắt đầu phải trước thời gian kết thúc.'
      });
      return;
    }

    setSubmitting(true);

    const toIsoDateTime = (dateStr: string, timeStr: string) => {
      const parts = (timeStr || '').trim().split(':');
      const h = (parts[0] || '08').padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const s = (parts[2] || '00').padStart(2, '0');
      return `${dateStr}T${h}:${m}:${s}`;
    };

    const startDateTime = toIsoDateTime(date, startTime);
    const endDateTime = toIsoDateTime(date, endTime);

    try {
      await bookingService.createBooking({
        spaceId: space.id,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount: Number(participantCount) || 1,
        purpose: purpose.trim() || (isPerSeat ? 'Tự học cá nhân' : '')
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
        <div className={`policy-notice-box ${requiresApproval ? 'notice-approval' : 'notice-auto'}`}>
          {requiresApproval ? (
            <div>
              <strong>⚠️ Lưu ý phê duyệt (Staff Approval):</strong> Phòng này yêu cầu xét duyệt trước khi sử dụng. Lượt đặt bắt đầu ở trạng thái <code>PENDING_APPROVAL</code> và mục đích sử dụng là <strong>bắt buộc</strong>.
            </div>
          ) : (
            <div>
              <strong>✓ Đặt chỗ tức thì (Instant Confirmation):</strong> Chế độ đặt chỗ cá nhân không cần Staff phê duyệt, được xác nhận ngay <code>CONFIRMED</code> và mục đích sử dụng không bắt buộc.
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
                className="form-input internal-date-input"
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
                onChange={(e) => {
                  const val = e.target.value;
                  setParticipantCount(val === '' ? '' : parseInt(val) || 1);
                }}
                onBlur={() => {
                  if (!participantCount || Number(participantCount) < 1) {
                    setParticipantCount(1);
                  } else if (Number(participantCount) > space.capacity) {
                    setParticipantCount(space.capacity);
                  }
                }}
                min={1}
                max={space.capacity}
                required
              />
              <small className="form-hint">Tối đa {space.capacity} người</small>
            </div>

            <div className="form-group">
              <label className="form-label">⏰ Giờ bắt đầu *</label>
              <input
                type="time"
                step="60"
                className="form-input internal-time-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">⌛ Giờ kết thúc *</label>
              <input
                type="time"
                step="60"
                className="form-input internal-time-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">
              🎯 Mục đích sử dụng không gian{' '}
              {requiresApproval ? (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>* (Bắt buộc)</span>
              ) : (
                <span style={{ color: '#64748B', fontWeight: 400 }}>(Không bắt buộc)</span>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={
                isPerSeat
                  ? "Tùy chọn: Tự học cá nhân, ôn thi... (Có thể để trống)"
                  : "VD: Học nhóm ôn thi, Thuyết trình đồ án, Thảo luận bài tập..."
              }
              required={requiresApproval}
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
