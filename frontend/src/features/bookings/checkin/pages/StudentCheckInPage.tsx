import { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '../../../../components/layouts/PortalLayout.tsx';
import CheckInPanel from '../components/CheckInPanel';
import { useCheckIn } from '../hooks/useCheckIn';
import { checkInApiService } from '../services/checkInApiService';
import type { CheckInActor, CheckInBooking } from '../types/checkIn';
import '../checkin.css';

const initialActor: CheckInActor = {
  id: '',
  name: 'Sinh viên hiện tại',
  email: '',
  role: 'STUDENT',
};

type BookingFilter = 'ALL' | 'READY' | 'UPCOMING' | 'HISTORY';

const matchesFilter = (booking: CheckInBooking, filter: BookingFilter) => {
  if (filter === 'READY') return booking.status === 'CONFIRMED' && booking.canCheckIn !== false;
  if (filter === 'UPCOMING') {
    return booking.status === 'PENDING_APPROVAL'
      || (booking.status === 'CONFIRMED' && booking.canCheckIn === false);
  }
  if (filter === 'HISTORY') {
    return ['CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'NO_SHOW'].includes(booking.status);
  }
  return true;
};

/** Student check-in screen backed by the real booking API. */
export default function StudentCheckInPage() {
  const [actor, setActor] = useState<CheckInActor>(initialActor);
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('ALL');
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
  const readyCount = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, 'READY')).length,
    [bookings],
  );
  const upcomingCount = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, 'UPCOMING')).length,
    [bookings],
  );
  const historyCount = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, 'HISTORY')).length,
    [bookings],
  );
  const filteredBookings = useMemo(
    () => bookings
      .filter((booking) => matchesFilter(booking, activeFilter))
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()),
    [activeFilter, bookings],
  );
  const filters: Array<{ key: BookingFilter; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả', count: bookings.length },
    { key: 'READY', label: 'Có thể check-in', count: readyCount },
    { key: 'UPCOMING', label: 'Sắp tới', count: upcomingCount },
    { key: 'HISTORY', label: 'Đã xử lý', count: historyCount },
  ];

  return (
    <PortalLayout pageTitle="Check-in">
      <main className="checkin-demo checkin-demo--embedded">
        <section className="checkin-summary" aria-label="Tổng quan check-in">
          <article className="checkin-summary__card checkin-summary__card--primary">
            <span className="checkin-summary__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div><span>Có thể check-in</span><strong>{readyCount}</strong><small>booking đang mở</small></div>
          </article>
          <article className="checkin-summary__card">
            <span className="checkin-summary__icon checkin-summary__icon--amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
              </svg>
            </span>
            <div><span>Sắp tới</span><strong>{upcomingCount}</strong><small>đang chờ đến giờ</small></div>
          </article>
          <article className="checkin-summary__card">
            <span className="checkin-summary__icon checkin-summary__icon--green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" /><path d="M21 12a9 9 0 1 1-5.3-8.2" />
              </svg>
            </span>
            <div><span>Đã check-in</span><strong>{checkedInCount}</strong><small>đã xác nhận có mặt</small></div>
          </article>
        </section>

        <section className="checkin-workspace" aria-label="Danh sách booking check-in">
          <div className="checkin-workspace__heading">
            <div>
              <h2>Booking của tôi</h2>
              <p>Theo dõi và thực hiện check-in cho các lượt đặt chỗ của bạn.</p>
            </div>
            <button className="checkin-refresh-button" type="button" onClick={() => void reload()} disabled={loading}>
              <svg className={loading ? 'is-spinning' : ''} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15" />
              </svg>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          <div className="checkin-filter-tabs" role="tablist" aria-label="Lọc booking">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.key}
                className={activeFilter === filter.key ? 'is-active' : ''}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
                <span>{filter.count}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="checkin-page-error" role="alert">
              <span aria-hidden="true">!</span>
              <div><strong>Không thể tải dữ liệu check-in</strong><p>{error}</p></div>
              <button type="button" onClick={() => void reload()}>Thử lại</button>
            </div>
          )}

          {loading ? (
            <div className="checkin-skeleton-grid" role="status" aria-label="Đang tải booking">
              {[1, 2].map((item) => <div className="checkin-skeleton-card" key={item} />)}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="checkin-empty" role="status">
              <span className="checkin-empty__icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" />
                  <line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="11" x2="21" y2="11" />
                </svg>
              </span>
              <h3>Không có booking trong mục này</h3>
              <p>Hãy chọn bộ lọc khác hoặc làm mới để cập nhật dữ liệu mới nhất.</p>
              {activeFilter !== 'ALL' && <button type="button" onClick={() => setActiveFilter('ALL')}>Xem tất cả booking</button>}
            </div>
          ) : (
            <div className="checkin-grid">
              {filteredBookings.map((booking) => (
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
          )}

          {!loading && filteredBookings.length > 0 && (
            <div className="checkin-workspace__footer">
              Hiển thị {filteredBookings.length} trong tổng số {bookings.length} booking
            </div>
          )}
        </section>
      </main>
    </PortalLayout>
  );
}
