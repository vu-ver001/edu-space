// Ô nhập và chọn thời gian định dạng chuẩn 24H (HH:mm) cho hệ thống đặt phòng (Module M03 & M04 - Khánh Vân).
import React, { useState, useRef, useEffect } from 'react';
import './TimeInput24H.css';

// Định nghĩa thuộc tính Props đầu vào của bộ chọn thời gian 24H.
interface TimeInput24HProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

// Chuyển đổi chuỗi giờ định dạng HH:mm sang số phút trong ngày.
const toMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
};

// Chèn số 0 vào đầu chuỗi nếu số chỉ có một chữ số.
const pad2 = (n: number | string): string => String(n).padStart(2, '0');

// Mảng 24 giờ từ 00 đến 23.
const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
// Mảng 60 phút từ 00 đến 59.
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

// Component TimeInput24H cung cấp ô nhập liệu và dropdown chọn giờ/phút hai cột.
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
  // Quản lý trạng thái mở dropdown và giá trị hiển thị trên ô nhập.
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Đồng bộ giá trị nội bộ khi thuộc tính value từ component cha thay đổi.
  useEffect(() => {
    setInputValue(value ? value.substring(0, 5) : '');
  }, [value]);

  // Lắng nghe sự kiện click chuột bên ngoài để tự động đóng dropdown.
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

  // Tách giờ và phút hiện tại để làm nổi bật trong dropdown.
  const [currentHStr, currentMStr] = (inputValue || '08:00').split(':');
  const currentHour = pad2(currentHStr || '08');
  const currentMinute = pad2(currentMStr || '00');

  // Tính toán giới hạn số phút nhỏ nhất và lớn nhất được phép chọn.
  const minMin = toMinutes(min);
  const maxMin = toMinutes(max);

  // Tự động cuộn danh sách giờ và phút đến vị trí giá trị đang được chọn khi mở dropdown.
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

  // Xử lý khi người dùng chọn một giờ trong danh sách.
  const handleHourClick = (h: string) => {
    const newTime = `${h}:${currentMinute || '00'}`;
    setInputValue(newTime);
    onChange(newTime);
  };

  // Xử lý khi người dùng chọn một phút trong danh sách và đóng dropdown.
  const handleMinuteClick = (m: string) => {
    const newTime = `${currentHour || '08'}:${m}`;
    setInputValue(newTime);
    onChange(newTime);
    setIsOpen(false);
  };

  // Xử lý nhập trực tiếp từ bàn phím và tự động chuẩn hóa định dạng.
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(raw.trim())) {
      const parts = raw.trim().split(':');
      const formatted = `${pad2(parts[0])}:${pad2(parts[1])}`;
      onChange(formatted);
    }
  };

  // Tự động điền phút :00 hoặc chuẩn hóa chuỗi khi rời tiêu điểm ô nhập (blur).
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
      setInputValue('');
      onChange('');
    }
  };

  return (
    // Phần tử bao ngoài quản lý vị trí tương đối và sự kiện dropdown
    <div
      ref={containerRef}
      className={`time-input-24h-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Ô nhập thời gian và biểu tượng đồng hồ kích hoạt mở bảng chọn */}
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
        {/* Biểu tượng đồng hồ chỉ báo */}
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

      {/* Bảng chọn thời gian hai cột Giờ và Phút */}
      {isOpen && (
        <div className="time-picker-24h-dropdown">
          <div className="time-picker-24h-columns">
            {/* Cột chọn danh sách Giờ từ 00 đến 23 */}
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

            {/* Cột chọn danh sách Phút từ 00 đến 59 */}
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
