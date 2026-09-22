import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Space, SpaceTable, SpaceSeat } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import { bookingService } from '../services/bookingService';

interface Props {
  space: Space;
  date: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose: string;
  mode?: 'SEAT' | 'TABLE';
  onClose: () => void;
  onSuccess: (bookingId: number, selectedItems: string[]) => void;
}

// Dữ liệu mẫu fallback khớp chuẩn 100% CSDL data-kimtuyen.sql
const FALLBACK_TABLES: SpaceTable[] = [
  { id: 1, spaceId: 7, tableCode: 'T01', capacity: 6, status: 'AVAILABLE', description: 'Bàn 6 chỗ gần cửa sổ dãy A' },
  { id: 2, spaceId: 7, tableCode: 'T02', capacity: 6, status: 'AVAILABLE', description: 'Bàn 6 chỗ gần màn hình trình chiếu' },
  { id: 3, spaceId: 7, tableCode: 'T03', capacity: 4, status: 'AVAILABLE', description: 'Bàn 4 chỗ góc yên tĩnh' },
  { id: 4, spaceId: 7, tableCode: 'T04', capacity: 8, status: 'AVAILABLE', description: 'Bàn lớn 8 chỗ trung tâm phòng' },
];

const FALLBACK_SEATS: SpaceSeat[] = [
  { id: 1, spaceId: 4, seatCode: 'S01', status: 'AVAILABLE', description: 'Chỗ ngồi gần cửa sổ dãy A' },
  { id: 2, spaceId: 4, seatCode: 'S02', status: 'AVAILABLE', description: 'Chỗ ngồi gần cửa sổ dãy A' },
  { id: 3, spaceId: 4, seatCode: 'S03', status: 'AVAILABLE', description: 'Chỗ ngồi dãy A' },
  { id: 4, spaceId: 4, seatCode: 'S04', status: 'AVAILABLE', description: 'Chỗ ngồi dãy A' },
  { id: 5, spaceId: 4, seatCode: 'S05', status: 'AVAILABLE', description: 'Chỗ ngồi trung tâm có vách ngăn' },
  { id: 6, spaceId: 4, seatCode: 'S06', status: 'AVAILABLE', description: 'Chỗ ngồi trung tâm có vách ngăn' },
  { id: 7, spaceId: 4, seatCode: 'S07', status: 'AVAILABLE', description: 'Chỗ ngồi dãy B gần ổ cắm điện' },
  { id: 8, spaceId: 4, seatCode: 'S08', status: 'AVAILABLE', description: 'Chỗ ngồi dãy B gần ổ cắm điện' },
  { id: 9, spaceId: 4, seatCode: 'S09', status: 'AVAILABLE', description: 'Chỗ ngồi dãy B' },
  { id: 10, spaceId: 4, seatCode: 'S10', status: 'INACTIVE', description: 'Chỗ ngồi đang thay bàn ghế mới (tạm khóa)' },
];

export const SeatSelectionModal: React.FC<Props> = ({
  space,
  date,
  startTime,
  endTime,
  participantCount,
  purpose,
  mode,
  onClose,
  onSuccess,
}) => {
  // Xác định chế độ: PER_TABLE (chọn bàn) hay PER_SEAT (chọn ghế)
  const isTableMode = useMemo(() => {
    if (mode === 'TABLE') return true;
    if (mode === 'SEAT') return false;
    const bMode = space.bookingMode || space.spaceType?.bookingMode;
    if (bMode === 'PER_TABLE') return true;
    if (bMode === 'PER_SEAT') return false;
    return space.name?.toLowerCase().includes('bàn') || space.spaceTypeName?.toLowerCase().includes('bàn');
  }, [mode, space]);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [occupiedItems, setOccupiedItems] = useState<Set<string>>(new Set());
  const [tablesList, setTablesList] = useState<SpaceTable[]>(FALLBACK_TABLES);
  const [seatsList, setSeatsList] = useState<SpaceSeat[]>(FALLBACK_SEATS);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startIso = `${date}T${startTime.length === 5 ? startTime + ':00' : startTime}`;
  const endIso = `${date}T${endTime.length === 5 ? endTime + ':00' : endTime}`;

  // Tải danh sách cấu hình và trạng thái bận từ MySQL Database
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      if (isTableMode) {
        // Tải danh sách bàn từ API Tuyến
        try {
          const fetchedTables = await spaceService.getTablesBySpace(space.id);
          if (fetchedTables && fetchedTables.length > 0) {
            setTablesList(fetchedTables);
          }
        } catch (e) {
          // Dùng FALLBACK_TABLES nếu chưa cấu hình
          setTablesList(FALLBACK_TABLES);
        }
      } else {
        // Tải danh sách ghế từ API Tuyến
        try {
          const fetchedSeats = await spaceService.getSeatsBySpace(space.id);
          if (fetchedSeats && fetchedSeats.length > 0) {
            setSeatsList(fetchedSeats);
          }
        } catch (e) {
          // Dùng FALLBACK_SEATS nếu chưa cấu hình
          setSeatsList(FALLBACK_SEATS);
        }
      }

      // Tải danh sách mã đã bị đặt (ghế hoặc bàn) trong khung giờ từ API của Khánh Vân
      const occupied = await bookingService.getOccupiedSeats(space.id, startIso, endIso);
      setOccupiedItems(new Set(occupied));
      setSelectedItems((prev) => prev.filter((code) => !occupied.includes(code)));
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bàn/ghế từ server:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isTableMode, space.id, startIso, endIso]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Xử lý click chọn / hủy chọn Item (bàn hoặc ghế)
  const handleItemClick = (code: string, isInactive?: boolean) => {
    if (occupiedItems.has(code) || isInactive) return;

    setSelectedItems((prev) => {
      if (prev.includes(code)) {
        return prev.filter((item) => item !== code);
      } else {
        if (isTableMode) {
          // Với chế độ chọn bàn: thường chọn 1 bàn phù hợp (hoặc có thể chọn thêm)
          return [code];
        } else {
          // Với chế độ chọn ghế: chọn đủ số người tham gia
          if (prev.length >= participantCount) {
            return [...prev.slice(1), code];
          }
          return [...prev, code];
        }
      }
    });
  };

  // Xác nhận tạo booking
  const handleConfirmBooking = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage(`Vui lòng chọn ít nhất 1 ${isTableMode ? 'bàn' : 'chỗ ngồi'} trên sơ đồ.`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const sortedItems = [...selectedItems].sort();
      const newBooking = await bookingService.createBooking({
        spaceId: space.id,
        startTime: startIso,
        endTime: endIso,
        participantCount: Math.max(selectedItems.length, participantCount),
        purpose: purpose.trim() || (isTableMode ? 'Thảo luận theo bàn' : 'Tự học tại chỗ ngồi'),
        selectedSeats: sortedItems,
      });

      onSuccess(newBooking.id, sortedItems);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi tạo đặt chỗ. Vui lòng kiểm tra lại.';
      setErrorMessage(msg);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Render từng bàn thảo luận (mô hình to hơn ghế một chút, hình khối bàn nhóm)
  const renderTableCard = (tbl: SpaceTable) => {
    const isOccupied = occupiedItems.has(tbl.tableCode);
    const isInactive = tbl.status === 'INACTIVE';
    const isSelected = selectedItems.includes(tbl.tableCode);
    const isUnavailable = isOccupied || isInactive;

    return (
      <div
        key={tbl.id || tbl.tableCode}
        className={`cinema-table-card ${isUnavailable ? 'table-occupied' : isSelected ? 'table-selected' : 'table-available'}`}
        onClick={() => handleItemClick(tbl.tableCode, isInactive)}
      >
        <div className="table-card-top">
          <div className="table-card-code">
            <span>🪑</span>
            <span>Bàn {tbl.tableCode}</span>
          </div>
          <span className="table-card-capacity">
            👥 {tbl.capacity} chỗ
          </span>
        </div>

        <div className="table-card-desc">
          {tbl.description || `Bàn học nhóm ${tbl.capacity} chỗ trang bị ổ cắm điện`}
        </div>

        <div className="table-card-status">
          {isInactive ? (
            <span style={{ color: '#EF4444' }}>🔒 Tạm khóa bảo trì</span>
          ) : isOccupied ? (
            <span style={{ color: '#64748B' }}>✕ Đã có người đặt</span>
          ) : isSelected ? (
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>✓ Bạn đang chọn</span>
          ) : (
            <span style={{ color: '#10B981' }}>● Bàn trống</span>
          )}
        </div>
      </div>
    );
  };

  // Render từng ghế ngồi cá nhân
  const renderSeatButton = (st: SpaceSeat) => {
    const isOccupied = occupiedItems.has(st.seatCode);
    const isInactive = st.status === 'INACTIVE';
    const isSelected = selectedItems.includes(st.seatCode);
    const isUnavailable = isOccupied || isInactive;

    return (
      <button
        key={st.id || st.seatCode}
        type="button"
        className={`cinema-seat ${isUnavailable ? 'seat-occupied' : ''} ${
          isSelected ? 'seat-selected' : 'seat-available'
        }`}
        onClick={() => handleItemClick(st.seatCode, isInactive)}
        disabled={isUnavailable || submitting}
        title={
          isInactive
            ? `Ghế ${st.seatCode}: Tạm khóa bảo dưỡng`
            : isOccupied
            ? `Ghế ${st.seatCode}: Đã có người đặt trước (Bận)`
            : isSelected
            ? `Ghế ${st.seatCode}: Bạn đang chọn`
            : `Ghế ${st.seatCode}: Ghế trống sẵn sàng đặt`
        }
      >
        <span>{st.seatCode}</span>
      </button>
    );
  };

  return (
    <div className="cinema-modal-overlay">
      <div className="cinema-modal-container">
        {/* Header Modal */}
        <div className="cinema-modal-header">
          <div>
            <h3 className="cinema-title">
              <span style={{ fontSize: '1.25rem' }}>{isTableMode ? '🪑' : '💺'}</span>
              {isTableMode ? 'Sơ đồ chọn bàn thảo luận nhóm' : 'Sơ đồ chọn vị trí chỗ ngồi cá nhân'}
            </h3>
            <div className="cinema-subtitle">
              <strong style={{ color: '#0F172A' }}>{space.name}</strong>
              <span>•</span>
              <span>{space.building} - {space.floor}</span>
              <span>•</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#EFF6FF',
                color: '#1D72FE',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.775rem'
              }}>
                {isTableMode ? `👥 Sức chứa: ${space.capacity} chỗ (${tablesList.length} bàn)` : `👥 Sức chứa: ${space.capacity} chỗ (${seatsList.length} ghế)`}
              </span>
              {loadingData && (
                <span style={{ marginLeft: 6, color: '#1D72FE', fontSize: '0.8rem' }}>
                  🔄 Đang đồng bộ...
                </span>
              )}
            </div>
          </div>
          <button type="button" className="cinema-btn-close" onClick={onClose} disabled={submitting} title="Đóng">
            ✕
          </button>
        </div>

        {/* Thông báo lỗi nếu có xung đột */}
        {errorMessage && (
          <div className="cinema-error-banner">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Khu vực sơ đồ tương tác */}
        <div className="cinema-seats-area">
          {isTableMode ? (
            /* 1. HIỂN THỊ MÔ HÌNH BÀN THẢO LUẬN (PER_TABLE) */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  color: '#0369A1',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.825rem',
                  fontWeight: 600
                }}>
                  💡 Nhấp vào bàn bạn muốn chọn. Mô hình bàn độc lập với ổ cắm điện và bảng viết riêng.
                </span>
              </div>

              <div className="cinema-tables-grid">
                {tablesList.map((tbl) => renderTableCard(tbl))}
              </div>
            </div>
          ) : (
            /* 2. HIỂN THỊ MÔ HÌNH GHẾ NGỒI CÁ NHÂN (PER_SEAT) */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.825rem',
                  fontWeight: 600
                }}>
                  💡 Nhấp vào ghế bạn muốn ngồi (Mã ghế S01 đến S10).
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 54px)',
                gap: 14,
                justifyContent: 'center',
                padding: '20px 0'
              }}>
                {seatsList.map((st) => renderSeatButton(st))}
              </div>
            </div>
          )}

          {/* Chú thích màu sắc (Legend) */}
          <div className="cinema-legend" style={{ marginTop: 20 }}>
            <div className="legend-item">
              <span className="legend-box available" />
              <span>{isTableMode ? 'Bàn trống' : 'Ghế trống'}</span>
            </div>
            <div className="legend-item">
              <span className="legend-box occupied" />
              <span>Đã có người đặt (Bận)</span>
            </div>
            <div className="legend-item">
              <span className="legend-box selected" />
              <span>{isTableMode ? 'Bàn đang chọn' : `Ghế đang chọn (${selectedItems.length}/${participantCount})`}</span>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="cinema-modal-footer">
          <div className="footer-booking-info">
            <div className="footer-meta-time">
              📅 <strong>{date}</strong> • <strong>{startTime.substring(0, 5)} - {endTime.substring(0, 5)}</strong>
            </div>
            <div className="footer-seats-selected">
              <span>{isTableMode ? 'Bàn đã chọn: ' : 'Chỗ ngồi đã chọn: '}</span>
              {selectedItems.length > 0 ? (
                <span className="selected-seats-badge">
                  {isTableMode ? `🪑 Bàn ${selectedItems.join(', ')}` : `💺 Ghế ${selectedItems.sort().join(', ')} (${selectedItems.length} chỗ)`}
                </span>
              ) : (
                <span className="no-seats-text">
                  {isTableMode ? 'Chưa chọn bàn nào' : `Chưa chọn ghế nào (Cần chọn ${participantCount} ghế)`}
                </span>
              )}
            </div>
          </div>

          <div className="footer-actions">
            <button
              type="button"
              className="btn-cinema-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="btn-cinema-confirm"
              onClick={handleConfirmBooking}
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? 'Đang xác nhận...' : isTableMode ? 'Xác nhận đặt bàn' : 'Xác nhận đặt ghế'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
