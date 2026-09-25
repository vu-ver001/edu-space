import { useState } from 'react';
import { checkInApiService } from '../services/checkInApiService';
import type { CheckInServiceError } from '../types/checkIn';
import '../checkinVerification.css';

type Props = {
  bookingId: number;
  onVerified?: () => void;
};

/** Staff-facing text/QR-scanner input. QR scanners commonly act as keyboard input. */
export default function CheckInTokenInput({ bookingId, onVerified }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const verify = async () => {
    const token = value.trim();
    if (!token) {
      setMessage({ tone: 'error', text: 'Nhập hoặc quét mã trước khi xác minh.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await checkInApiService.verifyToken(bookingId, token);
      setValue('');
      setMessage({ tone: 'success', text: 'Mã hợp lệ. Booking đã được check-in.' });
      onVerified?.();
    } catch (caught) {
      const error = caught as CheckInServiceError;
      setMessage({ tone: 'error', text: error.message || 'Mã không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="checkin-token-input" aria-label={`Nhập mã check-in cho booking ${bookingId}`}>
      <div className="checkin-token-input__label">Mã QR / mã một lần cho booking #{bookingId}</div>
      <div className="checkin-verification__input-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Quét hoặc nhập mã"
          autoComplete="one-time-code"
          spellCheck={false}
          aria-label="Mã check-in một lần"
        />
        <button className="checkin-button" type="button" onClick={() => void verify()} disabled={busy}>
          {busy ? 'Đang xác minh…' : 'Xác minh'}
        </button>
      </div>
      {message && (
        <p className={`checkin-verification__message checkin-verification__message--${message.tone}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
