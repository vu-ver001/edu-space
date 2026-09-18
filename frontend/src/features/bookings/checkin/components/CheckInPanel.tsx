import CheckInButton from './CheckInButton';
import CheckInStatus from './CheckInStatus';
import type { CheckInActor, CheckInBooking } from '../types/checkIn';
import { formatDateTime } from '../utils/checkInPresentation';

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
  return (
    <article className="checkin-card">
      <div className="checkin-card__topline">
        <span className="checkin-card__id">BOOKING #{booking.bookingId}</span>
        <span className="checkin-card__mode">MVP · thủ công</span>
      </div>
      <div className="checkin-card__heading">
        <div>
          <h3>{booking.spaceName}</h3>
          <p>{booking.building}</p>
        </div>
        <span className="checkin-card__date">{formatDateTime(booking.startTime)}</span>
      </div>
      <div className="checkin-card__details">
        <div>
          <span>Người đặt</span>
          <strong>{booking.studentName}</strong>
          <small>{booking.studentCode}</small>
        </div>
        <div>
          <span>Thời gian</span>
          <strong>{formatDateTime(booking.startTime)}</strong>
          <small>đến {formatDateTime(booking.endTime)}</small>
        </div>
      </div>
      <CheckInStatus booking={booking} actor={actor} />
      <div className="checkin-card__actions">
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
