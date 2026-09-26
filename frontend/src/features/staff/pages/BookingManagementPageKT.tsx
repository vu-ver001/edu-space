import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Pagination } from '../../../components/common/Pagination';
import { FilterSelect } from '../../../components/common/FilterSelect';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Tooltip } from '../../../components/common/Tooltip';
import type { Space } from '../../space/types/space';
import { spaceApi } from '../../space/api/spaceApi';
import { formatImageUrl } from '../../../utils/imageUrl';
import { staffApi } from '../api/staffApi';
import { ApproveBookingModalKT } from '../components/ApproveBookingModalKT';
import { BulkBookingActionModalKT } from '../components/BulkBookingActionModalKT';
import { RejectBookingConfirmModalKT } from '../components/RejectBookingConfirmModalKT';
import type { BookingStatus, StaffBooking } from '../types/staff';
import './BookingManagementPageKT.css';

type BookingTab = 'pending' | 'checkin' | 'all';
type ConfirmAction =
  | { type: 'approve' | 'checkin'; booking: StaffBooking }
  | { type: 'bulk-approve'; bookings: StaffBooking[] }
  | null;

const STATUS_OPTIONS: Array<{ value: BookingStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'CONFIRMED', label: 'Chờ check-in' },
  { value: 'CHECKED_IN', label: 'Đã check-in' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'EXPIRED', label: 'Hết hạn duyệt' },
  { value: 'NO_SHOW', label: 'Vắng mặt' },
];

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};

const formatTime = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

const bookingCode = (booking: StaffBooking) => {
  return booking.bookingCode || 'Chưa có mã';
};

const initials = (name?: string) => {
  if (!name?.trim()) return 'SV';
  const words = name.trim().split(/\s+/);
  return `${words[0]?.[0] || ''}${words[words.length - 1]?.[0] || ''}`.toUpperCase();
};

const getBookingMode = (booking: StaffBooking, space?: Space) => {
  if (booking.tableId) return 'PER_TABLE';
  if (booking.selectedSeats?.length) return 'PER_SEAT';
  return booking.bookingMode || space?.bookingMode || space?.spaceType?.bookingMode || 'WHOLE_SPACE';
};

const modeLabel = (mode: string) => {
  if (mode === 'PER_TABLE') return 'Theo bàn';
  if (mode === 'PER_SEAT') return 'Theo ghế';
  return 'Nguyên phòng';
};

const formatFloor = (floor?: string) => {
  const value = floor?.trim();
  if (!value) return '';
  return /^tầng\b/i.test(value) ? value : `Tầng ${value}`;
};

const getPrimarySpaceImage = (space?: Space) => {
  const primaryImage = space?.images?.find((image) => image.isPrimary || image.primary);
  return formatImageUrl(space?.primaryImageUrl || primaryImage?.imageUrl);
};

const wasHandledByStaff = (booking: StaffBooking) => {
  if (booking.status === 'REJECTED') return true;
  return ['CHECKED_IN', 'COMPLETED'].includes(booking.status)
    && booking.checkedInBy != null
    && booking.checkedInBy !== booking.studentId;
};

const getBackendMessage = (error: any) => error?.response?.data?.message
  || error?.message
  || 'Không nhận được phản hồi từ máy chủ.';

export const BookingManagementPageKT = () => {
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeTab, setActiveTab] = useState<BookingTab>('pending');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [spaceFilter, setSpaceFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<StaffBooking | null>(null);
  const [bulkRejectingBookings, setBulkRejectingBookings] = useState<StaffBooking[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<number>>(() => new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [now, setNow] = useState(() => new Date());

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingData, spaceData] = await Promise.all([
        staffApi.getBookings(),
        spaceApi.getAllSpaces().catch(() => []),
      ]);
      setBookings(bookingData);
      setSpaces(spaceData);
    } catch (requestError: any) {
      const message = requestError?.response?.data?.message
        || requestError?.message
        || 'Không thể tải danh sách booking.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial synchronization with the Staff booking API.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      selectedBookingId == null
      || confirmAction != null
      || rejectingBooking != null
      || bulkRejectingBookings.length > 0
    ) return;

    const previousOverflow = document.body.style.overflow;
    const closeDetailOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedBookingId(null);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeDetailOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeDetailOnEscape);
    };
  }, [selectedBookingId, confirmAction, rejectingBooking, bulkRejectingBookings.length]);

  const spaceById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  );
  const spaceCodeById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space.spaceCode])),
    [spaces],
  );

  const todayKey = toDateKey(now.toISOString());
  const pendingCount = bookings.filter((booking) => booking.status === 'PENDING_APPROVAL').length;
  const waitingCheckInCount = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const checkedInTodayCount = bookings.filter(
    (booking) => booking.status === 'CHECKED_IN' && toDateKey(booking.checkedInAt) === todayKey,
  ).length;
  const todayBookingCount = bookings.filter((booking) => toDateKey(booking.startTime) === todayKey).length;

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (activeTab === 'pending' && booking.status !== 'PENDING_APPROVAL') return false;
      if (activeTab === 'checkin' && booking.status !== 'CONFIRMED') return false;
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) return false;
      if (dateFilter && toDateKey(booking.startTime) !== dateFilter) return false;
      if (spaceFilter !== 'ALL' && booking.spaceId !== Number(spaceFilter)) return false;

      const space = spaceById.get(booking.spaceId);
      if (modeFilter !== 'ALL' && getBookingMode(booking, space) !== modeFilter) return false;

      if (normalizedSearch) {
        const haystack = [
          bookingCode(booking),
          booking.studentName,
          booking.studentEmail,
          booking.spaceName,
          space?.spaceCode,
          booking.purpose,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [bookings, activeTab, statusFilter, dateFilter, spaceFilter, modeFilter, searchQuery, spaceById]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleBookings = filteredBookings.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visiblePendingBookings = visibleBookings.filter((booking) => booking.status === 'PENDING_APPROVAL');
  const selectedPendingBookings = bookings.filter(
    (booking) => booking.status === 'PENDING_APPROVAL' && selectedPendingIds.has(booking.id),
  );
  const allVisiblePendingSelected = visiblePendingBookings.length > 0
    && visiblePendingBookings.every((booking) => selectedPendingIds.has(booking.id));
  const selectedBooking = selectedBookingId == null
    ? null
    : bookings.find((booking) => booking.id === selectedBookingId) ?? null;
  const selectedSpace = selectedBooking ? spaceById.get(selectedBooking.spaceId) : undefined;
  const selectedSpacePrimaryImage = getPrimarySpaceImage(selectedSpace);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'bulk-approve') {
        const response = await staffApi.bulkApproveBookings(
          confirmAction.bookings.map((booking) => booking.id),
        );
        const successIds = response.successfulBookings.map((booking) => booking.id);

        setSelectedPendingIds((current) => {
          const next = new Set(current);
          successIds.forEach((id) => next.delete(id));
          return next;
        });

        if (response.failureCount > 0) {
          showToast(response.message || 'Không thể duyệt toàn bộ booking đã chọn.', 'error');
        } else {
          showToast(response.message || `Đã duyệt thành công ${response.successCount} booking.`);
        }
      } else if (confirmAction.type === 'approve') {
        const response = await staffApi.approveBooking(confirmAction.booking.id);
        showToast(response.message || 'Duyệt đặt phòng thành công');
      } else {
        await staffApi.staffAssistedCheckIn(confirmAction.booking.id);
      }
      setConfirmAction(null);
      await loadData();
    } catch (actionError: any) {
      showToast(getBackendMessage(actionError), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    const targetBookings = bulkRejectingBookings.length > 0
      ? bulkRejectingBookings
      : rejectingBooking ? [rejectingBooking] : [];
    if (targetBookings.length === 0) return;
    setActionLoading(true);
    try {
      if (targetBookings.length === 1) {
        const response = await staffApi.rejectBooking(targetBookings[0].id, reason);
        setSelectedPendingIds((current) => {
          const next = new Set(current);
          next.delete(targetBookings[0].id);
          return next;
        });
        setRejectingBooking(null);
        setBulkRejectingBookings([]);
        await loadData();
        showToast(response.message || 'Từ chối đặt phòng thành công');
        return;
      }

      const response = await staffApi.bulkRejectBookings(
        targetBookings.map((booking) => booking.id),
        reason,
      );
      const successIds = new Set(response.successfulBookings.map((booking) => booking.id));
      const failedIds = new Set(response.failedBookings.map((booking) => booking.bookingId));
      const failed = targetBookings.filter((booking) => failedIds.has(booking.id));

      setSelectedPendingIds((current) => {
        const next = new Set(current);
        successIds.forEach((id) => next.delete(id));
        return next;
      });
      await loadData();
      if (response.failureCount > 0) {
        setBulkRejectingBookings(failed);
        throw new Error(response.message || 'Không thể từ chối toàn bộ booking đã chọn.');
      }

      setRejectingBooking(null);
      setBulkRejectingBookings([]);
      showToast(response.message || `Đã từ chối thành công ${response.successCount} booking.`);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePendingBooking = (bookingId: number) => {
    setSelectedPendingIds((current) => {
      const next = new Set(current);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  const toggleVisiblePendingBookings = () => {
    setSelectedPendingIds((current) => {
      const next = new Set(current);
      visiblePendingBookings.forEach((booking) => {
        if (allVisiblePendingSelected) next.delete(booking.id);
        else next.add(booking.id);
      });
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setSpaceFilter('ALL');
    setModeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const changeTab = (tab: BookingTab) => {
    setActiveTab(tab);
    setStatusFilter('ALL');
    setCurrentPage(1);
    setSelectedBookingId(null);
    setSelectedPendingIds(new Set());
  };

  return (
    <div className="booking-management-page">
      <header className="booking-page-header">
        <div className="booking-page-title">
          <div>
            <h1>Quản lý booking</h1>
            <p>Duyệt, từ chối và hỗ trợ check-in cho các yêu cầu đặt chỗ</p>
          </div>
        </div>
      </header>

      <section className="booking-stat-grid" aria-label="Thống kê booking">
        <article className="booking-stat-card stat-pending">
          <div className="booking-stat-top-row">
            <span className="booking-stat-label">Chờ duyệt</span>
            <span className="booking-stat-icon"><Clock3 size={22} strokeWidth={2.2} /></span>
          </div>
          <div className="booking-stat-value-row"><strong>{pendingCount}</strong></div>
        </article>
        <article className="booking-stat-card stat-confirmed">
          <div className="booking-stat-top-row">
            <span className="booking-stat-label">Chờ check-in</span>
            <span className="booking-stat-icon"><UsersRound size={22} strokeWidth={2.2} /></span>
          </div>
          <div className="booking-stat-value-row"><strong>{waitingCheckInCount}</strong></div>
        </article>
        <article className="booking-stat-card stat-checked-in">
          <div className="booking-stat-top-row">
            <span className="booking-stat-label">Đã check-in hôm nay</span>
            <span className="booking-stat-icon"><CheckCircle2 size={22} strokeWidth={2.2} /></span>
          </div>
          <div className="booking-stat-value-row"><strong>{checkedInTodayCount}</strong></div>
        </article>
        <article className="booking-stat-card stat-total">
          <div className="booking-stat-top-row">
            <span className="booking-stat-label">Tổng booking hôm nay</span>
            <span className="booking-stat-icon"><CalendarDays size={22} strokeWidth={2.2} /></span>
          </div>
          <div className="booking-stat-value-row"><strong>{todayBookingCount}</strong></div>
        </article>
      </section>

      <div className="booking-workspace">
        <main className="booking-list-panel">
          <nav className="booking-tabs" aria-label="Phân loại booking">
            <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => changeTab('pending')} type="button">
              Chờ duyệt <span>{pendingCount}</span>
            </button>
            <button className={activeTab === 'checkin' ? 'active' : ''} onClick={() => changeTab('checkin')} type="button">
              Chờ check-in <span>{waitingCheckInCount}</span>
            </button>
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => changeTab('all')} type="button">
              Tất cả booking <span>{bookings.length}</span>
            </button>
          </nav>

          <div className="booking-filter-bar">
            <label className="booking-search-field">
              <Search size={17} />
              <input
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
                placeholder="Tìm mã booking, sinh viên, không gian..."
              />
            </label>
            <label className="booking-filter-field">
              <input
                type="date"
                value={dateFilter}
                aria-label="Ngày sử dụng"
                title="Ngày sử dụng"
                onChange={(event) => { setDateFilter(event.target.value); setCurrentPage(1); }}
              />
            </label>
            <label className="booking-filter-field">
              <FilterSelect
                value={spaceFilter}
                ariaLabel="Không gian"
                options={[
                  { value: 'ALL', label: 'Tất cả không gian' },
                  ...spaces.map((space) => ({ value: String(space.id), label: `${space.spaceCode} — ${space.name}` })),
                ]}
                onChange={(value) => { setSpaceFilter(value); setCurrentPage(1); }}
              />
            </label>
            <label className="booking-filter-field">
              <FilterSelect
                value={modeFilter}
                ariaLabel="Hình thức đặt"
                options={[
                  { value: 'ALL', label: 'Tất cả hình thức' },
                  { value: 'WHOLE_SPACE', label: 'Nguyên phòng' },
                  { value: 'PER_TABLE', label: 'Theo bàn' },
                  { value: 'PER_SEAT', label: 'Theo ghế' },
                ]}
                onChange={(value) => { setModeFilter(value); setCurrentPage(1); }}
              />
            </label>
            <label className="booking-filter-field">
              <FilterSelect
                value={statusFilter}
                ariaLabel="Trạng thái"
                options={STATUS_OPTIONS}
                onChange={(value) => { setStatusFilter(value as BookingStatus | 'ALL'); setCurrentPage(1); }}
              />
            </label>
            <button
              className="booking-refresh-btn"
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              aria-label="Làm mới danh sách booking"
              title="Làm mới"
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {selectedPendingBookings.length > 0 && (
            <div className="booking-bulk-bar" role="toolbar" aria-label="Thao tác booking đã chọn">
              <span>Đã chọn <strong>{selectedPendingBookings.length}</strong> booking chờ duyệt</span>
              <div>
                <button
                  type="button"
                  className="bulk-approve"
                  disabled={actionLoading}
                  onClick={() => setConfirmAction({ type: 'bulk-approve', bookings: selectedPendingBookings })}
                >
                  <Check size={16} /> Duyệt đã chọn
                </button>
                <button
                  type="button"
                  className="bulk-reject"
                  disabled={actionLoading}
                  onClick={() => {
                    setRejectingBooking(null);
                    setBulkRejectingBookings(selectedPendingBookings);
                  }}
                >
                  <X size={16} /> Từ chối đã chọn
                </button>
                <button
                  type="button"
                  className="bulk-clear"
                  disabled={actionLoading}
                  onClick={() => setSelectedPendingIds(new Set())}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="booking-error-banner">
              <span>{error}</span>
              <button type="button" onClick={() => loadData()}>Thử lại</button>
            </div>
          )}

          {!loading && !error && filteredBookings.length === 0 && (
            <div className="booking-empty-state">
              <CalendarCheck2 size={36} />
              <h3>Không có booking phù hợp</h3>
              <p>Thử thay đổi bộ lọc hoặc làm mới dữ liệu.</p>
              <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
            </div>
          )}

          {loading ? (
            <div className="booking-loading-state"><span className="booking-loader" /><p>Đang tải dữ liệu booking...</p></div>
          ) : filteredBookings.length > 0 && (
            <>
              <div className="booking-table-wrap">
                <table className="booking-management-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="booking-select-code">
                          <input
                            type="checkbox"
                            checked={allVisiblePendingSelected}
                            disabled={visiblePendingBookings.length === 0}
                            aria-label="Chọn tất cả booking chờ duyệt trên trang này"
                            title="Chọn tất cả booking chờ duyệt trên trang này"
                            onChange={toggleVisiblePendingBookings}
                          />
                          <span>Mã đặt chỗ</span>
                        </div>
                      </th>
                      <th>Sinh viên</th>
                      <th>Không gian</th>
                      <th>Thời gian</th>
                      <th>Hình thức</th>
                      <th>Mục đích</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBookings.map((booking) => {
                      const space = spaceById.get(booking.spaceId);
                      const mode = getBookingMode(booking, space);
                      return (
                        <tr
                          key={booking.id}
                          className={selectedBookingId === booking.id ? 'selected' : ''}
                          onClick={() => setSelectedBookingId(booking.id)}
                        >
                          <td>
                            <div className="booking-select-code">
                              {booking.status === 'PENDING_APPROVAL' ? (
                                <input
                                  type="checkbox"
                                  checked={selectedPendingIds.has(booking.id)}
                                  aria-label={`Chọn ${bookingCode(booking)}`}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={() => togglePendingBooking(booking.id)}
                                />
                              ) : <span className="booking-checkbox-placeholder" />}
                              <strong className="booking-code">{bookingCode(booking)}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="booking-student-cell">
                              <span className="booking-avatar small">{initials(booking.studentName)}</span>
                              <span>
                                <Tooltip content={booking.studentName || 'Sinh viên'} maxWidth={320} onlyWhenOverflow>
                                  <strong>{booking.studentName || 'Sinh viên'}</strong>
                                </Tooltip>
                                <Tooltip content={booking.studentEmail} maxWidth={360} onlyWhenOverflow>
                                  <small>{booking.studentEmail}</small>
                                </Tooltip>
                              </span>
                            </div>
                          </td>
                          <td><strong>{space?.spaceCode || booking.spaceName}</strong><small>{booking.spaceName}<br />{booking.building} {booking.floor ? `• ${formatFloor(booking.floor)}` : ''}</small></td>
                          <td><strong>{formatDate(booking.startTime)}</strong><small>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</small></td>
                          <td><span className={`booking-mode-badge mode-${mode.toLowerCase()}`}>{modeLabel(mode)}</span></td>
                          <td>
                            <Tooltip content={booking.purpose || '—'} maxWidth={440} onlyWhenOverflow>
                              <span className="booking-purpose">{booking.purpose || '—'}</span>
                            </Tooltip>
                          </td>
                          <td><StatusBadge status={booking.status} size="sm" /></td>
                          <td>
                            <div className="booking-row-actions">
                              {booking.status === 'PENDING_APPROVAL' && (
                                <>
                                  <button
                                    className="booking-action approve"
                                    type="button"
                                    aria-label={`Duyệt ${bookingCode(booking)}`}
                                    title="Duyệt booking"
                                    onClick={(event) => { event.stopPropagation(); setConfirmAction({ type: 'approve', booking }); }}
                                  ><Check size={17} /></button>
                                  <button
                                    className="booking-action reject"
                                    type="button"
                                    aria-label={`Từ chối ${bookingCode(booking)}`}
                                    title="Từ chối booking"
                                    onClick={(event) => { event.stopPropagation(); setRejectingBooking(booking); }}
                                  ><X size={17} /></button>
                                </>
                              )}
                              {booking.status === 'CONFIRMED' && (
                                <button
                                  className="booking-action checkin"
                                  type="button"
                                  disabled={!booking.canCheckIn}
                                  title={booking.canCheckIn ? 'Xác nhận sinh viên đã có mặt' : 'Chưa nằm trong cửa sổ check-in'}
                                  onClick={(event) => { event.stopPropagation(); setConfirmAction({ type: 'checkin', booking }); }}
                                ><CheckCircle2 size={15} /> Check-in</button>
                              )}
                              {!['PENDING_APPROVAL', 'CONFIRMED'].includes(booking.status) && (
                                <span className="booking-no-action">
                                  {wasHandledByStaff(booking) ? 'Đã xử lý' : '—'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={filteredBookings.length}
                currentPage={safePage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(value) => { setPageSize(value); setCurrentPage(1); }}
                itemLabel="booking"
              />
            </>
          )}
        </main>

        {selectedBooking && (
          <div
            className="booking-detail-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedBookingId(null);
            }}
          >
            <aside
              className="booking-detail-panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Chi tiết booking ${bookingCode(selectedBooking)}`}
            >
              <div className="booking-detail-header">
                <div><strong>{bookingCode(selectedBooking)}</strong></div>
                <div className="booking-detail-heading-actions">
                  <button
                    type="button"
                    className="booking-detail-close"
                    aria-label="Đóng chi tiết đặt chỗ"
                    title="Đóng chi tiết"
                    onClick={() => setSelectedBookingId(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <section className="booking-detail-section booking-student-section">
                <h3>Thông tin sinh viên</h3>
                <div className="booking-student-profile">
                  <span className="booking-avatar small">{initials(selectedBooking.studentName)}</span>
                  <div><strong>{selectedBooking.studentName || 'Sinh viên'}</strong><span><Mail size={14} /> {selectedBooking.studentEmail || 'Chưa có email'}</span></div>
                </div>
              </section>

              <section className="booking-detail-section booking-reservation-section">
                <h3>Thông tin đặt chỗ</h3>
                <div className="booking-space-summary">
                  {selectedSpacePrimaryImage ? (
                    <img src={selectedSpacePrimaryImage} alt={selectedBooking.spaceName} />
                  ) : (
                    <span className="booking-space-placeholder"><Building2 size={24} /></span>
                  )}
                  <div>
                    <strong>{selectedSpace?.spaceCode || selectedBooking.spaceName}</strong>
                    <span>{selectedBooking.spaceName}</span>
                    <span><MapPin size={13} /> {selectedBooking.building || 'Chưa cập nhật'} {selectedBooking.floor ? `• ${formatFloor(selectedBooking.floor)}` : ''}</span>
                    <em>{modeLabel(getBookingMode(selectedBooking, selectedSpace))}</em>
                  </div>
                </div>
                <div className="booking-detail-list">
                  <div className="booking-detail-time"><CalendarDays size={17} /><span><small>Thời gian</small><strong>{formatDate(selectedBooking.startTime)} · {formatTime(selectedBooking.startTime)} – {formatTime(selectedBooking.endTime)}</strong></span></div>
                  <div className="booking-detail-purpose"><Target size={17} /><span><small>Mục đích</small><strong>{selectedBooking.purpose || 'Chưa cung cấp'}</strong></span></div>
                  {getBookingMode(selectedBooking, selectedSpace) !== 'PER_SEAT' && (
                    <div className="booking-detail-participants"><UsersRound size={17} /><span><small>Số người tham gia</small><strong>{selectedBooking.participantCount} người</strong></span></div>
                  )}
                  {selectedBooking.tableCode && <div className="booking-detail-table"><DoorOpen size={17} /><span><small>Bàn đã chọn</small><strong>{selectedBooking.tableCode}</strong></span></div>}
                  {!!selectedBooking.selectedSeats?.length && <div className="booking-detail-seats"><UserRound size={17} /><span><small>Ghế đã chọn</small><strong>{selectedBooking.selectedSeats.join(', ')}</strong></span></div>}
                </div>
              </section>

              <section className="booking-detail-section">
                <h3>Thông tin khác</h3>
                <dl className="booking-meta-list">
                  <div><dt>Thời gian đặt</dt><dd>{formatDateTime(selectedBooking.createdAt)}</dd></div>
                  <div><dt>Trạng thái</dt><dd><StatusBadge status={selectedBooking.status} size="sm" /></dd></div>
                  {selectedBooking.checkedInAt && <div><dt>Đã check-in lúc</dt><dd>{formatDateTime(selectedBooking.checkedInAt)}</dd></div>}
                  {selectedBooking.rejectReason && <div><dt>Lý do từ chối</dt><dd>{selectedBooking.rejectReason}</dd></div>}
                  {selectedBooking.expireReason && <div><dt>Lý do hết hạn</dt><dd>{selectedBooking.expireReason}</dd></div>}
                </dl>
              </section>

              {(selectedBooking.status === 'PENDING_APPROVAL' || selectedBooking.status === 'CONFIRMED') && (
                <section className="booking-detail-actions">
                  {selectedBooking.status === 'PENDING_APPROVAL' && (
                    <div>
                      <button type="button" className="approve" onClick={() => setConfirmAction({ type: 'approve', booking: selectedBooking })}><Check size={18} /> Duyệt yêu cầu</button>
                      <button type="button" className="reject" onClick={() => setRejectingBooking(selectedBooking)}><X size={18} /> Từ chối yêu cầu</button>
                    </div>
                  )}
                  {selectedBooking.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      className="checkin"
                      disabled={!selectedBooking.canCheckIn}
                      onClick={() => setConfirmAction({ type: 'checkin', booking: selectedBooking })}
                    ><CheckCircle2 size={18} /> {selectedBooking.canCheckIn ? 'Hỗ trợ check-in' : 'Chưa đến thời gian check-in'}</button>
                  )}
                </section>
              )}
            </aside>
          </div>
        )}
      </div>

      {toast && <div className={`booking-toast ${toast.type}`}>{toast.text}</div>}

      <ApproveBookingModalKT
        isOpen={confirmAction?.type === 'approve'}
        booking={confirmAction?.type === 'approve' ? confirmAction.booking : null}
        space={confirmAction?.type === 'approve' ? spaceById.get(confirmAction.booking.spaceId) : undefined}
        isLoading={actionLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmDialog
        isOpen={confirmAction?.type === 'checkin'}
        title="Xác nhận check-in?"
        message={confirmAction?.type === 'checkin'
          ? `${bookingCode(confirmAction.booking)} · ${confirmAction.booking.studentName} · ${confirmAction.booking.spaceName}`
          : ''}
        confirmText="Xác nhận check-in"
        isDanger={false}
        isLoading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <BulkBookingActionModalKT
        isOpen={confirmAction?.type === 'bulk-approve'}
        action="approve"
        bookings={confirmAction?.type === 'bulk-approve' ? confirmAction.bookings : []}
        spaceCodeById={spaceCodeById}
        isLoading={actionLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <BulkBookingActionModalKT
        isOpen={bulkRejectingBookings.length > 0}
        action="reject"
        bookings={bulkRejectingBookings}
        spaceCodeById={spaceCodeById}
        isLoading={actionLoading}
        onClose={() => setBulkRejectingBookings([])}
        onConfirm={(reason) => handleReject(reason || '')}
      />

      <RejectBookingConfirmModalKT
        isOpen={rejectingBooking != null}
        booking={rejectingBooking}
        space={rejectingBooking ? spaceById.get(rejectingBooking.spaceId) : undefined}
        isLoading={actionLoading}
        onClose={() => setRejectingBooking(null)}
        onConfirm={handleReject}
      />
    </div>
  );
};

export default BookingManagementPageKT;
