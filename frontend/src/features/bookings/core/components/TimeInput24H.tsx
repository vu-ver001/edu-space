import React, { useState, useRef, useEffect } from 'react';
import './TimeInput24H.css';

interface TimeInput24HProps {
  value: string; // HH:mm định dạng 24 giờ, ví dụ "08:00", "13:00"
  onChange: (val: string) => void;
  min?: string; // HH:mm
  max?: string; // HH:mm
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

const toMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
};

const pad2 = (n: number | string): string => String(n).padStart(2, '0');

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

export const TimeInput24H: React.FC<TimeInput24HProps> = ({
  value,
  onChange,
  min = '07:00',
  max = '22:00',
  className = '',
  required = false,
  disabled = false,
  placeholder = 'HH:mm',
  id,
  name,
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(value || '08:00');
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    if (value) {
      setInputValue(value.substring(0, 5));
    }
  }, [value]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const [currentHStr, currentMStr] = (inputValue || '08:00').split(':');
  const currentHour = pad2(currentHStr || '08');
  const currentMinute = pad2(currentMStr || '00');

  const minMin = toMinutes(min);
  const maxMin = toMinutes(max);

  // Tự động cuộn đến giờ và phút đang chọn khi mở dropdown (chuẩn theo trang Ngọc Anh)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (hourListRef.current) {
          const selectedHourEl = hourListRef.current.querySelector('.selected') as HTMLElement;
          if (selectedHourEl) {
            hourListRef.current.scrollTop = selectedHourEl.offsetTop - 50;
          }
        }
        if (minuteListRef.current) {
          const selectedMinuteEl = minuteListRef.current.querySelector('.selected') as HTMLElement;
          if (selectedMinuteEl) {
            minuteListRef.current.scrollTop = selectedMinuteEl.offsetTop - 50;
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleHourClick = (h: string) => {
    const newTime = `${h}:${currentMinute || '00'}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleMinuteClick = (m: string) => {
    const newTime = `${currentHour || '08'}:${m}`;
    setInputValue(newTime);
    onChange(newTime);
    setIsOpen(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(raw.trim())) {
      const parts = raw.trim().split(':');
      const formatted = `${pad2(parts[0])}:${pad2(parts[1])}`;
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    const val = inputValue.trim();
    if (/^\d{1,2}$/.test(val)) {
      const h = Math.min(23, Math.max(0, parseInt(val, 10)));
      const formatted = `${pad2(h)}:00`;
      setInputValue(formatted);
      onChange(formatted);
    } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
      const parts = val.split(':');
      const h = Math.min(23, Math.max(0, parseInt(parts[0], 10)));
      const m = Math.min(59, Math.max(0, parseInt(parts[1], 10)));
      const formatted = `${pad2(h)}:${pad2(m)}`;
      setInputValue(formatted);
      onChange(formatted);
    } else if (!val) {
      setInputValue(min || '08:00');
      onChange(min || '08:00');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`time-input-24h-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* KHUNG TRIGGER Ô NHẬP GIỜ THEO CHUẨN TRANG NGỌC ANH: CHỮ KHÔNG IN ĐẬM */}
      <div
        className={`time-input-24h-input-box ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <input
          type="text"
          id={id}
          name={name}
          className="time-input-24h-text-field"
          value={inputValue}
          onChange={handleManualInput}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          maxLength={5}
        />
        {/* ICON ĐỒNG HỒ CỐ ĐỊNH CHẶT CHẼ Ở GÓC PHẢI */}
        <span
          className="time-input-24h-clock-icon"
          title="Bấm để chọn giờ"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
      </div>

      {/* DROPDOWN CHỌN GIỜ ĐỒNG BỘ 100% GIAO DIỆN THEO TRANG NGỌC ANH */}
      {isOpen && (
        <div className="time-picker-24h-dropdown">
          <div className="time-picker-24h-columns">
            {/* CỘT GIỜ */}
            <div className="time-picker-24h-column">
              <div className="time-picker-24h-column-header">Giờ</div>
              <div className="time-picker-24h-column-list" ref={hourListRef}>
                {HOURS.map((h) => {
                  const isSelected = h === currentHour;
                  const totalMin = parseInt(h, 10) * 60 + 59;
                  const isOutOfRange = (totalMin < minMin) || (parseInt(h, 10) * 60 > maxMin);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isOutOfRange}
                      className={`time-picker-24h-item ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfRange) handleHourClick(h);
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CỘT PHÚT */}
            <div className="time-picker-24h-column">
              <div className="time-picker-24h-column-header">Phút</div>
              <div className="time-picker-24h-column-list" ref={minuteListRef}>
                {MINUTES.map((m) => {
                  const isSelected = m === currentMinute;
                  const totalMin = parseInt(currentHour, 10) * 60 + parseInt(m, 10);
                  const isOutOfRange = totalMin < minMin || totalMin > maxMin;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isOutOfRange}
                      className={`time-picker-24h-item ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfRange) handleMinuteClick(m);
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
