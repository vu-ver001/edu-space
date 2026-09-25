import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { checkInApiService } from '../services/checkInApiService';
import type { CheckInActor, CheckInBooking, CheckInServiceError, CheckInToken } from '../types/checkIn';
import '../checkinVerification.css';

type Props = {
  booking: CheckInBooking;
  actor: CheckInActor;
  onVerified?: () => void;
};

const formatExpiry = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
}).format(new Date(value));

/** QR-ready one-time-code UI. A hardware/browser QR scanner can fill the input as keyboard text. */
export default function CheckInVerificationPanel({ booking, actor, onVerified }: Props) {
  const [issuedToken, setIssuedToken] = useState<CheckInToken | null>(null);
  const [enteredToken, setEnteredToken] = useState('');
  const [busy, setBusy] = useState<'issue' | 'verify' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (booking.status !== 'CONFIRMED') return null;

  const isOwner = actor.role !== 'STUDENT' || actor.id === booking.studentId;
  const canIssue = actor.role === 'STUDENT' && isOwner;

  const handleIssue = async () => {
    setBusy('issue');
    setMessage(null);
    try {
      const token = await checkInApiService.issueToken(booking.bookingId);
      setIssuedToken(token);
      setEnteredToken(token.token);
      setMessage({ tone: 'success', text: `Mã có hiệu lực đến ${formatExpiry(token.expiresAt)}.` });
    } catch (caught) {
      const error = caught as CheckInServiceError;
      setMessage({ tone: 'error', text: error.message || 'Không thể tạo mã check-in.' });
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    const value = enteredToken.trim();
    if (!value) {
      setMessage({ tone: 'error', text: 'Nhập hoặc quét mã trước khi xác minh.' });
      return;
    }
    setBusy('verify');
    setMessage(null);
    try {
      await checkInApiService.verifyToken(booking.bookingId, value);
      setMessage({ tone: 'success', text: 'Mã hợp lệ. Booking đã được check-in.' });
      setIssuedToken(null);
      setEnteredToken('');
      onVerified?.();
    } catch (caught) {
      const error = caught as CheckInServiceError;
      setMessage({ tone: 'error', text: error.message || 'Mã check-in không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setBusy(null);
    }
  };

  const copyToken = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken.token);
      setMessage({ tone: 'success', text: 'Đã sao chép mã một lần.' });
    } catch {
      setMessage({ tone: 'error', text: 'Không thể sao chép tự động; hãy chọn và copy mã.' });
    }
  };

  return (
    <section className="checkin-verification" aria-label="Xác minh check-in bằng mã một lần">
      <div className="checkin-verification__heading">
        <div>
          <span className="checkin-verification__eyebrow">M09 · QR / MÃ MỘT LẦN</span>
          <strong>Xác minh check-in</strong>
        </div>
        {canIssue && (
          <button
            className="checkin-button checkin-button--ghost checkin-verification__issue"
            type="button"
            onClick={() => void handleIssue()}
            disabled={busy !== null}
          >
            {busy === 'issue' ? 'Đang tạo…' : 'Tạo mã'}
          </button>
        )}
      </div>

      {issuedToken && (
        <div className="checkin-verification__issued">
          <span>Mã hiển thị cho Staff hoặc máy quét</span>
          <div className="checkin-verification__qr" aria-label="Mã QR check-in một lần">
            <QRCodeSVG value={issuedToken.token} size={96} level="M" />
          </div>
          <div className="checkin-verification__token-copy">
            <code>{issuedToken.token}</code>
            <button type="button" onClick={() => void copyToken()}>Sao chép</button>
          </div>
        </div>
      )}

      <div className="checkin-verification__input-row">
        <input
          value={enteredToken}
          onChange={(event) => setEnteredToken(event.target.value)}
          placeholder="Nhập hoặc quét mã check-in"
          autoComplete="one-time-code"
          spellCheck={false}
          aria-label="Mã check-in một lần"
        />
        <button
          className="checkin-button"
          type="button"
          onClick={() => void handleVerify()}
          disabled={busy !== null}
        >
          {busy === 'verify' ? 'Đang xác minh…' : 'Xác minh'}
        </button>
      </div>

      {message && (
        <p className={`checkin-verification__message checkin-verification__message--${message.tone}`} role="status">
          {message.text}
        </p>
      )}
    </section>
  );
}
