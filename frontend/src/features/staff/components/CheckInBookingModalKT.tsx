import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  IdCard,
  Mail,
  MapPin,
  UserRound,
  X,
} from 'lucide-react';
import type { Space } from '../../space/types/space';
import type { StaffBooking } from '../types/staff';

interface CheckInBookingModalKTProps {
  isOpen: boolean;
  booking: StaffBooking | null;
  space?: Space;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(value));

const initials = (name?: string) => {
  if (!name?.trim()) return 'SV';
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase();
};

const floorLabel = (floor?: string) => {
  const value = floor?.trim();
  if (!value) return '';
  return /^tầng\b/i.test(value) ? value : `Tầng ${value}`;
};

const bookingModeLabel = (booking: StaffBooking, space?: Space) => {
  if (booking.tableId) return 'Đặt theo bàn';
  if (booking.selectedSeats?.length) return 'Đặt theo ghế';
  const mode = booking.bookingMode || space?.bookingMode || space?.spaceType?.bookingMode;
  if (mode === 'PER_TABLE') return 'Đặt theo bàn';
  if (mode === 'PER_SEAT') return 'Đặt theo ghế';
  return 'Đặt nguyên phòng';
};

export const CheckInBookingModalKT = ({
  isOpen,
  booking,
  space,
  isLoading = false,
  onClose,
  onConfirm,
}: CheckInBookingModalKTProps) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="booking-approve-backdrop" onClick={() => { if (!isLoading) onClose(); }}>
      <section
        className="booking-approve-modal booking-checkin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-checkin-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="booking-approve-header">
          <div>
            <h2 id="booking-checkin-title">Xác nhận check-in</h2>
            <p>Kiểm tra đúng sinh viên và thông tin đặt chỗ trước khi xác nhận.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Đóng">
            <X size={22} />
          </button>
        </header>

        <div className="booking-approve-body">
          <section className="booking-checkin-student-card">
            <span className="booking-checkin-avatar">{initials(booking.studentName)}</span>
            <div className="booking-checkin-student-main">
              <strong>{booking.studentName || 'Sinh viên'}</strong>
              <div><IdCard size={14} /> {booking.studentUserCode || 'Chưa cập nhật mã sinh viên'}</div>
              <div><UserRound size={14} /> Lớp: {booking.studentClassName || 'Chưa cập nhật'}</div>
              <div><Mail size={14} /> {booking.studentEmail || 'Chưa cập nhật email'}</div>
            </div>
          </section>

          <section className="booking-approve-info-card booking-checkin-info-card">
            <h3>Thông tin đặt chỗ</h3>
            <dl>
              <div><dt>Mã booking</dt><dd><strong>{booking.bookingCode || 'Chưa có mã'}</strong></dd></div>
              <div>
                <dt>Không gian</dt>
                <dd>
                  <strong>{space?.spaceCode || booking.spaceName}</strong>
                  <span>{booking.spaceName}</span>
                  <span><MapPin size={12} /> {booking.building || space?.building || 'Chưa cập nhật'}{(booking.floor || space?.floor) ? ` · ${floorLabel(booking.floor || space?.floor)}` : ''}</span>
                </dd>
              </div>
              <div>
                <dt>Thời gian</dt>
                <dd>
                  <strong><CalendarDays size={13} /> {formatDate(booking.startTime)}</strong>
                  <span><Clock3 size={12} /> {formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                </dd>
              </div>
              <div><dt>Hình thức đặt</dt><dd><strong>{bookingModeLabel(booking, space)}</strong></dd></div>
              {booking.tableCode && <div><dt>Bàn đã chọn</dt><dd><strong>{booking.tableCode}</strong></dd></div>}
              {!!booking.selectedSeats?.length && (
                <div><dt>Ghế đã chọn</dt><dd><strong>{booking.selectedSeats.join(', ')}</strong></dd></div>
              )}
              <div><dt>Số người</dt><dd><strong>{booking.participantCount} người</strong></dd></div>
              <div><dt>Mục đích</dt><dd><strong>{booking.purpose || 'Chưa cung cấp'}</strong></dd></div>
            </dl>
          </section>

          <div className="booking-approve-note booking-checkin-note">
            <UserRound size={20} />
            <span>Thao tác này xác nhận sinh viên đã có mặt và bắt đầu sử dụng không gian.</span>
          </div>
        </div>

        <footer className="booking-approve-footer">
          <button type="button" className="cancel" onClick={onClose} disabled={isLoading}>Hủy bỏ</button>
          <button type="button" className="confirm" onClick={onConfirm} disabled={isLoading}>
            <CheckCircle2 size={18} /> {isLoading ? 'Đang check-in...' : 'Xác nhận check-in'}
          </button>
        </footer>
      </section>
    </div>
  );
};
