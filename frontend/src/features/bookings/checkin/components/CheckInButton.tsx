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
        Xác nhận check-in hộ
      </button>
    );
  }

  return (
    <button className="checkin-button" type="button" onClick={onStudentCheckIn} disabled={busy}>
      {busy ? 'Đang check-in…' : 'Check-in ngay'}
    </button>
  );
}
