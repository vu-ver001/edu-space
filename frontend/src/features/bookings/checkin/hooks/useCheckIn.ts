import { useCallback, useEffect, useState } from 'react';
import type {
  CheckInActor,
  CheckInBooking,
  CheckInService,
  CheckInServiceError,
} from '../types/checkIn';

export function useCheckIn(actor: CheckInActor, service: CheckInService) {
  const [bookings, setBookings] = useState<CheckInBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await service.listBookings(actor));
    } catch (caught) {
      const serviceError = caught as CheckInServiceError;
      setError(serviceError.message || 'Không tải được dữ liệu booking. Hãy thử tải lại.');
    } finally {
      setLoading(false);
    }
  }, [actor, service]);

  useEffect(() => {
    // Synchronize the view with the real service on first render and actor changes.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadBookings();
  }, [actor, service, loadBookings]);

  const checkIn = useCallback(
    async (bookingId: number) => {
      setBusyBookingId(bookingId);
      setError('');
      try {
        await service.checkIn(bookingId, actor);
        setBookings(await service.listBookings(actor));
        return { success: true as const };
      } catch (caught) {
        const serviceError = caught as CheckInServiceError;
        const message = serviceError.message || 'Không thể check-in lúc này.';
        setError(message);
        return { success: false as const, message };
      } finally {
        setBusyBookingId(null);
      }
    },
    [actor, service],
  );

  return {
    bookings,
    loading,
    error,
    busyBookingId,
    checkIn,
    reload: loadBookings,
  };
}
