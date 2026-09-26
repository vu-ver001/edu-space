import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarClock,
  Clock3,
  Save,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import type { Space } from '../../space/types/space';
import type {
  MaintenanceBlock,
  MaintenanceCreateRequest,
  StaffBooking,
} from '../types/staff';
import './MaintenanceFormModalKT.css';

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  spaces: Space[];
  maintenance?: MaintenanceBlock | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (spaceId: number, data: MaintenanceCreateRequest) => Promise<void>;
}

type FieldErrors = Partial<Record<'spaceId' | 'startTime' | 'endTime' | 'reason', string>>;

const toInputDateTime = (value?: string) => value ? value.slice(0, 16) : '';

const formatConflictTime = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

export const MaintenanceFormModalKT = ({
  isOpen,
  mode,
  spaces,
  maintenance,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) => {
  const [spaceId, setSpaceId] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictingBookings, setConflictingBookings] = useState<StaffBooking[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSpaceId(mode === 'edit' && maintenance ? maintenance.spaceId : 0);
    setStartTime(mode === 'edit' ? toInputDateTime(maintenance?.startTime) : '');
    setEndTime(mode === 'edit' ? toInputDateTime(maintenance?.endTime) : '');
    setReason(mode === 'edit' ? maintenance?.reason ?? '' : '');
    setFieldErrors({});
    setFormError(null);
    setConflictingBookings([]);
  }, [isOpen, mode, maintenance]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const firstError = formRef.current?.querySelector<HTMLElement>('.maintenance-input-error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError?.focus({ preventScroll: true });
  }, [fieldErrors]);

  if (!isOpen) return null;

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
    setConflictingBookings([]);
  };

  const validate = () => {
    const errors: FieldErrors = {};
    if (!spaceId) errors.spaceId = 'Vui lòng chọn không gian cần bảo trì.';
    if (!startTime) errors.startTime = 'Vui lòng chọn thời gian bắt đầu.';
    if (!endTime) errors.endTime = 'Vui lòng chọn thời gian kết thúc.';
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    }
    if (!reason.trim()) errors.reason = 'Lý do bảo trì không được để trống.';
    if (reason.trim().length > 255) errors.reason = 'Lý do bảo trì không được vượt quá 255 ký tự.';
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setConflictingBookings([]);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await onSubmit(spaceId, {
        startTime,
        endTime,
        reason: reason.trim(),
      });
    } catch (error: any) {
      const body = error?.response?.data;
      const details = Array.isArray(body?.details) ? body.details : [];
      const nextErrors: FieldErrors = {};

      details.forEach((detail: unknown) => {
        if (typeof detail !== 'string' || !detail.includes(': ')) return;
        const [field, ...messageParts] = detail.split(': ');
        if (field === 'startTime' || field === 'endTime' || field === 'reason') {
          nextErrors[field] = messageParts.join(': ');
        }
      });

      if (body?.code === 'SPACE_HAS_OCCUPYING_BOOKING') {
        setConflictingBookings(details as StaffBooking[]);
      }

      setFieldErrors(nextErrors);
      setFormError(body?.message || error?.message || 'Không thể lưu lịch bảo trì.');
    }
  };

  return (
    <div className="maintenance-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section className="maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-form-title">
        <header className="maintenance-modal-header">
          <div className="maintenance-modal-heading">
            <span className="maintenance-modal-icon"><Wrench size={22} /></span>
            <div>
              <h2 id="maintenance-form-title">{mode === 'create' ? 'Tạo lịch bảo trì' : 'Chỉnh sửa lịch bảo trì'}</h2>
              <p>{mode === 'create' ? 'Khóa không gian trong một khoảng thời gian cụ thể' : 'Cập nhật thời gian và lý do bảo trì'}</p>
            </div>
          </div>
          <button type="button" className="maintenance-modal-close" onClick={onClose} disabled={isSubmitting} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <form ref={formRef} className="maintenance-form" onSubmit={handleSubmit} noValidate>
          <div className="maintenance-form-body">
            {formError && (
              <div className="maintenance-form-alert" role="alert">
                <AlertCircle size={19} />
                <span>{formError}</span>
              </div>
            )}

            <label className="maintenance-form-field maintenance-form-full">
              <span><Building2 size={16} /> Không gian <b>*</b></span>
              <select
                value={spaceId}
                disabled={mode === 'edit' || isSubmitting}
                className={fieldErrors.spaceId ? 'maintenance-input-error' : ''}
                onChange={(event) => { setSpaceId(Number(event.target.value)); clearFieldError('spaceId'); }}
              >
                <option value={0}>Chọn không gian cần bảo trì</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.spaceCode} — {space.name} ({space.building}, tầng {space.floor})
                  </option>
                ))}
              </select>
              {fieldErrors.spaceId && <small>{fieldErrors.spaceId}</small>}
            </label>

            <div className="maintenance-form-time-grid">
              <label className="maintenance-form-field">
                <span><CalendarClock size={16} /> Bắt đầu <b>*</b></span>
                <input
                  type="datetime-local"
                  value={startTime}
                  disabled={isSubmitting}
                  className={fieldErrors.startTime ? 'maintenance-input-error' : ''}
                  onChange={(event) => { setStartTime(event.target.value); clearFieldError('startTime'); }}
                />
                {fieldErrors.startTime && <small>{fieldErrors.startTime}</small>}
              </label>
              <label className="maintenance-form-field">
                <span><Clock3 size={16} /> Kết thúc <b>*</b></span>
                <input
                  type="datetime-local"
                  value={endTime}
                  min={startTime || undefined}
                  disabled={isSubmitting}
                  className={fieldErrors.endTime ? 'maintenance-input-error' : ''}
                  onChange={(event) => { setEndTime(event.target.value); clearFieldError('endTime'); }}
                />
                {fieldErrors.endTime && <small>{fieldErrors.endTime}</small>}
              </label>
            </div>

            <label className="maintenance-form-field maintenance-form-full">
              <span><Wrench size={16} /> Lý do bảo trì <b>*</b></span>
              <textarea
                value={reason}
                rows={4}
                maxLength={255}
                disabled={isSubmitting}
                className={fieldErrors.reason ? 'maintenance-input-error' : ''}
                placeholder="Ví dụ: Kiểm tra và bảo dưỡng hệ thống máy chiếu..."
                onChange={(event) => { setReason(event.target.value); clearFieldError('reason'); }}
              />
              <div className="maintenance-field-meta">
                <small>{fieldErrors.reason || 'Nội dung này sẽ được lưu vào lịch sử vận hành.'}</small>
                <em>{reason.length}/255</em>
              </div>
            </label>

            {conflictingBookings.length > 0 && (
              <div className="maintenance-conflicts">
                <h3>Các booking đang xung đột ({conflictingBookings.length})</h3>
                <p>Hãy chọn khoảng thời gian khác để không ảnh hưởng các booking đã có.</p>
                <div className="maintenance-conflict-list">
                  {conflictingBookings.map((booking) => (
                    <article key={booking.id}>
                      <div>
                        <strong>{booking.bookingCode || `BK-${booking.id}`}</strong>
                        <span><UserRound size={14} /> {booking.studentName || booking.studentEmail || 'Sinh viên'}</span>
                      </div>
                      <time>{formatConflictTime(booking.startTime)} – {formatConflictTime(booking.endTime)}</time>
                      <p>{booking.purpose || 'Không có nội dung sử dụng'}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="maintenance-modal-footer">
            <button type="button" className="maintenance-btn-secondary" onClick={onClose} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="maintenance-btn-primary" disabled={isSubmitting}>
              <Save size={17} /> {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo lịch bảo trì' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};
