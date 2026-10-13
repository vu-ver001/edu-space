// Tiện ích định dạng ngày giờ chuẩn Việt Nam và ô nhập ngày tương tác (Module M03 & M04 - Khánh Vân).
import React, { useRef } from 'react';

// Chuyển đổi chuỗi ngày bất kỳ (YYYY-MM-DD hoặc ISO) thành định dạng dd/MM/yyyy.
export const formatDateVI = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, d] = dateInput.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
};

// Chuyển đổi chuỗi ngày giờ thành định dạng HH:mm dd/MM/yyyy.
export const formatDateTimeVI = (dateTimeInput?: string | Date | null): string => {
  if (!dateTimeInput) return '';
  try {
    const d = new Date(dateTimeInput);
    if (isNaN(d.getTime())) return String(dateTimeInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return String(dateTimeInput);
  }
};

// Chuẩn hóa các chuỗi ngày tháng nằm bên trong nội dung thông báo lỗi từ backend.
export const formatMessageDatesVI = (message?: unknown): string => {
  if (message === null || message === undefined) return '';

  return String(message)
    .replace(
      /\b(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?/g,
      '$4:$5 $3-$2-$1'
    )
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3-$2-$1');
};

// Ánh xạ các mã trạng thái hủy hoặc lý do hệ thống thành câu tiếng Việt thân thiện lấy động từ CSDL.
export const formatBookingReasonVI = (
  reason?: unknown,
  fallback: string = '',
  graceMinutes?: number
): string => {
  if (reason === null || reason === undefined || reason === '') return fallback;
  const raw = String(reason).trim();
  const upper = raw.toUpperCase();

  // Đơn đặt bị hủy tự động do hết hạn chờ quản trị viên duyệt trước giờ bắt đầu.
  if (upper === 'PENDING_APPROVAL_TIMEOUT') {
    return 'Đã quá thời gian bắt đầu sử dụng nhưng chưa được xét duyệt.';
  }
  // Đơn đặt bị hủy do sinh viên không đến điểm danh check-in theo số phút quy định trong CSDL.
  if (upper === 'CHECKIN_WINDOW_EXPIRED' || upper === 'CHECKIN_DEADLINE_EXCEEDED') {
    if (graceMinutes && graceMinutes > 0) {
      return `Quá ${graceMinutes} phút sau giờ bắt đầu mà không thực hiện check-in.`;
    }
    return fallback || 'Quá thời hạn cho phép sau giờ bắt đầu mà không thực hiện check-in.';
  }
  // Ca đặt phòng đã kết thúc thời gian sử dụng.
  if (upper === 'SESSION_ENDED') {
    return 'Đã hết thời gian sử dụng phòng.';
  }

  return formatMessageDatesVI(raw) || fallback;
};

// Định nghĩa thuộc tính Props đầu vào của ô nhập ngày DateInputVI.
interface DateInputVIProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

// Component DateInputVI hiển thị ngày dạng dd/mm/yyyy và tích hợp bộ chọn lịch của trình duyệt.
export const DateInputVI: React.FC<DateInputVIProps> = ({
  value,
  onChange,
  min,
  max,
  className = '',
  required = false,
  id,
  name,
  style = {},
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  // Định dạng ngày hiển thị theo kiểu Việt Nam dd/MM/yyyy.
  const displayValue = formatDateVI(value);

  // Mở trực tiếp hộp thoại chọn ngày native của trình duyệt khi click vào ô nhập.
  const handleContainerClick = () => {
    if (hiddenInputRef.current) {
      if (typeof hiddenInputRef.current.showPicker === 'function') {
        try {
          hiddenInputRef.current.showPicker();
          return;
        } catch {
          // Bỏ qua nếu trình duyệt chặn phương thức showPicker
        }
      }
      hiddenInputRef.current.focus();
    }
  };

  return (
    // Phần tử bao ngoài cho phép click để mở lịch chọn ngày
    <div
      className={`date-input-vi-wrapper ${className}`}
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* Ô nhập chỉ đọc hiển thị văn bản ngày theo chuẩn dd/mm/yyyy */}
      <input
        type="text"
        readOnly
        id={id}
        name={name}
        value={displayValue}
        placeholder="dd/mm/yyyy"
        required={required}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          paddingRight: '36px',
          background: 'inherit',
          color: 'inherit',
          font: 'inherit',
          border: 'inherit',
          borderRadius: 'inherit',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      {/* Biểu tượng quyển lịch chỉ báo trực quan */}
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>

      {/* Thẻ input date ẩn trong suốt tiếp nhận sự kiện chọn ngày gốc của hệ điều hành */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          zIndex: 1,
        }}
      />
    </div>
  );
};
