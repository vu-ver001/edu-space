// Trang tìm kiếm và kiểm tra khả dụng phòng học thời gian thực (Module M04 - Khánh Vân).
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterBar } from '../components/FilterBar';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';
import { formatMessageDatesVI } from '../components/DateInputVI';
import type { SearchFilter, Space } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import './SearchSpacesPage.css';
import '../components/MaintenanceModal.css';

// Số dòng hiển thị thẻ phòng học trên mỗi trang phân trang.
const SPACE_ROWS_PER_PAGE = 4;

// Trích xuất các tham số bộ lọc tìm kiếm từ địa chỉ URL của trình duyệt.
const readFilterFromUrl = (params: URLSearchParams): SearchFilter => {
  const participant = Number(params.get('participantCount'));
  const spaceTypeId = Number(params.get('spaceTypeId'));
  const facilityIds = (params.get('facilityIds') || '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);

  return {
    date: params.get('date') || '',
    startTime: params.get('startTime') || '',
    endTime: params.get('endTime') || '',
    participantCount: Number.isFinite(participant) && participant > 0 ? participant : undefined,
    spaceTypeId: Number.isFinite(spaceTypeId) && spaceTypeId > 0 ? spaceTypeId : undefined,
    facilityIds: facilityIds.length ? facilityIds : undefined,
  };
};

// Đồng bộ các tiêu chí bộ lọc tìm kiếm lên tham số địa chỉ URL của trình duyệt.
const writeFilterToUrl = (filter: SearchFilter): URLSearchParams => {
  const params = new URLSearchParams();
  if (filter.date) params.set('date', filter.date);
  if (filter.startTime) params.set('startTime', filter.startTime);
  if (filter.endTime) params.set('endTime', filter.endTime);
  if (filter.participantCount) params.set('participantCount', String(filter.participantCount));
  if (filter.spaceTypeId) params.set('spaceTypeId', String(filter.spaceTypeId));
  if (filter.facilityIds?.length) params.set('facilityIds', filter.facilityIds.join(','));
  return params;
};

// Sắp xếp các không gian học tập theo mức độ tối ưu với số lượng người tham gia.
const sortSpacesBySuitability = (items: Space[], participantCount?: number): Space[] => {
  const requested = participantCount && participantCount > 0 ? participantCount : undefined;
  const modeRank = (space: Space) => {
    if (!requested) return 0;
    const mode = space.bookingMode || space.spaceType?.bookingMode || 'WHOLE_SPACE';
    if (requested === 1) return mode === 'PER_SEAT' ? 0 : mode === 'PER_TABLE' ? 1 : 2;
    if (requested && requested > 1) return mode === 'PER_TABLE' ? 0 : mode === 'WHOLE_SPACE' ? 1 : 2;
    return 0;
  };

  return [...items].sort((left, right) => {
    const byMode = modeRank(left) - modeRank(right);
    if (byMode !== 0) return byMode;

    if (requested) {
      const leftWaste = Math.max(0, Number(left.capacity) - requested);
      const rightWaste = Math.max(0, Number(right.capacity) - requested);
      if (leftWaste !== rightWaste) return leftWaste - rightWaste;
    }

    const leftApproval = left.requiresApproval ?? left.spaceType?.requiresApproval ?? true;
    const rightApproval = right.requiresApproval ?? right.spaceType?.requiresApproval ?? true;
    if (leftApproval !== rightApproval) return leftApproval ? 1 : -1;

    const byCapacity = Number(left.capacity) - Number(right.capacity);
    if (byCapacity !== 0) return byCapacity;
    return left.name.localeCompare(right.name, 'vi', { numeric: true, sensitivity: 'base' });
  });
};

// Kiểm tra sự phù hợp giữa số người nhập vào với chế độ đặt chỗ của không gian.
const matchesParticipantBookingMode = (space: Space, participantCount?: number): boolean => {
  const count = Math.max(1, Number(participantCount) || 1);
  const bookingMode = space.bookingMode || space.spaceType?.bookingMode;

  if (bookingMode === 'WHOLE_SPACE') return Number(space.capacity) >= count;
  if (bookingMode === 'PER_SEAT') return count === 1;
  return bookingMode === 'PER_TABLE' && Number(space.capacity) >= count;
};

// Component trang tìm kiếm phòng học và hiển thị kết quả khả dụng thời gian thực.
export const SearchSpacesPage: React.FC = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>(() => readFilterFromUrl(urlSearchParams));
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState<Space | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cardsPerRow, setCardsPerRow] = useState<number>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 1 : 3
  );

  // Gọi API backend kiểm tra tính khả dụng của phòng học và loại bỏ lịch bảo trì xung đột.
  const fetchSpaces = (filter: SearchFilter = activeFilter) => {
    setCurrentPage(1);
    setLoading(true);
    setError(null);

    // Kiểm tra tính hợp lệ của khoảng thời gian bắt đầu và kết thúc.
    if (filter.startTime && filter.endTime && filter.startTime >= filter.endTime) {
      setError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      setSpaces([]);
      setLoading(false);
      return;
    }

    // Ghép chuỗi ngày giờ thành định dạng ISO 8601.
    const toIso = (dateStr: string, timeStr: string) => {
      const parts = (timeStr || '').trim().split(':');
      const h = (parts[0] || '08').padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const sec = (parts[2] || '00').padStart(2, '0');
      return `${dateStr}T${h}:${m}:${sec}`;
    };

    // Chuyển chuỗi thời gian sang mili-giây để so sánh phạm vi xung đột.
    const parseMs = (timeStr?: string) => {
      if (!timeStr) return 0;
      const formatted = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T');
      const d = new Date(formatted);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    // Thuật toán kiểm tra lịch bảo trì giao cắt với khung giờ tìm kiếm của sinh viên.
    const isMaintenanceConflict = (s: Space): boolean => {
      if (s.status === 'MAINTENANCE') return true;
      if (!filter.date || !filter.startTime || !filter.endTime) return false;

      const searchStartMs = parseMs(toIso(filter.date, filter.startTime));
      const searchEndMs = parseMs(toIso(filter.date, filter.endTime));

      if (!searchStartMs || !searchEndMs || searchStartMs >= searchEndMs) {
        return false;
      }

      const durationMs = searchEndMs - searchStartMs;
      const isShortSearch = durationMs <= 180 * 60 * 1000;

      // Gom tất cả các khoảng thời gian bảo trì trùng với khoảng tìm kiếm.
      const maintRanges: { start: number; end: number }[] = [];
      const addMaint = (startStr?: string, endStr?: string) => {
        const mStart = parseMs(startStr);
        const mEnd = parseMs(endStr);
        if (mStart && mEnd && searchStartMs < mEnd && searchEndMs > mStart) {
          maintRanges.push({
            start: Math.max(searchStartMs, mStart),
            end: Math.min(searchEndMs, mEnd),
          });
        }
      };

      if (s.nextMaintenance) {
        addMaint(s.nextMaintenance.startTime, s.nextMaintenance.endTime);
      }
      if (s.upcomingMaintenances && s.upcomingMaintenances.length > 0) {
        s.upcomingMaintenances.forEach((m) => addMaint(m.startTime, m.endTime));
      }

      if (maintRanges.length === 0) return false;

      // Nếu tìm kiếm khung giờ ngắn (dưới 3h) mà vướng bảo trì thì ẩn phòng hoàn toàn.
      if (isShortSearch) {
        return true;
      }

      // Hợp nhất các khoảng bảo trì liên tiếp để kiểm tra khe trống tối thiểu 30 phút.
      maintRanges.sort((a, b) => a.start - b.start);
      const merged: { start: number; end: number }[] = [];
      for (const r of maintRanges) {
        if (merged.length === 0) {
          merged.push({ ...r });
        } else {
          const last = merged[merged.length - 1];
          if (r.start <= last.end) {
            last.end = Math.max(last.end, r.end);
          } else {
            merged.push({ ...r });
          }
        }
      }

      let currentCursor = searchStartMs;
      let hasAvailableGap = false;
      const minSlotMs = 30 * 60 * 1000;

      for (const m of merged) {
        if (m.start - currentCursor >= minSlotMs) {
          hasAvailableGap = true;
          break;
        }
        if (m.end > currentCursor) {
          currentCursor = m.end;
        }
      }
      if (!hasAvailableGap && searchEndMs - currentCursor >= minSlotMs) {
        hasAvailableGap = true;
      }

      return !hasAvailableGap;
    };

    // Thực hiện truy vấn danh sách phòng trống khả dụng từ spaceService.
    spaceService
      .searchAvailableSpaces(filter)
      .then((data) => {
        let filtered = data.filter(
          (s) => !isMaintenanceConflict(s)
            && (!filter.participantCount || matchesParticipantBookingMode(s, filter.participantCount))
        );

        if (filter.facilityIds && filter.facilityIds.length > 0) {
          filtered = filtered.filter((s) => {
            if (s.facilityIds && s.facilityIds.length > 0) {
              return filter.facilityIds!.every((fid) => s.facilityIds!.includes(fid));
            }
            return true;
          });
        }
        setSpaces(sortSpacesBySuitability(filtered, filter.participantCount));
      })
      .catch((err) => {
        const serverMsg = formatMessageDatesVI(err?.response?.data?.message);
        const errCode = err?.response?.data?.code;

        if (err?.response?.status === 400 || errCode === 'INVALID_TIME_RANGE') {
          setError(serverMsg || 'Thời gian bắt đầu phải trước thời gian kết thúc.');
          setSpaces([]);
          return;
        }

        setSpaces([]);
        setError(serverMsg || 'Không thể kết nối đến máy chủ để kiểm tra phòng phù hợp.');
      })
      .finally(() => setLoading(false));
  };

  // Khôi phục bộ lọc từ URL và nạp dữ liệu không gian khi mở trang.
  useEffect(() => {
    fetchSpaces(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lắng nghe sự kiện chuyển đổi tài khoản người dùng để tải lại kết quả tìm kiếm.
  useEffect(() => {
    const handleUserSwitch = () => {
      fetchSpaces(activeFilter);
    };
    window.addEventListener('user-switched', handleUserSwitch);
    return () => window.removeEventListener('user-switched', handleUserSwitch);
  }, [activeFilter]);

  // Cập nhật số thẻ trên mỗi dòng theo kích thước màn hình hiển thị.
  useEffect(() => {
    const mobileLayout = window.matchMedia('(max-width: 768px)');
    const syncCardsPerRow = () => setCardsPerRow(mobileLayout.matches ? 1 : 3);

    syncCardsPerRow();
    mobileLayout.addEventListener('change', syncCardsPerRow);
    return () => mobileLayout.removeEventListener('change', syncCardsPerRow);
  }, []);

  // Kích hoạt tìm kiếm mới khi người dùng áp dụng bộ lọc từ thanh FilterBar.
  const handleSearch = (filter: SearchFilter) => {
    setHasSearched(true);
    setActiveFilter(filter);
    setUrlSearchParams(writeFilterToUrl(filter), { replace: true });
    fetchSpaces(filter);
  };

  // Xử lý thông báo và tải lại danh sách khi hoàn tất tạo đơn đặt phòng.
  const handleBookingSuccess = () => {
    setSelectedSpaceForBooking(null);
    setToastMessage('✓ Đặt không gian thành công! Đã cập nhật vào hệ thống.');
    setTimeout(() => setToastMessage(null), 4000);
    fetchSpaces(activeFilter);
  };

  // Chuyển đổi định dạng ngày YYYY-MM-DD sang dd/MM/yyyy để hiển thị thanh kết quả.
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Tính toán số lượng phòng khả dụng và các thông số phân trang.
  const availableCount = spaces.filter((s) => s.isAvailable ?? (s.status === 'AVAILABLE')).length;
  const displayDate = formatDisplayDate(activeFilter.date);
  const displayStart = activeFilter.startTime ? activeFilter.startTime.substring(0, 5) : '';
  const displayEnd = activeFilter.endTime ? activeFilter.endTime.substring(0, 5) : '';
  const hasAnyFilter = Boolean(
    activeFilter.date
    || activeFilter.startTime
    || activeFilter.endTime
    || activeFilter.participantCount
    || activeFilter.spaceTypeId
    || activeFilter.facilityIds?.length
  );
  const pageSize = SPACE_ROWS_PER_PAGE * cardsPerRow;
  const totalPages = Math.max(1, Math.ceil(spaces.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedSpaces = spaces.slice(pageStartIndex, pageStartIndex + pageSize);

  // Đặt lại số trang về 1 khi số lượng thẻ trên trang thay đổi.
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Đảm bảo chỉ số trang hợp lệ không vượt quá tổng số trang.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Xử lý chuyển trang và cuộn giao diện lên đầu danh sách phòng.
  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      document.querySelector('.rooms-grid-v1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Tạo danh sách trang phân trang dạng nút bấm và dấu ba chấm.
  const getPaginationItems = (): Array<number | string> => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (safeCurrentPage <= 3) return [1, 2, 3, 4, 'end-dots', totalPages];
    if (safeCurrentPage >= totalPages - 2) {
      return [1, 'start-dots', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'start-dots', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'end-dots', totalPages];
  };

  return (
    // Khung chứa toàn bộ trang tìm kiếm không gian học tập
    <div className="search-spaces-page">
      {/* Toast thông báo đặt phòng thành công */}
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Tiêu đề giới thiệu chức năng tìm kiếm không gian học tập */}
      <div className="portal-page-intro">
        <h2 className="portal-page-main-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
            <path d="M8.5 11h5M11 8.5v5" opacity="0.75" />
          </svg>
          Tìm không gian
        </h2>
        <p className="portal-page-sub-heading">Tìm kiếm phòng học, phòng họp phù hợp với nhu cầu</p>
      </div>

      {/* Thanh bộ lọc tìm kiếm theo ngày, giờ, số người và tiện ích */}
      <FilterBar
        onSearch={handleSearch}
        isLoading={loading}
        availableCount={hasSearched ? availableCount : undefined}
        initialFilter={activeFilter}
      />

      {/* Thanh thông báo kết quả khả dụng và nút làm mới dữ liệu */}
      {hasSearched && <div className="results-control-bar">
        <div className="results-info-group">
          <span className="results-availability-text">
            {displayDate && displayStart && displayEnd ? (
              <>Khả dụng trong khung giờ đã chọn — <strong>{displayDate}</strong> • <strong>{displayStart} - {displayEnd}</strong></>
            ) : (
              <>{hasAnyFilter ? 'Không gian đang hoạt động phù hợp bộ lọc' : 'Tất cả không gian đang hoạt động'} — sắp xếp theo mức độ phù hợp</>
            )}
          </span>
        </div>

        <div className="results-view-controls">
          <button
            type="button"
            className="btn-portal-refresh"
            onClick={() => fetchSpaces(activeFilter)}
            disabled={loading}
            title="Tải lại dữ liệu"
          >
            🔄 Tải lại
          </button>
        </div>
      </div>}

      {/* Xử lý các trạng thái: Đang tải, Lỗi, Trống hoặc Hiển thị danh sách thẻ phòng */}
      {!hasSearched ? (
        <div className="portal-empty-card">
          <span>🔎</span>
          <h4>Chọn thông tin để tìm không gian</h4>
          <p>Vui lòng chọn ngày, giờ bắt đầu, giờ kết thúc và nhập số người tham gia.</p>
        </div>
      ) : loading ? (
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>Đang kiểm tra khả dụng phòng học...</p>
        </div>
      ) : error ? (
        <div className="portal-error-card">
          <span>⚠️</span>
          <h4>Lỗi kết nối dữ liệu</h4>
          <p>{error}</p>
          <button className="btn-portal-retry" onClick={() => fetchSpaces(activeFilter)}>
            Thử lại
          </button>
        </div>
      ) : spaces.length === 0 ? (
        <div className="portal-empty-card">
          <span>🏖️</span>
          <h4>Không tìm thấy phòng phù hợp</h4>
          <p>Tất cả phòng trong khung giờ này đã có lịch đặt hoặc đang bảo trì. Vui lòng chọn khung giờ khác.</p>
        </div>
      ) : (
        <>
          {/* Lưới các thẻ phòng học hiển thị dạng 3 cột trực quan */}
          <div className="rooms-grid-v1">
            {paginatedSpaces.map((space) => (
              <RoomCard
                key={space.id}
                space={space}
                searchParams={{
                  date: activeFilter.date,
                  startTime: activeFilter.startTime,
                  endTime: activeFilter.endTime,
                  participantCount: activeFilter.participantCount,
                  spaceTypeId: activeFilter.spaceTypeId,
                  facilityIds: activeFilter.facilityIds,
                }}
                onBook={(s) => setSelectedSpaceForBooking(s)}
              />
            ))}
          </div>

          {/* Thanh điều hướng phân trang danh sách phòng */}
          <nav className="spaces-pagination" aria-label="Phân trang danh sách không gian">
            <div className="spaces-pagination-summary">
              Hiển thị <strong>{pageStartIndex + 1}</strong>–<strong>{Math.min(pageStartIndex + pageSize, spaces.length)}</strong>
              {' '}trong <strong>{spaces.length}</strong> không gian
            </div>

            <div className="spaces-pagination-controls">
              <button
                type="button"
                className="spaces-pagination-arrow"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                aria-label="Trang trước"
                title="Trang trước"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="spaces-pagination-pages">
                {getPaginationItems().map((item) =>
                  typeof item === 'string' ? (
                    <span key={item} className="spaces-pagination-dots">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`spaces-pagination-page ${item === safeCurrentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Trang ${item}`}
                      aria-current={item === safeCurrentPage ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="spaces-pagination-arrow"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                aria-label="Trang sau"
                title="Trang sau"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Modal biểu mẫu tạo đơn đặt không gian học tập */}
      {selectedSpaceForBooking && (
        <BookingModal
          space={selectedSpaceForBooking}
          defaultDate={activeFilter.date}
          defaultStartTime={activeFilter.startTime}
          defaultEndTime={activeFilter.endTime}
          defaultCount={activeFilter.participantCount}
          onClose={() => setSelectedSpaceForBooking(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
