import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { bookingService, type Booking } from '../services/bookingService';
import './QrCheckInModal.css';

interface QrCheckInModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

interface TokenData {
  bookingId: number;
  token: string;
  issuedAt: string;
  expiresAt: string;
}

export const QrCheckInModal: React.FC<QrCheckInModalProps> = ({
  booking,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Gọi API backend của bạn Vũ để phát hành token check-in cho booking này
  const fetchToken = async () => {
    if (!booking) return;
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      const data = await bookingService.issueCheckInToken(booking.id);
      setTokenData(data);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;
      setErrorStatus(code || 'ERROR');
      setErrorMessage(msg || 'Không thể tạo mã QR check-in lúc này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (booking) {
      fetchToken();
    } else {
      setTokenData(null);
      setErrorStatus(null);
      setErrorMessage(null);
    }
  }, [booking?.id]);

  if (!booking) return null;

  // Sao chép chuỗi mã token
  const handleCopyToken = () => {
    if (!tokenData?.token) return;
    navigator.clipboard?.writeText(tokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  // Định dạng ngày giờ
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Tính giờ mở cửa sổ check-in (trước 15 phút)
  const startDate = new Date(booking.startTime);
  const openTime = new Date(startDate.getTime() - 15 * 60 * 1000);
  const openTimeStr = `${pad(openTime.getHours())}:${pad(openTime.getMinutes())}`;
  const openDateStr = `${pad(openTime.getDate())}/${pad(openTime.getMonth() + 1)}/${openTime.getFullYear()}`;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-title-group">
            <div className="qr-modal-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="qr-modal-title">Mã QR Check-in</h3>
              <div className="qr-modal-subtitle">
                <span>Điểm danh phòng học</span>
                <span className="qr-booking-badge">
                  {booking.bookingCode ? booking.bookingCode : `Đơn #${booking.id}`}
                </span>
              </div>
            </div>
          </div>

          <button type="button" className="qr-modal-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="qr-modal-body">
          {/* Tóm tắt thông tin đơn đặt */}
          <div className="qr-space-summary-card">
            <div className="qr-space-name-row">
              <span className="qr-space-name">{booking.spaceName}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: '4px' }}>
                {booking.spaceTypeName}
              </span>
            </div>
            <div className="qr-space-meta">
              <span>📍 {booking.building} • {booking.floor}</span>
              <span>•</span>
              <span>🕒 {formatDateTime(booking.startTime)}</span>
            </div>
          </div>

          {/* Trạng thái 1: Đang tải */}
          {loading ? (
            <div className="qr-loading-box">
              <div className="qr-spinner" />
              <span>Đang kết nối backend tạo mã QR bảo mật...</span>
            </div>
          ) : errorStatus === 'CHECKIN_TOO_EARLY' ? (
            /* Trạng thái 2: Chưa đến giờ mở cửa sổ check-in */
            <div className="qr-early-state">
              <div className="qr-early-icon-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4 className="qr-early-title">Cửa sổ check-in chưa mở</h4>
              <div className="qr-early-desc">
                Theo chính sách trường, mã QR check-in được hệ thống phát hành tự động trước giờ bắt đầu <strong>15 phút</strong>.
                <br />
                ⏰ Bạn vui lòng quay lại lấy mã vào lúc: <strong>{openTimeStr} ngày {openDateStr}</strong>.
              </div>
            </div>
          ) : errorMessage ? (
            /* Trạng thái 3: Lỗi khác */
            <div className="qr-early-state">
              <div className="qr-early-icon-circle" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h4 className="qr-early-title" style={{ color: '#991B1B' }}>Không thể tạo mã check-in</h4>
              <p style={{ color: '#7F1D1D', fontSize: '0.875rem', margin: '0 0 16px' }}>{errorMessage}</p>
              <button
                type="button"
                className="btn-copy-token"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={fetchToken}
              >
                🔄 Thử lại
              </button>
            </div>
          ) : tokenData ? (
            /* Trạng thái 4: Hiển thị mã QR thực tế từ CSDL */
            <>
              <div className="qr-code-wrapper" aria-label="Mã QR Check-in điểm danh">
                <QRCodeSVG
                  value={tokenData.token}
                  size={190}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* Chuỗi token và nút sao chép */}
              <div className="qr-token-display">
                <code>{tokenData.token}</code>
                <button type="button" className="btn-copy-token" onClick={handleCopyToken}>
                  {copied ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>

              {/* Thời hạn mã */}
              <div className="qr-expiry-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Hiệu lực đến {formatDateTime(tokenData.expiresAt)}</span>
              </div>

              <p className="qr-instruction-text">
                Đưa mã QR này trước camera/máy quét tại phòng học hoặc xuất trình cho nhân viên quầy Staff để hoàn tất điểm danh.
              </p>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="qr-modal-footer">
          <button type="button" className="btn-qr-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
