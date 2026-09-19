import type { CheckInActor, CheckInBooking } from '../types/checkIn';
import { getCheckInPresentation } from '../utils/checkInPresentation';

type Props = {
  booking: CheckInBooking;
  actor: CheckInActor;
  busy: boolean;
  onStudentCheckIn: () => void;
  onStaffCheckIn: () => void;
};

export default function CheckInButton({
  booking,
  actor,
  busy,
  onStudentCheckIn,
  onStaffCheckIn,
}: Props) {
  const presentation = getCheckInPresentation(booking, actor);

  if (!presentation.canSubmit) {
    return <span className="checkin-action__hint">Chưa thể thao tác</span>;
  }

  if (actor.role === 'STAFF' || actor.role === 'ADMIN') {
    return (
      <button className="checkin-button checkin-button--secondary" type="button" onClick={onStaffCheckIn} disabled={busy}>
        <span>Xác nhận check-in hộ</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    );
  }

  return (
    <button className="checkin-button" type="button" onClick={onStudentCheckIn} disabled={busy}>
      <span>{busy ? 'Đang check-in…' : 'Check-in ngay'}</span>
      {!busy && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}
