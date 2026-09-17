import { useEffect, useRef } from 'react';
import type { CheckInBooking } from '../types/checkIn';
import { formatDateTime } from '../utils/checkInPresentation';

type Props = {
  booking: CheckInBooking | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StaffCheckInDialog({ booking, busy, error, onClose, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booking) dialogRef.current?.focus();
  }, [booking]);

  if (!booking) return null;

  return (
    <div className="checkin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="checkin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-checkin-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="checkin-dialog__heading">
          <div>
            <span className="checkin-card__id">STAFF SUPPORT</span>
            <h2 id="staff-checkin-title">Xác nhận check-in hộ</h2>
          </div>
          <button className="checkin-dialog__close" type="button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <p className="checkin-dialog__intro">
          Kiểm tra thông tin trước khi xác nhận. Thao tác sẽ được ghi nhận là do Staff thực hiện.
        </p>
        <dl className="checkin-dialog__summary">
          <div><dt>Booking</dt><dd>#{booking.bookingId}</dd></div>
          <div><dt>Sinh viên</dt><dd>{booking.studentName} · {booking.studentCode}</dd></div>
          <div><dt>Không gian</dt><dd>{booking.spaceName}</dd></div>
          <div><dt>Thời gian</dt><dd>{formatDateTime(booking.startTime)} – {formatDateTime(booking.endTime)}</dd></div>
        </dl>
        {error && <p className="checkin-inline-error" role="alert">{error}</p>}
        <div className="checkin-dialog__actions">
          <button className="checkin-button checkin-button--ghost" type="button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button className="checkin-button" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xác nhận…' : 'Xác nhận check-in'}
          </button>
        </div>
      </div>
    </div>
  );
}
