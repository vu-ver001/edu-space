import React, { useEffect, useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';
import { formatMessageDatesVI } from '../components/DateInputVI';
import type { SearchFilter, Space } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import './SearchSpacesPage.css';
import '../components/MaintenanceModal.css';

const SPACE_ROWS_PER_PAGE = 4;

const matchesParticipantBookingMode = (space: Space, participantCount?: number): boolean => {
  const count = Math.max(1, Number(participantCount) || 1);
  const bookingMode = space.bookingMode || space.spaceType?.bookingMode;

  if (bookingMode === 'WHOLE_SPACE') return Number(space.capacity) >= count;
  if (bookingMode === 'PER_SEAT') return count === 1;
  return bookingMode === 'PER_TABLE' && Number(space.capacity) >= count;
};

export const SearchSpacesPage: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>({
    date: '',
    startTime: '',
    endTime: '',
    participantCount: undefined,
  });
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState<Space | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cardsPerRow, setCardsPerRow] = useState<number>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 1 : 3
  );

  const fetchSpaces = (filter: SearchFilter = activeFilter) => {
    if (!filter.date || !filter.startTime || !filter.endTime || !filter.participantCount) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    setCurrentPage(1);
    setLoading(true);
    setError(null);

    // Kiểm tra tính hợp lệ của thời gian (02_Yeu_cau_logic §1.1: startTime < endTime)
    if (filter.startTime && filter.endTime && filter.startTime >= filter.endTime) {
      setError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      setSpaces([]);
      setLoading(false);
      return;
    }

    const toIso = (dateStr: string, timeStr: string) => {
      const parts = (timeStr || '').trim().split(':');
      const h = (parts[0] || '08').padStart(2, '0');
      const m = (parts[1] || '00').padStart(2, '0');
      const sec = (parts[2] || '00').padStart(2, '0');
      return `${dateStr}T${h}:${m}:${sec}`;
    };

    const parseMs = (timeStr?: string) => {
      if (!timeStr) return 0;
      const formatted = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T');
      const d = new Date(formatted);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    // Kiểm tra xem phòng có lịch bảo trì trùng với khoảng thời gian tìm kiếm không
    const isMaintenanceConflict = (s: Space): boolean => {
      if (s.status === 'MAINTENANCE') return true;
      if (!filter.date || !filter.startTime || !filter.endTime) return false;

      const searchStartMs = parseMs(toIso(filter.date, filter.startTime));
      const searchEndMs = parseMs(toIso(filter.date, filter.endTime));

      if (!searchStartMs || !searchEndMs || searchStartMs >= searchEndMs) {
        return false;
      }

      const durationMs = searchEndMs - searchStartMs;
      const isShortSearch = durationMs <= 180 * 60 * 1000; // <= 3 giờ

      // Thu thập tất cả các khoảng bảo trì giao cắt với [searchStartMs, searchEndMs]
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

      // Nếu là tìm kiếm khung giờ ngắn (<= 3h) mà có bảo trì -> Ẩn phòng
      if (isShortSearch) {
        return true;
      }

      // Nếu tìm kiếm khung giờ dài (> 3h): Gộp các khoảng bảo trì và kiểm tra xem còn khoảng trống >= 30 phút không
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
      const minSlotMs = 30 * 60 * 1000; // Tối thiểu 30 phút

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

      // Nếu không còn khoảng trống nào >= 30 phút -> Bị bảo trì phủ kín toàn bộ -> Ẩn phòng
      return !hasAvailableGap;
    };

    spaceService
      .searchAvailableSpaces(filter)
      .then((data) => {
        // Ẩn hoàn toàn các phòng đang hoặc có lịch bảo trì trong khoảng thời gian tìm kiếm
        let filtered = data.filter(
          (s) => !isMaintenanceConflict(s) && matchesParticipantBookingMode(s, filter.participantCount)
        );

        if (filter.facilityIds && filter.facilityIds.length > 0) {
          filtered = filtered.filter((s) => {
            if (s.facilityIds && s.facilityIds.length > 0) {
              return filter.facilityIds!.every((fid) => s.facilityIds!.includes(fid));
            }
            return true;
          });
        }
        setSpaces(filtered);
      })
      .catch((err) => {
        const serverMsg = formatMessageDatesVI(err?.response?.data?.message);
        const errCode = err?.response?.data?.code;

        // Nếu là lỗi dữ liệu không hợp lệ (400 Bad Request như INVALID_TIME_RANGE), hiển thị lỗi chính xác
        if (err?.response?.status === 400 || errCode === 'INVALID_TIME_RANGE') {
          setError(serverMsg || 'Thời gian bắt đầu phải trước thời gian kết thúc.');
          setSpaces([]);
          return;
        }

        // Không dùng danh sách phòng chưa kiểm tra làm dữ liệu dự phòng vì có thể sai sức chứa,
        // trạng thái ghế/bàn hoặc lịch đã đặt trong CSDL.
        setSpaces([]);
        setError(serverMsg || 'Không thể kết nối đến máy chủ để kiểm tra phòng phù hợp.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Lắng nghe sự kiện chuyển user hoặc cấp token tự động từ PortalLayout
    const handleUserSwitch = () => {
      if (activeFilter.date && activeFilter.startTime && activeFilter.endTime && activeFilter.participantCount) {
        fetchSpaces(activeFilter);
      }
    };
    window.addEventListener('user-switched', handleUserSwitch);
    return () => window.removeEventListener('user-switched', handleUserSwitch);
  }, [activeFilter]);

  useEffect(() => {
    const mobileLayout = window.matchMedia('(max-width: 768px)');
    const syncCardsPerRow = () => setCardsPerRow(mobileLayout.matches ? 1 : 3);

    syncCardsPerRow();
    mobileLayout.addEventListener('change', syncCardsPerRow);
    return () => mobileLayout.removeEventListener('change', syncCardsPerRow);
  }, []);

  const handleSearch = (filter: SearchFilter) => {
    setHasSearched(true);
    setActiveFilter(filter);
    fetchSpaces(filter);
  };

  const handleBookingSuccess = () => {
    setSelectedSpaceForBooking(null);
    setToastMessage('✓ Đặt không gian thành công! Đã cập nhật vào hệ thống.');
    setTimeout(() => setToastMessage(null), 4000);
    fetchSpaces(activeFilter);
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  const availableCount = spaces.filter((s) => s.isAvailable ?? (s.status === 'AVAILABLE')).length;
  const displayDate = formatDisplayDate(activeFilter.date);
  const displayStart = activeFilter.startTime ? activeFilter.startTime.substring(0, 5) : '';
  const displayEnd = activeFilter.endTime ? activeFilter.endTime.substring(0, 5) : '';
  const pageSize = SPACE_ROWS_PER_PAGE * cardsPerRow;
  const totalPages = Math.max(1, Math.ceil(spaces.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedSpaces = spaces.slice(pageStartIndex, pageStartIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      document.querySelector('.rooms-grid-v1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

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
    <div className="search-spaces-page">
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Tiêu đề trang */}
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

      {/* Bộ lọc tìm kiếm theo form nội bộ chuẩn ảnh mẫu */}
      <FilterBar
        onSearch={handleSearch}
        isLoading={loading}
        availableCount={hasSearched ? availableCount : undefined}
      />

      {/* Thanh trạng thái khả dụng theo Ảnh 1 (Đã bỏ nút Dạng bảng) */}
      {hasSearched && <div className="results-control-bar">
        <div className="results-info-group">
          <span className="results-availability-text">
            Khả dụng trong khung giờ đã chọn — <strong>{displayDate}</strong> • <strong>{displayStart} - {displayEnd}</strong>
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

      {/* Trạng thái Loading / Error / Empty / Content */}
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
        /* LƯỚI THẺ 3 CỘT NỘI BỘ THEO ẢNH 1 (Duy nhất định dạng thẻ, đã bỏ hoàn toàn dạng bảng) */
        <>
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
                }}
                onBook={(s) => setSelectedSpaceForBooking(s)}
              />
            ))}
          </div>

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

      {/* Modal đặt phòng */}
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
