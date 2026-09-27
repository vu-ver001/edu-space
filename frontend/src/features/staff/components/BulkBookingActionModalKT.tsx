import { useState, type FormEvent } from 'react';
import { Check, Info, X } from 'lucide-react';
import type { StaffBooking } from '../types/staff';
import './BulkBookingActionModalKT.css';

type BulkAction = 'approve' | 'reject';

interface BulkBookingActionModalKTProps {
  isOpen: boolean;
  action: BulkAction;
  bookings: StaffBooking[];
  spaceCodeById: ReadonlyMap<number, string>;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

const MAX_REASON_LENGTH = 2000;

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(value));

export const BulkBookingActionModalKT = ({
  isOpen,
  action,
  bookings,
  spaceCodeById,
  isLoading = false,
  onClose,
  onConfirm,
}: BulkBookingActionModalKTProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isReject = action === 'reject';

  if (!isOpen || bookings.length === 0) return null;

  const handleClose = () => {
    if (isLoading) return;
    setReason('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedReason = reason.trim();

    if (isReject && !normalizedReason) {
      setError('Vui lòng nhập lý do từ chối các booking đã chọn.');
      return;
    }

    setError(null);
    try {
      await onConfirm(isReject ? normalizedReason : undefined);
      setReason('');
      setError(null);
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.message
        || submitError?.message
        || `Không thể ${isReject ? 'từ chối' : 'duyệt'} các booking đã chọn.`,
      );
    }
  };

  return (
    <div className="booking-bulk-modal-backdrop" onClick={handleClose}>
      <form
        className={`booking-bulk-modal${isReject ? ' reject' : ' approve'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-bulk-modal-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="booking-bulk-modal-header">
          <span className="booking-bulk-modal-icon">
            {isReject ? <X size={22} /> : <Check size={22} />}
          </span>
          <div>
            <h2 id="booking-bulk-modal-title">
              {isReject ? 'Từ chối' : 'Duyệt'} {bookings.length} booking đã chọn
            </h2>
            <p>
              {isReject
                ? 'Kiểm tra danh sách và nhập lý do từ chối chung cho các booking đã chọn.'
                : 'Kiểm tra các booking đã chọn trước khi duyệt. Hệ thống sẽ báo riêng những booking không còn hợp lệ.'}
            </p>
          </div>
          <button type="button" onClick={handleClose} disabled={isLoading} aria-label="Đóng">
            <X size={22} />
          </button>
        </header>

        <div className="booking-bulk-modal-body">
          <div className="booking-bulk-table-wrap">
            <table className="booking-bulk-table">
              <thead>
                <tr>
                  <th>Mã booking</th>
                  <th>Sinh viên</th>
                  <th>Không gian</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.bookingCode || 'Chưa có mã'}</strong></td>
                    <td>{booking.studentName || 'Sinh viên'}</td>
                    <td>
                      <strong>{spaceCodeById.get(booking.spaceId) || booking.spaceName}</strong>
                      <small>{booking.spaceName}</small>
                    </td>
                    <td>
                      <small>{formatDate(booking.startTime)}</small>
                      <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isReject && (
            <label className="booking-bulk-reason">
              <span>Lý do từ chối <em>*</em></span>
              <textarea
                rows={3}
                maxLength={MAX_REASON_LENGTH}
                value={reason}
                disabled={isLoading}
                className={error ? 'invalid' : ''}
                placeholder="Nhập lý do từ chối các booking đã chọn..."
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error) setError(null);
                }}
              />
              <small>{reason.length}/{MAX_REASON_LENGTH}</small>
            </label>
          )}

          {error && <div className="booking-bulk-modal-error">{error}</div>}

          <div className="booking-bulk-modal-note">
            <Info size={20} />
            {isReject ? (
              <ul>
                <li>Lý do sẽ được gửi tới các sinh viên có booking bị từ chối.</li>
                <li>Booking không còn hợp lệ sẽ được backend báo riêng sau khi xử lý.</li>
                <li>Thao tác của Staff được ghi nhận trong lịch sử booking.</li>
              </ul>
            ) : (
              <ul>
                <li>Chỉ các booking còn hợp lệ mới được duyệt.</li>
                <li>Booking không còn hợp lệ sẽ được backend báo riêng sau khi xử lý.</li>
                <li>Thao tác của Staff được ghi nhận trong lịch sử booking.</li>
              </ul>
            )}
          </div>
        </div>

        <footer className="booking-bulk-modal-footer">
          <button type="button" className="cancel" onClick={handleClose} disabled={isLoading}>Hủy</button>
          <button type="submit" className="confirm" disabled={isLoading}>
            {isLoading
              ? 'Đang xử lý...'
              : `${isReject ? 'Từ chối' : 'Duyệt'} ${bookings.length} booking`}
          </button>
        </footer>
      </form>
    </div>
  );
};
