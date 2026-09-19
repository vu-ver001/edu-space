import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CheckInPanel from '../components/CheckInPanel';
import { useCheckIn } from '../hooks/useCheckIn';
import { checkInApiService } from '../services/checkInApiService';
import type { CheckInActor } from '../types/checkIn';
import '../checkin.css';

const initialActor: CheckInActor = {
  id: '',
  name: 'Sinh viên hiện tại',
  email: '',
  role: 'STUDENT',
};

/** Student check-in screen backed by the real booking API. */
export default function StudentCheckInPage() {
  const [actor, setActor] = useState<CheckInActor>(initialActor);
  const { bookings, loading, error, busyBookingId, checkIn, reload } = useCheckIn(actor, checkInApiService);

  useEffect(() => {
    const firstBooking = bookings[0];
    if (!firstBooking || actor.id) return;

    // /my-bookings is scoped by the JWT, so the first returned booking identifies the current student.
    // oxlint-disable-next-line react/set-state-in-effect
    setActor({
      id: firstBooking.studentId,
      name: firstBooking.studentName,
      email: firstBooking.studentCode,
      role: 'STUDENT',
    });
  }, [actor.id, bookings]);

  const checkedInCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'CHECKED_IN').length,
    [bookings],
  );

  return (
    <main className="checkin-demo">
      <header className="checkin-demo__header">
        <div>
          <Link className="checkin-demo__back" to="/">← Về trang tổng quan</Link>
          <div className="checkin-demo__eyebrow">EDUSPACE · CHECK-IN MVP</div>
          <h1>Check-in của tôi</h1>
          <p className="checkin-demo__subtitle">
            Dữ liệu được tải từ booking thật của tài khoản đang đăng nhập. Backend quyết định quyền và thời gian check-in.
          </p>
        </div>
        <div className="checkin-demo__date">
          <span>Tài khoản</span>
          <strong>{actor.name}</strong>
          <small>{actor.email || 'Đang đọc từ booking…'}</small>
        </div>
      </header>

      <section className="checkin-demo__toolbar" aria-label="Điều khiển check-in">
        <div className="checkin-demo__tools">
          <button type="button" onClick={() => void reload()} disabled={loading}>
            Tải lại booking
          </button>
        </div>
      </section>

      <div className="checkin-demo__notice">
        <span className="checkin-demo__notice-icon" aria-hidden="true">●</span>
        <div>
          <strong>Chế độ API thật</strong>
          <p>Thao tác check-in gửi đến backend và chỉ đổi giao diện sau khi server xác nhận thành công.</p>
        </div>
      </div>

      <section className="checkin-metrics" aria-label="Tổng quan check-in">
        <div><span>Tổng booking</span><strong>{bookings.length}</strong></div>
        <div><span>Đã check-in</span><strong>{checkedInCount}</strong></div>
        <div><span>Vai trò</span><strong>Student</strong></div>
      </section>

      {error && <div className="checkin-page-error" role="alert">{error}</div>}
      {loading ? (
        <div className="checkin-loading" role="status">Đang tải booking…</div>
      ) : bookings.length === 0 ? (
        <div className="checkin-empty" role="status">Tài khoản chưa có booking để check-in.</div>
      ) : (
        <section className="checkin-list" aria-label="Booking của tôi">
          <div className="checkin-list__heading">
            <div>
              <span className="checkin-demo__eyebrow">MY BOOKINGS</span>
              <h2>Booking của tôi</h2>
            </div>
            <span>{bookings.length} booking</span>
          </div>
          <div className="checkin-grid">
            {bookings.map((booking) => (
              <CheckInPanel
                key={booking.bookingId}
                booking={booking}
                actor={actor}
                busy={busyBookingId === booking.bookingId}
                onStudentCheckIn={(bookingId) => void checkIn(bookingId)}
                onStaffCheckIn={() => undefined}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
