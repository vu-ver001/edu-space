import React, { useRef } from 'react';

/**
 * Chuyển đổi chuỗi ngày bất kỳ (YYYY-MM-DD hoặc ISO) thành định dạng dd/MM/yyyy
 */
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

/**
 * Chuyển đổi ngày giờ thành HH:mm dd/MM/yyyy
 */
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

interface DateInputVIProps {
  value: string; // Định dạng YYYY-MM-DD
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  className?: string;
  required?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

/**
 * Component ô nhập ngày luôn hiển thị định dạng dd/mm/yyyy
 * Đồng thời hỗ trợ click mở hộp thoại chọn ngày native của trình duyệt
 */
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

  const displayValue = formatDateVI(value);

  const handleContainerClick = () => {
    if (hiddenInputRef.current) {
      if (typeof hiddenInputRef.current.showPicker === 'function') {
        try {
          hiddenInputRef.current.showPicker();
          return;
        } catch {
          // Fallback if showPicker is blocked
        }
      }
      hiddenInputRef.current.focus();
    }
  };

  return (
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
      {/* Ô hiển thị dạng dd/mm/yyyy ra ngoài */}
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

      {/* Icon lịch bên phải */}
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

      {/* Input type="date" ẩn để nhận sự kiện native date picker */}
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
