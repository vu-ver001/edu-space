import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, ScanLine } from 'lucide-react';
import { staffApi } from '../api/staffApi';
import type { StaffBooking } from '../types/staff';
import QrCameraScanner from '../components/QrCameraScanner';
import './QrCheckInPage.css';

type Result =
  | { tone: 'pending'; text: string }
  | { tone: 'success'; booking: StaffBooking }
  | { tone: 'error'; text: string };

const ERROR_TEXT: Record<string, string> = {
  CHECKIN_TOKEN_INVALID: 'Mã không hợp lệ, đã dùng hoặc hết hạn. Đề nghị sinh viên mở lại mã QR.',
  INVALID_STATUS_FOR_CHECKIN:
    'Booking không còn ở trạng thái CONFIRMED (đã hủy hoặc đã quá giờ check-in).',
  CHECKIN_TOO_EARLY: 'Chưa đến thời gian check-in của booking này.',
  CHECKIN_WINDOW_EXPIRED: 'Đã quá thời hạn check-in của booking này.',
  CHECKIN_FORBIDDEN: 'Bạn không có quyền xác minh check-in.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.',
  BOOKING_NOT_FOUND: 'Không tìm thấy booking tương ứng với mã này.',
  NETWORK_ERROR: 'Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.',
};

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} • ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

export default function QrCheckInPage() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  // Ô nhập tay phải luôn giữ focus để máy quét USB gõ vào được. Khi camera đang
  // bật thì tắt hẳn cơ chế này, nếu không sẽ cướp focus khỏi nút bật/tắt camera.
  useEffect(() => {
    if (cameraOn) return;
    inputRef.current?.focus();
  }, [cameraOn, result, busy]);

  const handleToken = useCallback(async (rawToken: string): Promise<void> => {
    const token = rawToken.trim();
    if (!token || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setResult({ tone: 'pending', text: 'Đang xác minh mã…' });
    try {
      const booking = await staffApi.scanCheckInToken(token);
      setResult({ tone: 'success', booking });
      setValue('');
      setSessionCount((count) => count + 1);
    } catch (error) {
      const detail = staffApi.scanCheckInError(error);
      setResult({ tone: 'error', text: ERROR_TEXT[detail.code] ?? detail.message });
      // Giữ mã trong ô để đối chiếu, nhưng chọn sẵn để lần nhập sau gõ đè.
      inputRef.current?.select();
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (!cameraOn) inputRef.current?.focus();
    }
  }, [cameraOn]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleToken(value);
  };

  const toggleCamera = () => {
    if (cameraOn) {
      setResult(null);
      setCameraOn(false);
    } else {
      setCameraOn(true);
    }
  };

  return (
    <div className="qrcheckin">
      <header className="qrcheckin__header">
        <div className="qrcheckin__title-group">
          <span className="qrcheckin__icon">
            <ScanLine size={22} />
          </span>
          <div>
            <h1 className="qrcheckin__title">Hỗ trợ check-in</h1>
            <p className="qrcheckin__subtitle">
              Quét mã QR của sinh viên, dùng máy quét USB hoặc dán mã thủ công.
            </p>
          </div>
        </div>
        {sessionCount > 0 && (
          <span className="qrcheckin__counter">Phiên này: {sessionCount} lượt</span>
        )}
      </header>

      <section className="qrcheckin__result" aria-live="polite" aria-label="Kết quả check-in">
        {result === null && (
          <p className="qrcheckin__result-idle">Chưa có kết quả. Quét hoặc nhập mã để bắt đầu.</p>
        )}

        {result?.tone === 'pending' && (
          <p className="qrcheckin__result-pending">{result.text}</p>
        )}

        {result?.tone === 'error' && (
          <div className="qrcheckin__result-error" role="alert">
            <strong>Không check-in được</strong>
            <span>{result.text}</span>
          </div>
        )}

        {result?.tone === 'success' && (
          <div className="qrcheckin__result-success" role="status">
            <strong>Check-in thành công</strong>
            <dl className="qrcheckin__result-grid">
              <div>
                <dt>Sinh viên</dt>
                <dd>{result.booking.studentName || '—'}</dd>
              </div>
              <div>
                <dt>MSSV</dt>
                <dd>{result.booking.studentUserCode || '—'}</dd>
              </div>
              <div>
                <dt>Lớp</dt>
                <dd>{result.booking.studentClassName || '—'}</dd>
              </div>
              <div>
                <dt>Phòng</dt>
                <dd>
                  {result.booking.spaceName || '—'}
                  {result.booking.spaceTypeName ? ` · ${result.booking.spaceTypeName}` : ''}
                </dd>
              </div>
              <div>
                <dt>Thời gian đặt</dt>
                <dd>
                  {formatTime(result.booking.startTime)} – {formatTime(result.booking.endTime)}
                </dd>
              </div>
              <div>
                <dt>Giờ check-in</dt>
                <dd>{formatTime(result.booking.checkedInAt)}</dd>
              </div>
              <div>
                <dt>Mã booking</dt>
                <dd>{result.booking.bookingCode || `#${result.booking.id}`}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <section className="qrcheckin__sources" aria-label="Nguồn nhập mã">
        <form className="qrcheckin__manual" onSubmit={handleSubmit}>
          <label className="qrcheckin__label" htmlFor="qrcheckin-token">
            Mã QR / mã một lần
          </label>
          <div className="qrcheckin__manual-row">
            <input
              id="qrcheckin-token"
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Quét máy USB hoặc dán mã, rồi nhấn Enter"
              autoComplete="off"
              spellCheck={false}
              aria-label="Mã check-in một lần"
            />
            <button type="submit" disabled={busy || !value.trim()}>
              {busy ? 'Đang kiểm tra…' : 'Xác minh'}
            </button>
          </div>
        </form>

        <div className="qrcheckin__camera-toggle">
          <button
            type="button"
            className={cameraOn ? 'is-active' : ''}
            onClick={toggleCamera}
            aria-pressed={cameraOn}
          >
            {cameraOn ? <CameraOff size={16} /> : <Camera size={16} />}
            {cameraOn ? 'Tắt camera' : 'Quét bằng camera'}
          </button>
          {!cameraOn && (
            <button
              type="button"
              className="qrcheckin__reset"
              onClick={() => {
                setResult(null);
                setValue('');
              }}
              disabled={!result && !value}
              title="Xoá kết quả hiện tại"
            >
              <RefreshCw size={16} />
              Xoá kết quả
            </button>
          )}
        </div>

        {cameraOn && <QrCameraScanner onToken={handleToken} />}
      </section>
    </div>
  );
}
