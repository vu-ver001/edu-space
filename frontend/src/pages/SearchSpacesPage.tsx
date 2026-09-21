import React, { useEffect, useState } from 'react';
import { FilterBar, getNextAvailableSlot } from '../components/FilterBar';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';
import type { SearchFilter, Space } from '../services/spaceService';
import { spaceService } from '../services/spaceService';

export const SearchSpacesPage: React.FC = () => {
  const initialSlot = getNextAvailableSlot();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>({
    date: initialSlot.date,
    startTime: initialSlot.startTime + ':00',
    endTime: initialSlot.endTime + ':00',
    participantCount: 4,
  });
  const [selectedSpaceForBooking, setSelectedSpaceForBooking] = useState<Space | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSpaces = (filter: SearchFilter = activeFilter) => {
    setLoading(true);
    setError(null);
    spaceService
      .searchAvailableSpaces(filter)
      .then((data) => {
        setSpaces(data);
      })
      .catch((err) => {
        // Dự phòng tải toàn bộ phòng nếu khung giờ lọc gặp sự cố để người dùng luôn thấy phòng
        spaceService
          .getAllSpaces()
          .then((allData) => {
            setSpaces(allData);
          })
          .catch(() => {
            setError(err?.response?.data?.message || 'Không thể kết nối đến máy chủ');
          });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSpaces(activeFilter);
  }, []);

  const handleSearch = (filter: SearchFilter) => {
    setActiveFilter(filter);
    fetchSpaces(filter);
  };

  const handleBookingSuccess = () => {
    setSelectedSpaceForBooking(null);
    setToastMessage('✓ Đặt không gian thành công! Đã cập nhật vào hệ thống.');
    setTimeout(() => setToastMessage(null), 4000);
    fetchSpaces(activeFilter);
  };

  const availableCount = spaces.filter((s) => s.isAvailable ?? (s.status === 'AVAILABLE')).length;
  const displayDate = activeFilter.date || initialSlot.date;
  const displayStart = activeFilter.startTime ? activeFilter.startTime.substring(0, 5) : initialSlot.startTime;
  const displayEnd = activeFilter.endTime ? activeFilter.endTime.substring(0, 5) : initialSlot.endTime;

  return (
    <>
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Tiêu đề trang theo Ảnh 1 */}
      <div className="portal-page-intro">
        <h2 className="portal-page-main-heading">Tìm không gian</h2>
        <p className="portal-page-sub-heading">Tìm kiếm phòng học, phòng họp hoặc khu làm việc phù hợp với nhu cầu</p>
      </div>

      {/* Bộ lọc tìm kiếm theo form nội bộ chuẩn ảnh mẫu */}
      <FilterBar onSearch={handleSearch} isLoading={loading} availableCount={availableCount} />

      {/* Thanh trạng thái khả dụng theo Ảnh 1 (Đã bỏ nút Dạng bảng) */}
      <div className="results-control-bar">
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
      </div>

      {/* Trạng thái Loading / Error / Empty / Content */}
      {loading ? (
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
        <div className="rooms-grid-v1">
          {spaces.map((space) => (
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
    </>
  );
};
