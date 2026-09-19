import CheckInButton from './CheckInButton';
import CheckInStatus from './CheckInStatus';
import type { CheckInActor, CheckInBooking } from '../types/checkIn';
import { getCheckInPresentation } from '../utils/checkInPresentation';

type Props = {
  booking: CheckInBooking;
  actor: CheckInActor;
  busy: boolean;
  onStudentCheckIn: (bookingId: number) => void;
  onStaffCheckIn: (booking: CheckInBooking) => void;
};

export default function CheckInPanel({
  booking,
  actor,
  busy,
  onStudentCheckIn,
  onStaffCheckIn,
}: Props) {
  const presentation = getCheckInPresentation(booking, actor);
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const day = new Intl.DateTimeFormat('vi-VN', { day: '2-digit' }).format(startTime);
  const month = new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(startTime);
  const fullDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(startTime);
  const formatTime = (value: Date) => new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

  return (
    <article className={`checkin-card checkin-card--${presentation.tone}`}>
      <div className="checkin-card__topline">
        <span className="checkin-card__id">Booking #{booking.bookingId}</span>
        <span className={`checkin-card__badge checkin-card__badge--${presentation.tone}`}>
          <span aria-hidden="true" />{presentation.label}
        </span>
      </div>

      <div className="checkin-card__main">
        <div className="checkin-card__date-tile" aria-label={fullDate}>
          <strong>{day}</strong>
          <span>{month}</span>
        </div>
        <div className="checkin-card__title">
          <h3>{booking.spaceName}</h3>
          <p>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="2.5" />
            </svg>
            {booking.building}
          </p>
        </div>
      </div>

      <div className="checkin-card__schedule">
        <div>
          <span className="checkin-card__schedule-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <span>Thời gian sử dụng</span>
        </div>
        <strong>{formatTime(startTime)} – {formatTime(endTime)}</strong>
        <small>{fullDate}</small>
      </div>

      <div className="checkin-card__student">
        <span className="checkin-card__student-avatar" aria-hidden="true">
          {booking.studentName.trim().charAt(0).toUpperCase() || 'S'}
        </span>
        <div>
          <span>Người đặt</span>
          <strong>{booking.studentName}</strong>
          <small>{booking.studentCode}</small>
        </div>
      </div>

      <CheckInStatus booking={booking} actor={actor} />
      <div className="checkin-card__actions">
        <span className="checkin-card__secure-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Xác thực bằng tài khoản hiện tại
        </span>
        <CheckInButton
          booking={booking}
          actor={actor}
          busy={busy}
          onStudentCheckIn={() => onStudentCheckIn(booking.bookingId)}
          onStaffCheckIn={() => onStaffCheckIn(booking)}
        />
      </div>
    </article>
  );
}
