import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarCheck,
  Clock,
  Calendar,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Save,
  Info,
  History,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { policyService } from '../services/policyService';
import type { PolicyResponse } from '../types/policy';
import '../policy.css';

interface TimePickerInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function TimePickerInput({ value, onChange, disabled }: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const [currentHour, currentMinute] = (value || '07:30').split(':');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động cuộn đến giờ và phút đang chọn khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourListRef.current) {
          const selectedHourEl = hourListRef.current.querySelector('.selected') as HTMLElement;
          if (selectedHourEl) {
            hourListRef.current.scrollTop = selectedHourEl.offsetTop - 40;
          }
        }
        if (minuteListRef.current) {
          const selectedMinuteEl = minuteListRef.current.querySelector('.selected') as HTMLElement;
          if (selectedMinuteEl) {
            minuteListRef.current.scrollTop = selectedMinuteEl.offsetTop - 40;
          }
        }
      }, 50);
    }
  }, [isOpen]);

  const handleHourClick = (h: string) => {
    onChange(`${h}:${currentMinute || '00'}`);
  };

  const handleMinuteClick = (m: string) => {
    onChange(`${currentHour || '07'}:${m}`);
    setIsOpen(false);
  };

  return (
    <div className="custom-time-picker-container" ref={containerRef}>
      <button
        type="button"
        className={`time-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="select-trigger-left">
          <Clock size={16} color="#557297" />
          <span className="time-display-val">{value}</span>
        </span>
        <ChevronDown size={15} color="#557297" className={`time-trigger-arrow ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="time-picker-dropdown">
          <div className="time-picker-columns">
            <div className="time-picker-column">
              <div className="time-picker-column-header">Giờ</div>
              <div className="time-picker-column-list" ref={hourListRef}>
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`time-picker-item ${h === currentHour ? 'selected' : ''}`}
                    onClick={() => handleHourClick(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-picker-column">
              <div className="time-picker-column-header">Phút</div>
              <div className="time-picker-column-list" ref={minuteListRef}>
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`time-picker-item ${m === currentMinute ? 'selected' : ''}`}
                    onClick={() => handleMinuteClick(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  icon: React.ReactNode;
  min?: number;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
}

function NumberInput({ value, onChange, icon, min = 0, max = 999, disabled, placeholder }: NumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(value ?? ''));

  // Đảm bảo min luôn không âm
  const safeMin = Math.max(0, min);

  useEffect(() => {
    setLocalValue(String(value ?? ''));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Chặn hoàn toàn phím dấu trừ '-', '+', 'e', 'E'
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    // Nếu dữ liệu dán vào có dấu trừ hoặc ký tự lạ, lọc sạch chỉ giữ lại số dương
    if (/[^0-9]/.test(pasteData)) {
      e.preventDefault();
      const clean = pasteData.replace(/[^0-9]/g, '');
      if (clean) {
        let parsed = parseInt(clean, 10);
        if (parsed < safeMin) parsed = safeMin;
        if (max !== undefined && parsed > max) parsed = max;
        setLocalValue(String(parsed));
        onChange(parsed);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lọc bỏ mọi ký tự không phải số nguyên dương
    let raw = e.target.value.replace(/[^0-9]/g, '');
    setLocalValue(raw);

    if (raw !== '') {
      let parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed < safeMin) {
        parsed = safeMin;
      } else if (max !== undefined && parsed > max) {
        parsed = max;
      }
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < safeMin) {
      parsed = safeMin;
    } else if (max !== undefined && parsed > max) {
      parsed = max;
    }
    setLocalValue(String(parsed));
    onChange(parsed);
  };

  return (
    <div className={`custom-number-input-container ${isFocused ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <span className="number-input-icon">{icon}</span>
      <input
        type="number"
        min={safeMin}
        max={max}
        value={localValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="number-input-field"
      />
    </div>
  );
}

export default function PolicyManagementPage() {
  const navigate = useNavigate();

  // Policy State
  const [openingHour, setOpeningHour] = useState<string>('07:30');
  const [closingHour, setClosingHour] = useState<string>('17:30');
  const [maxDurationHours, setMaxDurationHours] = useState<number>(4);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState<number>(2);
  const [checkInEarlyOpenMinutes, setCheckInEarlyOpenMinutes] = useState<number>(15);
  const [checkInGraceMinutes, setCheckInGraceMinutes] = useState<number>(15);

  // Original state for Reset action
  const [initialPolicy, setInitialPolicy] = useState<{
    hours: number;
    bookings: number;
    early: number;
    grace: number;
    opening: string;
    closing: string;
  } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Tải chính sách trực tiếp từ bảng booking_policies trong CSDL Backend
  const loadPolicy = async () => {
    setIsLoading(true);
    try {
      if (!localStorage.getItem('eduspace_token')) {
        await policyService.quickAdminLogin();
      }

      const policy: PolicyResponse = await policyService.getPolicy();
      const hours = Math.round((policy.maxDurationMinutes || 240) / 60) || 4;
      const bookings = policy.maxBookingsPerDay || 2;
      const early = policy.checkInEarlyOpenMinutes || 15;
      const grace = policy.checkInGraceMinutes || 15;
      const open = policy.openingHour || '07:30';
      const close = policy.closingHour || '17:30';

      setOpeningHour(open);
      setClosingHour(close);
      setMaxDurationHours(hours);
      setMaxBookingsPerDay(bookings);
      setCheckInEarlyOpenMinutes(early);
      setCheckInGraceMinutes(grace);

      setInitialPolicy({ hours, bookings, early, grace, opening: open, closing: close });
    } catch (err: unknown) {
      console.warn('Không tải được policy từ backend, sử dụng cấu hình mặc định:', err);
      setInitialPolicy({
        hours: maxDurationHours,
        bookings: maxBookingsPerDay,
        early: checkInEarlyOpenMinutes,
        grace: checkInGraceMinutes,
        opening: openingHour,
        closing: closingHour,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  // 2. Đặt lại giá trị ban đầu
  const handleReset = () => {
    if (initialPolicy) {
      setOpeningHour(initialPolicy.opening);
      setClosingHour(initialPolicy.closing);
      setMaxDurationHours(initialPolicy.hours);
      setMaxBookingsPerDay(initialPolicy.bookings);
      setCheckInEarlyOpenMinutes(initialPolicy.early);
      setCheckInGraceMinutes(initialPolicy.grace);
      showToast('Đã khôi phục các giá trị thiết lập ban đầu.', 'info');
    }
  };

  // 3. Lưu thay đổi chính sách vào bảng booking_policies trong CSDL
  const handleSave = async () => {
    if (!openingHour || !closingHour) {
      showToast('Khung giờ mở cửa và đóng cửa không được để trống.', 'error');
      return;
    }
    if (openingHour >= closingHour) {
      showToast('Giờ mở cửa phải trước giờ đóng cửa.', 'error');
      return;
    }
    if (maxDurationHours <= 0) {
      showToast('Thời lượng tối đa phải lớn hơn 0 giờ.', 'error');
      return;
    }
    if (maxBookingsPerDay <= 0) {
      showToast('Số booking tối đa phải lớn hơn 0.', 'error');
      return;
    }
    if (checkInEarlyOpenMinutes < 0 || checkInGraceMinutes < 0) {
      showToast('Thời gian check-in không được âm.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await policyService.updatePolicy({
        maxBookingsPerDay,
        maxDurationMinutes: maxDurationHours * 60,
        maxRequestRatePerHour: 10,
        checkInEarlyOpenMinutes,
        checkInGraceMinutes,
        checkInCloseOffsetMinutes: 15,
        openingHour,
        closingHour,
      });

      setInitialPolicy({
        hours: maxDurationHours,
        bookings: maxBookingsPerDay,
        early: checkInEarlyOpenMinutes,
        grace: checkInGraceMinutes,
        opening: openingHour,
        closing: closingHour,
      });

      showToast('Cập nhật thành công', 'success');
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(errorMsg || 'Lưu cấu hình thất bại, vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="policy-page-container">
      {/* Toast thông báo */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'success' && <Check size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="policy-content-wrapper">
        {/* Header Card */}
        <header className="policy-header">
          {/* Decorative wavy background & sparkles */}
          <div className="policy-header-bg-decor" aria-hidden="true">
            <svg viewBox="0 0 960 110" preserveAspectRatio="none" className="policy-header-svg">
              <defs>
                <linearGradient id="headerGradBase" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e3f0fe" />
                  <stop offset="45%" stopColor="#edf5fe" />
                  <stop offset="100%" stopColor="#e5f1fe" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#headerGradBase)" />

              {/* Left organic decorative waves */}
              <path
                d="M-20 -20 Q 30 70, 70 50 T 170 30 Q 220 15, 250 -30 Z"
                fill="#bddbfd"
                opacity="0.5"
              />
              <path
                d="M-30 -20 Q 20 110, 80 85 T 160 -20 Z"
                fill="#c6e1fd"
                opacity="0.65"
              />
              <path
                d="M-30 -20 Q -5 95, 35 75 Q 75 55, 60 -20 Z"
                fill="#b2d6fc"
                opacity="0.8"
              />

              {/* Right organic decorative waves */}
              <path
                d="M800 -30 Q 840 85, 900 65 T 990 20 L 990 -30 Z"
                fill="#bddbfd"
                opacity="0.5"
              />
              <path
                d="M860 -20 Q 890 90, 940 70 Q 980 50, 990 -20 Z"
                fill="#c6e1fd"
                opacity="0.7"
              />
              <path
                d="M910 -20 Q 930 80, 970 65 L 990 -20 Z"
                fill="#b2d6fc"
                opacity="0.8"
              />

              {/* Subtle sparkle stars in bottom-right */}
              <g fill="#ffffff" opacity="0.9">
                <path d="M 860 85 Q 860 90, 865 90 Q 860 90, 860 95 Q 860 90, 855 90 Q 860 90, 860 85 Z" />
                <path d="M 915 75 Q 915 82, 922 82 Q 915 82, 915 89 Q 915 82, 908 82 Q 915 82, 915 75 Z" />
                <path d="M 945 92 Q 945 95, 948 95 Q 945 95, 945 98 Q 945 95, 942 95 Q 945 95, 945 92 Z" />
                <circle cx="830" cy="80" r="1.5" opacity="0.7" />
                <circle cx="880" cy="98" r="1.2" opacity="0.8" />
                <circle cx="935" cy="80" r="1.5" opacity="0.7" />
                <circle cx="955" cy="86" r="1" opacity="0.9" />
              </g>
            </svg>
          </div>

          <div className="policy-title-group">
            <div className="policy-main-icon-box">
              <CalendarClock size={28} color="#2563eb" strokeWidth={2.2} />
            </div>
            <div className="policy-title-text">
              <h1>Quy định đặt chỗ</h1>
              <p>Cấu hình các giới hạn và quy tắc đặt chỗ toàn hệ thống</p>
            </div>
          </div>

          <div className="policy-header-actions">
            <button
              type="button"
              className="btn-audit-history"
              onClick={() => navigate('/admin/policy/history')}
              title="Xem trang lịch sử các lần chỉnh sửa chính sách"
            >
              <History size={15} color="#334155" />
              <span>Lịch sử thay đổi</span>
            </button>
          </div>
        </header>

        {/* Card 1: Khung giờ hoạt động hệ thống */}
        <section className="policy-card">
          <div className="policy-card-header">
            <div className="policy-icon-box">
              <Clock size={22} color="#0284c7" strokeWidth={2.2} />
            </div>
            <div className="policy-card-info">
              <h2>Khung giờ hoạt động hệ thống</h2>
              <p>Khoảng thời gian tất cả các không gian/phòng mở cửa đón người dùng trong ngày.</p>
            </div>
          </div>

          <div className="policy-subcards-grid">
            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Sun size={17} color="#0284c7" strokeWidth={2.2} />
                </span>
                <span>Giờ mở cửa hệ thống</span>
              </div>
              <TimePickerInput
                value={openingHour}
                onChange={setOpeningHour}
                disabled={isLoading}
              />
              <span className="subcard-hint">Bắt đầu đón sinh viên từ {openingHour}</span>
            </div>

            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Moon size={17} fill="#0284c7" color="#0284c7" />
                </span>
                <span>Giờ đóng cửa hệ thống</span>
              </div>
              <TimePickerInput
                value={closingHour}
                onChange={setClosingHour}
                disabled={isLoading}
              />
              <span className="subcard-hint">Kết thúc muộn nhất lúc {closingHour}</span>
            </div>
          </div>

          <div className="policy-info-banner">
            <Info size={18} fill="#2563eb" color="#ffffff" className="policy-info-banner-icon" />
            <span>
              Mọi lượt đặt phòng của sinh viên phải bắt đầu từ {openingHour} và kết thúc muộn nhất lúc {closingHour}.
            </span>
          </div>
        </section>

        {/* Card 2: Giới hạn thời gian */}
        <section className="policy-card">
          <div className="policy-card-header">
            <div className="policy-icon-box">
              <CalendarClock size={22} color="#0284c7" strokeWidth={2.2} />
            </div>
            <div className="policy-card-info">
              <h2>Giới hạn thời gian</h2>
              <p>Thiết lập thời gian đặt chỗ và số lượng booking cho mỗi người dùng.</p>
            </div>
          </div>

          <div className="policy-subcards-grid">
            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Clock size={17} color="#0284c7" strokeWidth={2.2} />
                </span>
                <span>Thời lượng tối đa (giờ)</span>
              </div>
              <NumberInput
                value={maxDurationHours}
                onChange={setMaxDurationHours}
                min={1}
                max={24}
                icon={<Clock size={16} color="#557297" />}
                disabled={isLoading}
                placeholder="Số giờ..."
              />
              <span className="subcard-hint">Mỗi booking không quá {maxDurationHours} giờ</span>
            </div>

            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Calendar size={17} color="#0284c7" strokeWidth={2.2} />
                </span>
                <span>Số booking tối đa mỗi ngày</span>
              </div>
              <NumberInput
                value={maxBookingsPerDay}
                onChange={setMaxBookingsPerDay}
                min={1}
                max={50}
                icon={<Calendar size={16} color="#557297" />}
                disabled={isLoading}
                placeholder="Số booking..."
              />
              <span className="subcard-hint">Mỗi sinh viên tối đa {maxBookingsPerDay} booking/ngày</span>
            </div>
          </div>
        </section>

        {/* Card 3: Cửa sổ check-in */}
        <section className="policy-card">
          <div className="policy-card-header">
            <div className="policy-icon-box">
              <CalendarCheck size={22} color="#0284c7" strokeWidth={2.2} />
            </div>
            <div className="policy-card-info">
              <h2>Cửa sổ check-in</h2>
              <p>Khoảng thời gian cho phép sinh viên check-in trước và sau giờ bắt đầu.</p>
            </div>
          </div>

          <div className="policy-subcards-grid">
            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Clock size={17} color="#0284c7" strokeWidth={2.2} />
                </span>
                <span>Trước giờ bắt đầu (phút)</span>
              </div>
              <NumberInput
                value={checkInEarlyOpenMinutes}
                onChange={setCheckInEarlyOpenMinutes}
                min={0}
                max={180}
                icon={<Clock size={16} color="#557297" />}
                disabled={isLoading}
                placeholder="Số phút..."
              />
            </div>

            <div className="policy-subcard">
              <div className="subcard-label-row">
                <span className="subcard-label-icon">
                  <Clock size={17} color="#0284c7" strokeWidth={2.2} />
                </span>
                <span>Sau giờ bắt đầu (phút)</span>
              </div>
              <NumberInput
                value={checkInGraceMinutes}
                onChange={setCheckInGraceMinutes}
                min={0}
                max={180}
                icon={<Clock size={16} color="#557297" />}
                disabled={isLoading}
                placeholder="Số phút..."
              />
            </div>
          </div>

          <div className="policy-info-banner">
            <Info size={18} fill="#2563eb" color="#ffffff" className="policy-info-banner-icon" />
            <span>
              Sinh viên có thể check-in trong khoảng {checkInEarlyOpenMinutes} phút trước đến{' '}
              {checkInGraceMinutes} phút sau giờ bắt đầu.
            </span>
          </div>
        </section>

        {/* Action Bar */}
        <div className="policy-action-bar">
          <button type="button" className="btn-reset" onClick={handleReset} disabled={isSaving || isLoading}>
            <RotateCcw size={15} /> Đặt lại
          </button>
          <button type="button" className="btn-save" onClick={handleSave} disabled={isSaving || isLoading}>
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
