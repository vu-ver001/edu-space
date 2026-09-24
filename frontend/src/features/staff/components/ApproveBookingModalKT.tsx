import { Check, Info, X } from 'lucide-react';
import type { Space } from '../../space/types/space';
import type { StaffBooking } from '../types/staff';

interface ApproveBookingModalKTProps {
  isOpen: boolean;
  booking: StaffBooking | null;
  space?: Space;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

const bookingCode = (booking: StaffBooking) => {
  const source = new Date(booking.createdAt || booking.startTime);
  const datePart = Number.isNaN(source.getTime())
    ? 'BOOKING'
    : `${source.getFullYear()}${pad(source.getMonth() + 1)}${pad(source.getDate())}`;
  return `BK-${datePart}-${String(booking.id).padStart(3, '0')}`;
};

const formatBookingDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const formatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(value));

const durationLabel = (startTime: string, endTime: string) => {
  const minutes = Math.max(0, Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000,
  ));
  if (!Number.isFinite(minutes)) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} phút`;
  if (remainingMinutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
};

const modeLabel = (booking: StaffBooking, space?: Space) => {
  if (booking.tableId) return 'Đặt theo bàn';
  if (booking.selectedSeats?.length) return 'Đặt theo ghế';
  const mode = booking.bookingMode || space?.bookingMode || space?.spaceType?.bookingMode;
  if (mode === 'PER_TABLE') return 'Đặt theo bàn';
  if (mode === 'PER_SEAT') return 'Đặt theo ghế';
  return 'Đặt nguyên phòng';
};

const floorLabel = (floor?: string) => {
  const value = floor?.trim();
  if (!value) return '';
  return /^tầng\b/i.test(value) ? value : `Tầng ${value}`;
};

export const ApproveBookingModalKT = ({
  isOpen,
  booking,
  space,
  isLoading = false,
  onClose,
  onConfirm,
}: ApproveBookingModalKTProps) => {
  if (!isOpen || !booking) return null;

  const duration = durationLabel(booking.startTime, booking.endTime);

  return (
    <div className="booking-approve-backdrop" onClick={() => { if (!isLoading) onClose(); }}>
      <section
        className="booking-approve-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-approve-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="booking-approve-header">
          <div>
            <h2 id="booking-approve-title">Xác nhận duyệt booking</h2>
            <p>Vui lòng kiểm tra kỹ thông tin trước khi duyệt. Sinh viên sẽ nhận được thông báo và có thể check-in đúng giờ đã đăng ký.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Đóng"><X size={23} /></button>
        </header>

        <div className="booking-approve-body">
          <section className="booking-approve-info-card">
            <h3>Thông tin booking</h3>
            <dl>
              <div><dt>Mã booking</dt><dd><strong>{bookingCode(booking)}</strong></dd></div>
              <div><dt>Sinh viên</dt><dd><strong>{booking.studentName || 'Sinh viên'}</strong></dd></div>
              <div><dt>Email</dt><dd>{booking.studentEmail || 'Chưa cập nhật'}</dd></div>
              <div>
                <dt>Không gian</dt>
                <dd>
                  <strong>{space?.spaceCode || booking.spaceName}</strong>
                  <span>{booking.spaceName}</span>
                  <span>{booking.building || 'Chưa cập nhật'}{booking.floor ? ` · ${floorLabel(booking.floor)}` : ''}</span>
                </dd>
              </div>
              <div>
                <dt>Thời gian</dt>
                <dd>
                  <strong>{formatBookingDate(booking.startTime)}</strong>
                  <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}{duration ? ` (${duration})` : ''}</span>
                </dd>
              </div>
              <div><dt>Chế độ đặt</dt><dd><strong>{modeLabel(booking, space)}</strong></dd></div>
              {booking.tableCode && <div><dt>Bàn đã chọn</dt><dd><strong>{booking.tableCode}</strong></dd></div>}
              {!!booking.selectedSeats?.length && (
                <div><dt>Ghế đã chọn</dt><dd><strong>{booking.selectedSeats.join(', ')}</strong></dd></div>
              )}
              <div><dt>Số người</dt><dd><strong>{booking.participantCount} người</strong></dd></div>
              <div><dt>Mục đích sử dụng</dt><dd><strong>{booking.purpose || 'Chưa cung cấp'}</strong></dd></div>
            </dl>
          </section>

          <div className="booking-approve-note">
            <Info size={20} />
            <span>Sinh viên sẽ nhận được thông báo và có thể sử dụng không gian trong thời gian đã đăng ký.</span>
          </div>
        </div>

        <footer className="booking-approve-footer">
          <button type="button" className="cancel" onClick={onClose} disabled={isLoading}>Hủy</button>
          <button type="button" className="confirm" onClick={onConfirm} disabled={isLoading}>
            <Check size={19} /> {isLoading ? 'Đang duyệt...' : 'Duyệt booking'}
          </button>
        </footer>
      </section>
    </div>
  );
};
