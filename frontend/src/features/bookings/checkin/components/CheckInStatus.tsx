import type { CheckInActor, CheckInBooking } from '../types/checkIn';
import { getCheckInPresentation } from '../utils/checkInPresentation';

type Props = {
  booking: CheckInBooking;
  actor: CheckInActor;
};

export default function CheckInStatus({ booking, actor }: Props) {
  const presentation = getCheckInPresentation(booking, actor);

  return (
    <div className={`checkin-status checkin-status--${presentation.tone}`}>
      <span className="checkin-status__dot" aria-hidden="true" />
      <div>
        <strong>{presentation.label}</strong>
        <p>{presentation.description}</p>
      </div>
    </div>
  );
}
