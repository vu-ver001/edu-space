import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CheckInPanel from '../components/CheckInPanel';
import StaffCheckInDialog from '../components/StaffCheckInDialog';
import { DEMO_ACTORS, DEMO_NOW } from '../mocks/fixtures';
import { useCheckIn } from '../hooks/useCheckIn';
import { checkInService } from '../services/checkInService';
import type { CheckInActor, CheckInBooking, CheckInRole } from '../types/checkIn';
import '../checkin.css';

const ROLE_LABELS: Record<CheckInRole, string> = {
  STUDENT: 'Student',
  STAFF: 'Staff',
  ADMIN: 'Admin',
};

export default function CheckInDemoPage() {
  const [role, setRole] = useState<CheckInRole>('STUDENT');
  const [selectedBooking, setSelectedBooking] = useState<CheckInBooking | null>(null);
  const [dialogError, setDialogError] = useState('');
  const [networkFailure, setNetworkFailure] = useState(false);

  const actor = useMemo<CheckInActor>(() => {
    if (role === 'STAFF' || role === 'ADMIN') return DEMO_ACTORS[2];
    return DEMO_ACTORS[0];
  }, [role]);
  const { bookings, loading, error, busyBookingId, checkIn, reload, reset } = useCheckIn(actor);

  const visibleBookings = useMemo(
    () => (role === 'STUDENT' ? bookings.filter((booking) => booking.studentId === actor.id || booking.bookingId === 1006) : bookings),
    [actor.id, bookings, role],
  );
  const availableCount = bookings.filter((booking) => booking.status === 'CONFIRMED' && booking.demoState === 'AVAILABLE').length;
  const checkedInCount = bookings.filter((booking) => booking.status === 'CHECKED_IN').length;

  const handleStudentCheckIn = async (bookingId: number) => {
    await checkIn(bookingId);
  };

  const handleStaffConfirm = async () => {
    if (!selectedBooking) return;
    setDialogError('');
    const outcome = await checkIn(selectedBooking.bookingId);
    if (outcome.success) {
      setSelectedBooking(null);
    } else {
      setDialogError(outcome.message);
    }
  };

  return (
    <main className="checkin-demo">
      <header className="checkin-demo__header">
        <div>
          <Link className="checkin-demo__back" to="/">← Về trang tổng quan</Link>
          <div className="checkin-demo__eyebrow">EDUSPACE · CHECK-IN MVP</div>
          <h1>Check-in thủ công</h1>
          <p className="checkin-demo__subtitle">
            Trang demo dùng mock data để kiểm thử luồng Student và Staff trước khi Booking API sẵn sàng.
          </p>
        </div>
        <div className="checkin-demo__date">
          <span>Thời điểm mô phỏng</span>
          <strong>16/09/2026 · 09:00</strong>
          <small>{DEMO_NOW}</small>
        </div>
      </header>

      <section className="checkin-demo__toolbar" aria-label="Điều khiển demo">
        <div className="checkin-role-switch" role="group" aria-label="Vai trò mô phỏng">
          <span>Đang xem với vai trò</span>
          {(['STUDENT', 'STAFF'] as CheckInRole[]).map((item) => (
            <button
              className={role === item ? 'is-active' : ''}
              key={item}
              type="button"
              onClick={() => {
                setRole(item);
                setSelectedBooking(null);
                setDialogError('');
              }}
              aria-pressed={role === item}
            >
              {ROLE_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="checkin-demo__tools">
          <button type="button" onClick={() => void reload()}>Tải lại mock</button>
          <button type="button" onClick={reset}>Đặt lại dữ liệu</button>
          <button
            className={networkFailure ? 'checkin-demo__tool-danger' : ''}
            type="button"
            onClick={() => {
              const nextValue = !networkFailure;
              setNetworkFailure(nextValue);
              checkInService.setFailureMode(nextValue ? 'NETWORK' : 'NONE');
            }}
          >
            {networkFailure ? 'Tắt lỗi mạng' : 'Mô phỏng lỗi mạng'}
          </button>
        </div>
      </section>

      <div className="checkin-demo__notice">
        <span className="checkin-demo__notice-icon" aria-hidden="true">●</span>
        <div>
          <strong>Chế độ dữ liệu demo</strong>
          <p>Backend chưa được gọi. Các trạng thái và kết quả trong trang này chỉ dùng để kiểm thử giao diện.</p>
        </div>
      </div>

      <section className="checkin-metrics" aria-label="Tổng quan check-in">
        <div><span>Tổng booking mẫu</span><strong>{bookings.length}</strong></div>
        <div><span>Đang có thể check-in</span><strong>{availableCount}</strong></div>
        <div><span>Đã check-in</span><strong>{checkedInCount}</strong></div>
        <div><span>Vai trò hiện tại</span><strong>{ROLE_LABELS[role]}</strong></div>
      </section>

      {error && <div className="checkin-page-error" role="alert">{error}</div>}
      {loading ? (
        <div className="checkin-loading" role="status">Đang tải dữ liệu demo…</div>
      ) : (
        <section className="checkin-list" aria-label="Danh sách booking">
          <div className="checkin-list__heading">
            <div>
              <span className="checkin-demo__eyebrow">BOOKINGS</span>
              <h2>{role === 'STUDENT' ? 'Booking của tôi' : 'Booking cần hỗ trợ'}</h2>
            </div>
            <span>{visibleBookings.length} booking mẫu</span>
          </div>
          <div className="checkin-grid">
            {visibleBookings.map((booking) => (
              <CheckInPanel
                key={booking.bookingId}
                booking={booking}
                actor={actor}
                busy={busyBookingId === booking.bookingId}
                onStudentCheckIn={(bookingId) => void handleStudentCheckIn(bookingId)}
                onStaffCheckIn={(item) => {
                  setDialogError('');
                  setSelectedBooking(item);
                }}
              />
            ))}
          </div>
        </section>
      )}

      <StaffCheckInDialog
        booking={role === 'STAFF' ? selectedBooking : null}
        busy={selectedBooking ? busyBookingId === selectedBooking.bookingId : false}
        error={dialogError}
        onClose={() => setSelectedBooking(null)}
        onConfirm={() => void handleStaffConfirm()}
      />
    </main>
  );
}
