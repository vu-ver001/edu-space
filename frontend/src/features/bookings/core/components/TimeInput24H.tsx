import React, { useState, useRef, useEffect } from 'react';
import './TimeInput24H.css';

interface TimeInput24HProps {
  value: string; // HH:mm định dạng 24 giờ (00:00 - 23:59), ví dụ "08:00", "20:00"
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

export const TimeInput24H: React.FC<TimeInput24HProps> = ({
  value,
  onChange,
  min = '07:00',
  max = '22:00',
  className = '',
  required = false,
  disabled = false,
  placeholder = 'HH:mm (24h)',
  id,
  name,
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(value || '08:00');
  const containerRef = useRef<HTMLDivElement>(null);

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

  const currentHour = parseInt((inputValue || '08:00').split(':')[0] || '8', 10);
  const currentMinute = parseInt((inputValue || '08:00').split(':')[1] || '0', 10);

  const minMin = toMinutes(min);
  const maxMin = toMinutes(max);

  // Sinh danh sách giờ từ 07 đến 22 (hoặc theo min/max)
  const startH = Math.max(0, parseInt(min.split(':')[0] || '7', 10));
  const endH = Math.min(23, parseInt(max.split(':')[0] || '22', 10));
  const hoursList: number[] = [];
  for (let h = startH; h <= endH; h++) {
    hoursList.push(h);
  }

  // Danh sách phút chuẩn học tập: 00, 15, 30, 45
  const minutesList = [0, 15, 30, 45];

  const handleSelectHour = (h: number) => {
    const newTime = `${pad2(h)}:${pad2(currentMinute)}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleSelectMinute = (m: number) => {
    const newTime = `${pad2(currentHour)}:${pad2(m)}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    // Nếu gõ hợp lệ định dạng HH:mm 24h
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(raw.trim())) {
      const parts = raw.trim().split(':');
      const formatted = `${pad2(parts[0])}:${pad2(parts[1])}`;
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    // Tự động chuẩn hóa khi người dùng nhập xong và click ra ngoài
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
      <div className="time-input-24h-input-box" onClick={() => !disabled && setIsOpen(!isOpen)}>
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
        <button
          type="button"
          className="time-input-24h-clock-btn"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          title="Mở bảng chọn giờ 24h"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>

      {/* POPUP CHỌN GIỜ 24H THUẦN TÚY - KHÔNG CÓ AM / PM */}
      {isOpen && (
        <div className="time-picker-24h-popup">
          <div className="time-picker-24h-header">
            <span>Chọn giờ (01:00 – 24:00)</span>
            <button
              type="button"
              className="time-picker-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="time-picker-24h-columns">
            {/* Cột chọn Giờ (24 giờ) */}
            <div className="time-picker-col">
              <div className="time-picker-col-title">Giờ</div>
              <div className="time-picker-col-scroll">
                {hoursList.map((h) => {
                  const isSelected = h === currentHour;
                  const isOutOfRange = (h * 60 + 59 < minMin) || (h * 60 > maxMin);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isOutOfRange}
                      className={`time-picker-slot-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectHour(h)}
                    >
                      {pad2(h)}:00
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cột chọn Phút */}
            <div className="time-picker-col">
              <div className="time-picker-col-title">Phút</div>
              <div className="time-picker-col-scroll">
                {minutesList.map((m) => {
                  const isSelected = m === currentMinute;
                  const totalM = currentHour * 60 + m;
                  const isOutOfRange = totalM < minMin || totalM > maxMin;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isOutOfRange}
                      className={`time-picker-slot-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        handleSelectMinute(m);
                        setIsOpen(false);
                      }}
                    >
                      :{pad2(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hàng chọn nhanh các khung giờ phổ biến */}
          <div className="time-picker-quick-presets">
            <span className="preset-label">Mốc nhanh:</span>
            <div className="preset-chips">
              {['08:00', '10:00', '13:00', '15:00', '17:00', '19:00', '20:00', '22:00'].map((preset) => {
                const presetM = toMinutes(preset);
                const isOutOfRange = presetM < minMin || presetM > maxMin;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isOutOfRange}
                    className={`preset-chip-btn ${value === preset ? 'active' : ''}`}
                    onClick={() => {
                      setInputValue(preset);
                      onChange(preset);
                      setIsOpen(false);
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
