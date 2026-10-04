import { useCallback, useEffect, useRef, useState } from 'react';
import { Scanner, type IDetectedBarcode, type IScannerError, type ScannerErrorKind } from '@yudiel/react-qr-scanner';
import './QrCameraScanner.css';

type Props = {
  /** Nhận token thô đã trim. Không được ném lỗi ra ngoài. */
  onToken: (token: string) => void | Promise<void>;
  /** Thời gian tối thiểu giữa hai lần gọi onToken. */
  cooldownMs?: number;
  /** Khoá mã vừa quét trong khoảng này để QR còn nằm trước camera không lặp vô hạn. */
  duplicateLockMs?: number;
};

const ERROR_MESSAGES: Record<ScannerErrorKind, string> = {
  'permission-denied':
    'Trình duyệt đã chặn quyền dùng camera. Hãy vào cài đặt quyền của trình duyệt cho phép camera rồi thử lại.',
  'no-camera': 'Không tìm thấy camera nào trên máy này. Bạn vẫn có thể dán mã vào ô nhập tay.',
  'in-use': 'Camera đang bị ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.',
  'overconstrained': 'Không mở được camera với cấu hình yêu cầu. Bạn vẫn có thể dán mã vào ô nhập tay.',
  'insecure-context':
    'Camera chỉ chạy trên HTTPS hoặc localhost. Truy cập trang bằng https:// hoặc chạy dev tại localhost.',
  unsupported:
    'Trình duyệt này không hỗ trợ quét mã bằng camera. Bạn vẫn có thể dán mã vào ô nhập tay.',
  security: 'Trình duyệt chặn truy cập camera vì lý do bảo mật. Bạn vẫn có thể dán mã vào ô nhập tay.',
  'type-error': 'Không khởi tạo được bộ đọc mã. Bạn vẫn có thể dán mã vào ô nhập tay.',
  aborted: 'Camera khởi động không thành công. Bạn vẫn có thể dán mã vào ô nhập tay.',
  unknown: 'Không mở được camera. Bạn vẫn có thể dán mã vào ô nhập tay.',
};

const describeError = (error: IScannerError): string =>
  ERROR_MESSAGES[error.kind] ?? ERROR_MESSAGES.unknown;

/**
 * Nguồn nhập token thứ ba bên cạnh máy quét USB và dán tay.
 *
 * Thư viện khởi tạo lại tập mã đã đọc mỗi lần bật/tắt `paused`, nên việc khoá theo
 * giá trị và khoá theo thời gian phải tự quản lý ở đây.
 */
export default function QrCameraScanner({
  onToken,
  cooldownMs = 2000,
  duplicateLockMs = 5000,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Ref chặn đồng bộ: hai khung hình liên tiếp có thể gọi onScan trước khi kịp render lại.
  const scanningRef = useRef(false);
  const lastValueRef = useRef<string | null>(null);
  const lockedUntilRef = useRef(0);
  const errorShownRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  // Dọn timer để không setState sau khi component đã unmount.
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const handleScan = useCallback(
    async (detectedCodes: IDetectedBarcode[]) => {
      if (scanningRef.current) return;
      const token = detectedCodes[0]?.rawValue?.trim();
      if (!token) return;
      if (token === lastValueRef.current && Date.now() < lockedUntilRef.current) return;

      scanningRef.current = true;
      lastValueRef.current = token;
      setPaused(true);

      const startedAt = Date.now();
      try {
        await onToken(token);
      } catch {
        // onToken tự hiển thị lỗi; nuốt tại đây vì thư viện không await onScan,
        // nếu không sẽ thành unhandled rejection.
      } finally {
        // Chỉ mở lại camera khi request đã xong VÀ đã đủ cooldown, để không bắn
        // trùng khi API chậm hơn thời gian chờ.
        const wait = Math.max(0, cooldownMs - (Date.now() - startedAt));
        resumeTimerRef.current = window.setTimeout(() => {
          lockedUntilRef.current = Date.now() + duplicateLockMs;
          scanningRef.current = false;
          resumeTimerRef.current = null;
          setPaused(false);
        }, wait);
      }
    },
    [onToken, cooldownMs, duplicateLockMs],
  );

  const handleError = useCallback((error: IScannerError) => {
    if (errorShownRef.current) return;
    errorShownRef.current = true;
    setFailed(true);
    setPaused(true);
    setCameraError(describeError(error));
  }, []);

  return (
    <div className="qr-camera">
      <div className="qr-camera__frame">
        <Scanner
          onScan={handleScan}
          onError={handleError}
          paused={paused || failed}
          constraints={{ facingMode: 'environment' }}
          formats={['qr_code']}
          sound={false}
        />
      </div>

      {failed && (
        <p className="qr-camera__error" role="alert">
          {cameraError}
        </p>
      )}

      <p className="qr-camera__hint">
        {paused && !failed
          ? 'Đã nhận mã, đang xác minh…'
          : 'Đưa màn hình QR của sinh viên vào khung hình.'}
      </p>
    </div>
  );
}
