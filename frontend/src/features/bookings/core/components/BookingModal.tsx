// Modal tạo đơn đặt không gian học tập (Module M03 - Khánh Vân).
import React, { useState } from 'react';
import type { Space } from '../services/spaceService';
import { bookingService } from '../services/bookingService';
import { DateInputVI, formatMessageDatesVI } from './DateInputVI';
import { TimeInput24H } from './TimeInput24H';

// Định nghĩa thuộc tính Props đầu vào của modal đặt không gian.
interface Props {
  space: Space;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultCount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Chuyển đổi đối tượng Date thành chuỗi định dạng YYYY-MM-DD theo giờ địa phương.
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Component Modal xử lý gửi biểu mẫu đặt phòng học và kiểm tra khả dụng.
export const BookingModal: React.FC<Props> = ({
  space,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  defaultCount,
  onClose,
  onSuccess
}) => {
  // Khởi tạo ngày hiện tại và kiểm tra loại không gian Study Booth.
  const today = toLocalDateString(new Date());
  const isStudyBooth = `${space.spaceTypeName || ''} ${space.spaceType?.name || ''}`
    .toLowerCase()
    .includes('booth');

  // Quản lý trạng thái form đặt chỗ: ngày, giờ bắt đầu, kết thúc, số lượng người, mục đích.
  const [date, setDate] = useState<string>(defaultDate || today);
  const [startTime, setStartTime] = useState<string>(
    defaultStartTime ? defaultStartTime.substring(0, 5) : '09:00'
  );
  const [endTime, setEndTime] = useState<string>(
    defaultEndTime ? defaultEndTime.substring(0, 5) : '11:00'
  );
  const [participantCount, setParticipantCount] = useState<number | string>(
    defaultCount || (isStudyBooth ? 1 : 2)
  );
  const [purpose, setPurpose] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string; details?: any[] } | null>(null);

  // Xác định chế độ đặt chỗ: theo ghế (PER_SEAT), theo bàn (PER_TABLE) hoặc trọn phòng (WHOLE_SPACE).
  const bookingMode = space.bookingMode || space.spaceType?.bookingMode || (
    space.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space.spaceTypeName?.toLowerCase().includes('ghế') || space.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );
  const isPerSeat = bookingMode === 'PER_SEAT';
  const isPerTable = bookingMode === 'PER_TABLE';
  const isWholeSpace = !isPerSeat && !isPerTable;
  // Quy định xét duyệt: Chỗ ngồi cá nhân duyệt tức thì, trọn phòng/theo bàn cần duyệt.
  const requiresApproval = space.requiresApproval !== undefined ? space.requiresApproval : !isPerSeat;

  // Xử lý kiểm tra dữ liệu và gửi yêu cầu đặt chỗ lên máy chủ backend.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);

    // Bắt buộc nhập lý do sử dụng đối với phòng trọn gói và đặt theo bàn.
    if (requiresApproval && (!purpose || !purpose.trim())) {
      setErrorInfo({
        code: 'PURPOSE_REQUIRED',
        message: 'Vui lòng nhập mục đích sử dụng (bắt buộc đối với phòng trọn gói và đặt theo bàn).'
      });
      return;
    }

    // Kiểm tra tính hợp lệ của khoảng thời gian bắt đầu và kết thúc.
    if (startTime >= endTime) {
      setErrorInfo({
        code: 'INVALID_TIME_RANGE',
        message: 'Thời gian bắt đầu phải trước thời gian kết thúc.'
      });
      return;
    }

    setSubmitting(true);

    // Định dạng chuỗi ngày giờ thành chuẩn ISO 8601 trước khi gửi request.
    const toIsoDateTime = (dateStr: string, timeStr: string) => {
      const parts = (timeStr || '').trim().split(':');
      const h = (parts[0] || '08').padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const s = (parts[2] || '00').padStart(2, '0');
      return `${dateStr}T${h}:${m}:${s}`;
    };

    const startDateTime = toIsoDateTime(date, startTime);
    const endDateTime = toIsoDateTime(date, endTime);

    // Gửi payload đặt phòng tới API backend và xử lý kết quả trả về.
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
      // Phân tích mã lỗi từ phản hồi backend để hiển thị thông báo chi tiết.
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
    // Lớp phủ nền modal đóng khi nhấn ra ngoài
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Phần tiêu đề hiển thị tên và thông tin tổng quan của không gian */}
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

        {/* Khối thông báo chính sách: Phê duyệt bởi Staff hoặc Duyệt tự động tức thì */}
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

        {/* Khung hiển thị lỗi xung đột lịch hoặc lỗi nghiệp vụ từ backend */}
        {errorInfo && (
          <div className="error-banner">
            <div className="error-header">
              <span className="error-icon">🚫</span>
              <strong>{errorInfo.code}</strong>
            </div>
            <p className="error-msg">{formatMessageDatesVI(errorInfo.message)}</p>
            {errorInfo.details && errorInfo.details.length > 0 && (
              <div className="error-details-box">
                {errorInfo.details.map((d: any, idx: number) => (
                  <div key={idx} className="error-detail-item">
                    • <strong>{d.type || 'XUNG ĐỘT'}:</strong>{' '}
                    {formatMessageDatesVI(d.description || `Từ ${d.startTime} đến ${d.endTime}`)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form nhập liệu thông tin đặt phòng */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-grid">
            {/* Trường chọn ngày đặt phòng định dạng Việt Nam */}
            <div className="form-group">
              <label className="form-label">📅 Ngày sử dụng *</label>
              <DateInputVI
                className="form-input internal-date-input"
                value={date}
                onChange={(val) => setDate(val)}
                min={today}
                required
              />
            </div>

            {/* Trường nhập số lượng người tham gia */}
            <div className="form-group">
              <label className="form-label">👥 Số người tham gia *</label>
              <input
                type="number"
                className="form-input"
                value={participantCount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setParticipantCount('');
                    return;
                  }

                  const parsedCount = Number.parseInt(val, 10);
                  if (!Number.isFinite(parsedCount)) return;

                  setParticipantCount(Math.min(Math.max(parsedCount, 1), space.capacity));
                  setErrorInfo(null);
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
              <small className="form-hint">
                {isStudyBooth
                  ? `Study Booth được đặt trọn cho từ 1 đến ${space.capacity} người`
                  : isWholeSpace
                  ? `Đặt trọn không gian cho từ 1 đến ${space.capacity} người`
                  : isPerTable
                  ? `Chọn bàn phù hợp cho từ 1 đến ${space.capacity} người`
                  : `Tối đa ${space.capacity} người`}
              </small>
            </div>

            {/* Trường nhập giờ bắt đầu định dạng 24H */}
            <div className="form-group">
              <label className="form-label">⏰ Giờ bắt đầu *</label>
              <TimeInput24H
                value={startTime}
                onChange={(val) => setStartTime(val)}
                required
              />
            </div>

            {/* Trường nhập giờ kết thúc định dạng 24H */}
            <div className="form-group">
              <label className="form-label">⌛ Giờ kết thúc *</label>
              <TimeInput24H
                value={endTime}
                onChange={(val) => setEndTime(val)}
                required
              />
            </div>
          </div>

          {/* Trường nhập mục đích sử dụng không gian */}
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

          {/* Các nút hành động: Hủy hoặc Xác nhận đặt */}
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
