import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { TimeFilterPreset } from '../types/statistics';
import './CustomDateRangePicker.css';

interface CustomDateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  preset: TimeFilterPreset;
  onChange: (startDate: string, endDate: string) => void;
  onPresetChange: (preset: TimeFilterPreset) => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  startDate,
  endDate,
  preset,
  onChange,
  onPresetChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month currently viewed in the calendar
  const [viewDate, setViewDate] = useState(() => {
    return endDate ? new Date(endDate) : new Date();
  });

  // Local selection while picking
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setValidationError(null);
      if (endDate) {
        setViewDate(new Date(endDate));
      }
    }
  }, [isOpen, startDate, endDate]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper format YYYY-MM-DD to DD/MM/YYYY
  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return '--/--/----';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate days for calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const days = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const iso = prevDate.toISOString().split('T')[0];
      days.push({ dayNumber: d, iso, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const curDate = new Date(year, month, d);
      const iso = curDate.toISOString().split('T')[0];
      days.push({ dayNumber: d, iso, isCurrentMonth: true });
    }

    // Next month filler days (fill up to 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const iso = nextDate.toISOString().split('T')[0];
      days.push({ dayNumber: d, iso, isCurrentMonth: false });
    }

    return days;
  }, [viewDate]);

  const handleDayClick = (iso: string) => {
    setValidationError(null);
    if (!tempStart || (tempStart && tempEnd)) {
      // First click: pick start date
      setTempStart(iso);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      // Second click: pick end date, must be strictly after start date
      if (iso <= tempStart) {
        setValidationError(`Ngày đến (${formatDisplay(iso)}) phải lớn hơn từ ngày (${formatDisplay(tempStart)}).`);
      } else {
        setTempEnd(iso);
      }
    }
  };

  const handleApply = () => {
    if (!tempStart || !tempEnd) {
      setValidationError('Vui lòng chọn cả ngày bắt đầu và ngày đến.');
      return;
    }
    if (tempEnd <= tempStart) {
      setValidationError('Ngày đến phải lớn hơn từ ngày.');
      return;
    }
    setValidationError(null);
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const handleClear = () => {
    onPresetChange('all');
    setIsOpen(false);
  };

  const handlePresetSelect = (p: TimeFilterPreset) => {
    onPresetChange(p);
    setIsOpen(false);
  };

  // Check today
  const todayIso = new Date().toISOString().split('T')[0];

  // Selected range computation
  const activeEnd = tempEnd || (tempStart ? hoverDate || tempStart : '');

  // Days count between tempStart and tempEnd
  const selectedDaysCount = useMemo(() => {
    if (!tempStart || !tempEnd) return 0;
    if (tempEnd <= tempStart) return 0;
    const diff = new Date(tempEnd).getTime() - new Date(tempStart).getTime();
    return Math.round(diff / (1000 * 3600 * 24)) + 1;
  }, [tempStart, tempEnd]);

  return (
    <div className="custom-date-picker-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`date-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Bấm để chọn khoảng thời gian"
      >
        <span className="trigger-icon">
          <CalendarIcon size={16} />
        </span>
        <div className="trigger-dates">
          <span className="trigger-date-val">{formatDisplay(startDate)}</span>
          <span className="trigger-arrow">→</span>
          <span className="trigger-date-val">{formatDisplay(endDate)}</span>
        </div>
        <span className="trigger-chevron">
          <ChevronDown size={15} />
        </span>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="date-picker-popover">
          {/* Quick presets shortcut bar */}
          <div className="popover-presets-row">
            <button
              type="button"
              className={`popover-preset-btn ${preset === '7days' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('7days')}
            >
              7 ngày
            </button>
            <button
              type="button"
              className={`popover-preset-btn ${preset === '30days' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('30days')}
            >
              30 ngày
            </button>
            <button
              type="button"
              className={`popover-preset-btn ${preset === 'this_month' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('this_month')}
            >
              Tháng này
            </button>
            <button
              type="button"
              className={`popover-preset-btn ${preset === 'all' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('all')}
            >
              Tất cả
            </button>
          </div>

          {/* Calendar Panel */}
          <div className="calendar-panel">
            {/* Header: Month & Year Navigator */}
            <div className="calendar-nav-header">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handlePrevMonth}
                title="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="calendar-month-title">
                Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
              </div>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handleNextMonth}
                title="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="calendar-weekdays-grid">
              {WEEKDAYS.map((w, idx) => (
                <div key={w} className={`calendar-weekday-cell ${idx >= 5 ? 'weekend' : ''}`}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid">
              {calendarDays.map(({ dayNumber, iso, isCurrentMonth }) => {
                const isToday = iso === todayIso;
                const isStart = iso === tempStart;
                const isEnd = iso === tempEnd;
                const isSingle = isStart && (!tempEnd || tempStart === tempEnd);

                let inRange = false;
                if (tempStart && activeEnd && activeEnd > tempStart) {
                  inRange = iso > tempStart && iso < activeEnd;
                }

                return (
                  <button
                    key={iso}
                    type="button"
                    className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${
                      isStart ? 'selected-start' : ''
                    } ${isEnd ? 'selected-end' : ''} ${isSingle ? 'is-single' : ''} ${
                      inRange ? 'in-range' : ''
                    } ${isToday ? 'is-today' : ''}`}
                    onClick={() => handleDayClick(iso)}
                    onMouseEnter={() => {
                      if (tempStart && !tempEnd) setHoverDate(iso);
                    }}
                  >
                    <span className="day-circle">{dayNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Warning Alert */}
          {validationError && (
            <div style={{
              margin: '0 16px 8px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              lineHeight: 1.35,
            }}>
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Footer with Selected Summary & Actions */}
          <div className="popover-footer">
            <div className="popover-summary-text">
              <span>Đã chọn:</span>
              <strong>
                {tempStart && tempEnd ? `${formatDisplay(tempStart)} - ${formatDisplay(tempEnd)}` : tempStart ? `${formatDisplay(tempStart)} - (Chọn ngày đến)` : 'Chưa chọn'}
                {selectedDaysCount > 0 && ` (${selectedDaysCount} ngày)`}
              </strong>
            </div>

            <div className="popover-footer-actions">
              <button type="button" className="popover-btn-clear" onClick={handleClear}>
                Đặt lại
              </button>
              <button
                type="button"
                className="popover-btn-apply"
                onClick={handleApply}
                disabled={!tempStart || !tempEnd || tempEnd <= tempStart}
                style={{
                  opacity: (!tempStart || !tempEnd || tempEnd <= tempStart) ? 0.45 : 1,
                  cursor: (!tempStart || !tempEnd || tempEnd <= tempStart) ? 'not-allowed' : 'pointer',
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
