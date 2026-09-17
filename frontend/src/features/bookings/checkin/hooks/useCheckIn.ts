import { useCallback, useEffect, useState } from 'react';
import { checkInService } from '../services/checkInService';
import type { CheckInActor, CheckInBooking, CheckInServiceError } from '../types/checkIn';

export function useCheckIn(actor: CheckInActor) {
  const [bookings, setBookings] = useState<CheckInBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await checkInService.listBookings());
    } catch {
      setError('Không tải được dữ liệu demo. Hãy thử tải lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect synchronizes the demo view with the mock service on first render.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadBookings();
  }, [loadBookings]);

  const checkIn = useCallback(
    async (bookingId: number) => {
      setBusyBookingId(bookingId);
      setError('');
      try {
        await checkInService.checkIn(bookingId, actor);
        setBookings(await checkInService.listBookings());
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
    [actor],
  );

  const reset = useCallback(() => {
    checkInService.reset();
    void loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    loading,
    error,
    busyBookingId,
    checkIn,
    reload: loadBookings,
    reset,
  };
}
