// Modal trực quan hóa sơ đồ chọn chỗ ngồi cá nhân hoặc bàn học nhóm (Module M03 & M04 - Khánh Vân).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Users,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
} from 'lucide-react';
import { TableMeetingIcon } from './RoomCard';
import { DateInputVI, formatDateVI, formatMessageDatesVI } from './DateInputVI';
import { TimeInput24H } from './TimeInput24H';
import type { Space, SpaceSeat, SpaceTable } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import { bookingService } from '../services/bookingService';
import './SeatSelectionModal.css';

// Định nghĩa các thuộc tính Props truyền vào modal chọn chỗ ngồi/bàn học.
interface Props {
  space: Space;
  date: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  purpose: string;
  mode?: 'SEAT' | 'TABLE';
  openingHour?: string;
  closingHour?: string;
  maxDurationMinutes?: number;
  onClose: () => void;
  onSuccess: (bookingId: number, selectedItems: string[]) => void;
}

// Chuyển đổi định dạng giờ HH:mm sang số phút tính từ đầu ngày.
const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Ghép ngày và giờ thành chuỗi thời gian chuẩn ISO 8601.
const toIsoDateTime = (date: string, time: string) =>
  `${date}T${time.length === 5 ? `${time}:00` : time}`;

// Component Modal trực quan hóa sơ đồ phòng học và hỗ trợ tương tác thu phóng.
export const SeatSelectionModal: React.FC<Props> = ({
  space,
  date,
  startTime,
  endTime,
  participantCount,
  purpose,
  mode,
  openingHour = '07:00',
  closingHour = '22:00',
  maxDurationMinutes = 180,
  onClose,
  onSuccess,
}) => {
  // Xác định chế độ hiển thị theo bàn học nhóm (TABLE) hay chỗ ngồi cá nhân (SEAT).
  const isTableMode = useMemo(() => {
    if (mode === 'TABLE') return true;
    if (mode === 'SEAT') return false;
    const bookingMode = space.bookingMode || space.spaceType?.bookingMode;
    return bookingMode === 'PER_TABLE';
  }, [mode, space]);

  // Quản lý các bước thực hiện: chọn vị trí trên sơ đồ (SELECT) hoặc nhập thông tin chi tiết (DETAILS).
  const [step, setStep] = useState<'SELECT' | 'DETAILS'>('SELECT');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [occupiedItems, setOccupiedItems] = useState<Set<string>>(new Set());
  const [tablesList, setTablesList] = useState<SpaceTable[]>([]);
  const [seatsList, setSeatsList] = useState<SpaceSeat[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quản lý trạng thái thu phóng (Zoom) và kéo rê bản đồ (Pan) trên canvas.
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Lưu trữ dữ liệu biểu mẫu đặt chỗ người dùng chỉnh sửa tại bước 2.
  const [bookingDate, setBookingDate] = useState(date);
  const [bookingStartTime, setBookingStartTime] = useState(startTime);
  const [bookingEndTime, setBookingEndTime] = useState(endTime);
  const [bookingParticipantCount, setBookingParticipantCount] = useState(
    isTableMode ? Math.max(1, Number(participantCount) || 1) : 1,
  );
  const [bookingPurpose, setBookingPurpose] = useState(purpose);

  // Kiểm tra yêu cầu phê duyệt và xác định thời gian hiện tại theo múi giờ hệ thống.
  const requiresApproval = space.requiresApproval ?? space.spaceType?.requiresApproval ?? isTableMode;
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);
  const startIso = toIsoDateTime(bookingDate, bookingStartTime);
  const endIso = toIsoDateTime(bookingDate, bookingEndTime);

  // Tìm bàn đang được chọn trong danh sách để hiển thị sức chứa tối đa.
  const selectedTable = useMemo(
    () => isTableMode
      ? tablesList.find((table) => table.tableCode.toUpperCase() === selectedItems[0]?.toUpperCase()) || null
      : null,
    [isTableMode, selectedItems, tablesList],
  );
  const selectedCapacity = isTableMode ? (selectedTable?.capacity || space.capacity) : 1;

  // Điều khiển phóng to sơ đồ phòng học tối đa 220%.
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.2, +(prev + 0.15).toFixed(2)));
  // Điều khiển thu nhỏ sơ đồ phòng học tối thiểu 65%.
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.65, +(prev - 0.15).toFixed(2)));
  // Đặt lại tỷ lệ xem sơ đồ về trạng thái mặc định ban đầu.
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Bắt đầu kéo rê sơ đồ bằng thao tác nhấn chuột trái.
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    hasMovedRef.current = false;
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  // Cập nhật vị trí tọa độ khi di chuyển chuột để pan canvas.
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x - panOffset.x;
    const dy = e.clientY - panStartRef.current.y - panOffset.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  // Kết thúc trạng thái kéo rê sơ đồ khi nhả chuột.
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Bắt đầu kéo sơ đồ trên màn hình cảm ứng di động.
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      hasMovedRef.current = false;
      panStartRef.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
    }
  };

  // Di chuyển sơ đồ theo cử chỉ ngón tay trên màn hình cảm ứng.
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - panStartRef.current.x - panOffset.x;
    const dy = touch.clientY - panStartRef.current.y - panOffset.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: touch.clientX - panStartRef.current.x,
      y: touch.clientY - panStartRef.current.y,
    });
  };

  // Kết thúc cử chỉ cảm ứng trên thiết bị di động.
  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Phóng to hoặc thu nhỏ sơ đồ khi lăn chuột.
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Nạp danh sách bàn/ghế và kiểm tra tình trạng đã được đặt từ máy chủ cơ sở dữ liệu.
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setResourceError(null);
    try {
      if (isTableMode) {
        const tables = await spaceService.getTablesBySpace(space.id);
        setTablesList(tables || []);
        setSeatsList([]);
        if (!tables?.length) {
          setResourceError(`Phòng ${space.name} chưa được cấu hình bàn trong cơ sở dữ liệu.`);
        }
      } else {
        const seats = await spaceService.getSeatsBySpace(space.id);
        setSeatsList(seats || []);
        setTablesList([]);
        if (!seats?.length) {
          setResourceError(`Phòng ${space.name} chưa được cấu hình ghế trong cơ sở dữ liệu.`);
        }
      }

      if (bookingDate && bookingStartTime && bookingEndTime) {
        const occupied = await bookingService.getOccupiedSeats(space.id, startIso, endIso);
        const normalized = new Set(occupied.map((item) => String(item).trim().toUpperCase()));
        setOccupiedItems(normalized);
        setSelectedItems((current) => current.filter((code) => !normalized.has(code.toUpperCase())));
      } else {
        setOccupiedItems(new Set());
      }
    } catch (error) {
      setTablesList([]);
      setSeatsList([]);
      setOccupiedItems(new Set());
      setSelectedItems([]);
      setResourceError(`Không thể tải danh sách ${isTableMode ? 'bàn' : 'ghế'} từ cơ sở dữ liệu. Vui lòng thử lại.`);
      console.error('Không thể tải dữ liệu bàn/ghế từ cơ sở dữ liệu:', error);
    } finally {
      setLoadingData(false);
    }
  }, [bookingDate, bookingEndTime, bookingStartTime, endIso, isTableMode, space.id, space.name, startIso]);

  // Tự động tải lại dữ liệu tài nguyên khi thông tin thời gian hoặc phòng thay đổi.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đẩy người dùng về bước chọn vị trí nếu vị trí vừa chọn bị chiếm bởi người khác.
  useEffect(() => {
    if (step === 'DETAILS' && selectedItems.length === 0) {
      setStep('SELECT');
      setErrorMessage(`Vị trí vừa chọn không còn trống trong khung giờ mới. Vui lòng chọn lại ${isTableMode ? 'bàn' : 'ghế'}.`);
    }
  }, [isTableMode, selectedItems.length, step]);

  // Xử lý chọn hoặc bỏ chọn một vị trí ghế/bàn trên sơ đồ.
  const selectItem = (code: string, isInactive = false) => {
    if (hasMovedRef.current) return;
    const normalized = code.toUpperCase();
    if (isInactive || occupiedItems.has(normalized)) return;
    setErrorMessage(null);
    setSelectedItems((current) => current.includes(code) ? [] : [code]);
  };

  // Chuyển sang bước 2 để điền biểu mẫu đặt phòng chi tiết.
  const continueToDetails = () => {
    if (!selectedItems.length) {
      setErrorMessage(`Vui lòng chọn một ${isTableMode ? 'bàn' : 'ghế'} trên sơ đồ để tiếp tục.`);
      return;
    }
    if (isTableMode && selectedTable && bookingParticipantCount > selectedTable.capacity) {
      setBookingParticipantCount(selectedTable.capacity);
    }
    setErrorMessage(null);
    setStep('DETAILS');
  };

  // Kiểm tra tính hợp lệ của các dữ liệu ngày giờ và số người trước khi xác nhận đặt.
  const validateDetails = () => {
    if (!selectedItems.length) {
      return `Vui lòng quay lại và chọn một ${isTableMode ? 'bàn' : 'ghế'} trước khi xác nhận.`;
    }
    if (!bookingDate || !bookingStartTime || !bookingEndTime) {
      return 'Vui lòng nhập đầy đủ ngày và khung giờ đặt chỗ.';
    }
    if (bookingDate < today) return 'Không thể đặt chỗ vào ngày trong quá khứ.';
    const start = toMinutes(bookingStartTime);
    const end = toMinutes(bookingEndTime);
    if (start >= end) return 'Giờ bắt đầu phải trước giờ kết thúc.';
    if (start < toMinutes(openingHour) || end > toMinutes(closingHour)) {
      return `Vui lòng chọn thời gian trong giờ mở cửa ${openingHour} – ${closingHour}.`;
    }
    if (end - start > maxDurationMinutes) {
      return `Mỗi lượt đặt tối đa ${Math.floor(maxDurationMinutes / 60)} giờ.`;
    }
    if (new Date(startIso).getTime() <= Date.now()) {
      return 'Thời gian bắt đầu phải lớn hơn thời điểm hiện tại.';
    }
    if (bookingParticipantCount < 1 || bookingParticipantCount > selectedCapacity) {
      return `Số người tham gia phải từ 1 đến ${selectedCapacity} người.`;
    }
    if (requiresApproval && !bookingPurpose.trim()) {
      return 'Vui lòng nhập mục đích sử dụng để gửi yêu cầu xét duyệt.';
    }
    return null;
  };

  // Gửi thông tin đặt chỗ kèm mã vị trí ghế/bàn lên hệ thống backend.
  const handleConfirmBooking = async () => {
    const validationError = validateDetails();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const sortedItems = [...selectedItems].sort();
      const booking = await bookingService.createBooking({
        spaceId: space.id,
        startTime: startIso,
        endTime: endIso,
        participantCount: isTableMode ? bookingParticipantCount : 1,
        purpose: bookingPurpose.trim() || 'Tự học tại chỗ ngồi',
        selectedSeats: [sortedItems[0]],
        tableId: isTableMode && selectedTable ? selectedTable.id : undefined,
      });
      onSuccess(booking.id, sortedItems);
    } catch (error: any) {
      setErrorMessage(formatMessageDatesVI(
        error?.response?.data?.message || 'Không thể hoàn tất đặt chỗ. Vui lòng kiểm tra lại thông tin.',
      ));
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Thống kê tổng số lượng vị trí còn trống, đã đặt hoặc đang tạm khóa trong phòng.
  const currentStats = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let inactive = 0;

    if (isTableMode) {
      tablesList.forEach((t) => {
        const code = t.tableCode.toUpperCase();
        if (t.status === 'INACTIVE') inactive++;
        else if (occupiedItems.has(code)) occupied++;
        else available++;
      });
      return { available, occupied, inactive, total: tablesList.length };
    } else {
      seatsList.forEach((s) => {
        const code = s.seatCode.toUpperCase();
        if (s.status === 'INACTIVE') inactive++;
        else if (occupiedItems.has(code)) occupied++;
        else available++;
      });
      return { available, occupied, inactive, total: seatsList.length };
    }
  }, [isTableMode, tablesList, seatsList, occupiedItems]);

  // Phân bổ sắp xếp danh sách ghế ngồi thành các dãy bàn học trực quan.
  const seatClusters = useMemo(() => {
    if (!seatsList.length) return [];
    const sorted = [...seatsList].sort((a, b) =>
      a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true })
    );
    const count = sorted.length;
    let perRow = 6;
    if (count <= 6) perRow = count;
    else if (count <= 10) perRow = 5;
    else if (count <= 14) perRow = 6;
    else if (count <= 20) perRow = 8;
    else perRow = 10;

    const clusters: SpaceSeat[][] = [];
    for (let i = 0; i < sorted.length; i += perRow) {
      clusters.push(sorted.slice(i, i + perRow));
    }
    return clusters;
  }, [seatsList]);

  // Render giao diện một nút ghế ngồi cá nhân trên sơ đồ kèm màu sắc trạng thái.
  const renderClassroomSeat = (seat: SpaceSeat) => {
    const code = seat.seatCode.toUpperCase();
    const occupied = occupiedItems.has(code);
    const inactive = seat.status === 'INACTIVE';
    const selected = selectedItems.includes(seat.seatCode);
    const title = inactive
      ? `Ghế ${seat.seatCode} (Tạm khóa)`
      : occupied
      ? `Ghế ${seat.seatCode} (Đã có người đặt)`
      : selected
      ? `Ghế ${seat.seatCode} (Đang chọn) - Bấm để bỏ chọn`
      : `Ghế ${seat.seatCode} (Còn trống) - Bấm để chọn`;

    return (
      <button
        key={seat.id || seat.seatCode}
        type="button"
        className={`classroom-seat-item ${inactive ? 'seat-inactive' : occupied ? 'seat-occupied' : selected ? 'seat-selected' : 'seat-available'}`}
        onClick={() => selectItem(seat.seatCode, inactive)}
        disabled={inactive || occupied || submitting}
        title={title}
      >
        <span className="seat-icon-box">
          <Armchair size={17} strokeWidth={selected ? 2.4 : 2} />
        </span>
        <span className="seat-code-label">{seat.seatCode}</span>
      </button>
    );
  };

  // Render giao diện một bàn học nhóm trên sơ đồ kèm thông tin số lượng chỗ ngồi.
  const renderClassroomTable = (table: SpaceTable) => {
    const code = table.tableCode.toUpperCase();
    const occupied = occupiedItems.has(code);
    const inactive = table.status === 'INACTIVE';
    const selected = selectedItems.includes(table.tableCode);
    const title = inactive
      ? `Bàn ${table.tableCode} (${table.capacity} chỗ) - Tạm khóa bảo trì`
      : occupied
      ? `Bàn ${table.tableCode} (${table.capacity} chỗ) - Đã có nhóm đặt`
      : selected
      ? `Bàn ${table.tableCode} (${table.capacity} chỗ) - Đang chọn`
      : `Bàn ${table.tableCode} (${table.capacity} chỗ) - Sẵn sàng đặt chỗ`;

    return (
      <div
        key={table.id || table.tableCode}
        className={`classroom-table-unit ${inactive ? 'tbl-inactive' : occupied ? 'tbl-occupied' : selected ? 'tbl-selected' : 'tbl-available'}`}
        onClick={() => selectItem(table.tableCode, inactive)}
        title={title}
      >
        {/* Mặt bàn học nhóm và nhãn biểu thị trạng thái */}
        <div className="table-top-surface">
          <div className="table-badge-row">
            <span className="table-icon-wrap">
              <TableMeetingIcon size={18} />
            </span>
            <span className="table-name-bold">Bàn {table.tableCode}</span>
          </div>
          <span className="table-capacity-tag">
            <Users size={12} /> {table.capacity} chỗ
          </span>
          <span className="table-status-caption">
            {inactive ? 'Tạm khóa' : occupied ? 'Đã có người đặt' : selected ? 'Đang chọn' : 'Còn trống'}
          </span>
        </div>
      </div>
    );
  };

  return (
    // Lớp phủ nền modal chọn vị trí phòng học
    <div className="cinema-modal-overlay" role="dialog" aria-modal="true">
      <div className={`cinema-modal-container ${step === 'DETAILS' ? 'cinema-modal-details' : 'cinema-modal-interactive-mode'}`}>
        {/* Phần đầu Modal hiển thị thanh tiến trình 2 bước và thông tin không gian */}
        <header className="cinema-modal-header">
          <div>
            <div className="booking-flow-steps" aria-label="Tiến trình đặt chỗ">
              <span className="flow-step active"><b>1</b> Chọn {isTableMode ? 'bàn' : 'ghế'}</span>
              <span className="flow-line" />
              <span className={`flow-step ${step === 'DETAILS' ? 'active' : ''}`}><b>2</b> Thông tin đặt chỗ</span>
            </div>
            <h3 className="cinema-title">
              {step === 'SELECT'
                ? <> {isTableMode ? <TableMeetingIcon size={22} /> : <Armchair size={22} />} Chọn vị trí {isTableMode ? 'bàn học nhóm' : 'chỗ ngồi cá nhân'}</>
                : <><CheckCircle2 size={22} /> Hoàn tất thông tin đặt chỗ</>}
            </h3>
            <div className="cinema-subtitle">
              <strong>{space.name}</strong>
              <span>•</span>
              <MapPin size={14} />
              <span>{space.building} · {space.floor}</span>
              <span>•</span>
              <span className="badge-room-mode">
                {isTableMode ? 'Chế độ đặt theo bàn' : 'Chế độ đặt theo ghế'}
              </span>
            </div>
          </div>
          <button type="button" className="cinema-btn-close" onClick={onClose} disabled={submitting} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>

        {/* Thông báo lỗi khi thao tác hoặc lỗi không tải được tài nguyên */}
        {errorMessage && <div className="cinema-error-banner">⚠ {errorMessage}</div>}
        {resourceError && (
          <div className="cinema-error-banner" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            ⚠ {resourceError}
          </div>
        )}

        {step === 'SELECT' ? (
          <>
            {/* Không gian tương tác trực quan với sơ đồ bàn ghế học tập */}
            <div className="classroom-interactive-workspace">
              {/* Thanh chú thích trạng thái màu sắc và hướng dẫn tương tác */}
              <div className="classroom-top-toolbar">
                <div className="classroom-legend-strip">
                  <div className="legend-strip-item">
                    <span className="legend-strip-box available" /> Còn trống ({currentStats.available})
                  </div>
                  <div className="legend-strip-item">
                    <span className="legend-strip-box occupied" /> Đã được đặt ({currentStats.occupied})
                  </div>
                  {currentStats.inactive > 0 && (
                    <div className="legend-strip-item">
                      <span className="legend-strip-box inactive" /> Tạm khóa ({currentStats.inactive})
                    </div>
                  )}
                  <div className="legend-strip-item">
                    <span className="legend-strip-box selected" /> Đang chọn
                  </div>
                </div>

                <div className="classroom-helper-hint">
                  <Move size={13} style={{ color: '#2563EB' }} />
                  <span>Kéo rê để di chuyển · Lăn chuột hoặc bấm +/- để phóng to</span>
                </div>
              </div>

              {/* Khung Canvas tương tác hỗ trợ kéo rê chuột và thu phóng */}
              <div
                className={`classroom-canvas-viewport ${isPanning ? 'is-panning' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
              >
                {loadingData ? (
                  <div className="selection-loading"><span className="portal-spinner" /> Đang đồng bộ sơ đồ phòng học...</div>
                ) : (isTableMode ? tablesList.length === 0 : seatsList.length === 0) ? (
                  <div className="selection-empty-state" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                    {isTableMode ? <TableMeetingIcon size={44} style={{ margin: '0 auto 12px', color: '#94a3b8' }} /> : <Armchair size={44} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />}
                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#334155' }}>
                      Chưa có dữ liệu {isTableMode ? 'bàn' : 'ghế'} cho không gian này trong cơ sở dữ liệu.
                    </p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Vui lòng liên hệ quản trị viên để thiết lập sơ đồ.</p>
                  </div>
                ) : (
                  <div
                    className="classroom-canvas-stage"
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                      transformOrigin: 'center 12%',
                    }}
                  >
                    {isTableMode ? (
                      /* Bố cục sơ đồ các bàn học nhóm */
                      <div className="classroom-tables-layout">
                        {tablesList.map(renderClassroomTable)}
                      </div>
                    ) : (
                      /* Bố cục sơ đồ các dãy ghế cá nhân */
                      <div className="classroom-seats-layout">
                        {seatClusters.map((cluster, cIdx) => (
                          <div key={`cluster-${cIdx}`} className="classroom-desk-row">
                            <div className="desk-seats-group">
                              {cluster.map(renderClassroomSeat)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Thanh công cụ điều khiển thu phóng nổi trên bản đồ */}
                <div className="classroom-floating-zoom" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-zoom-circle"
                    onClick={handleZoomOut}
                    title="Thu nhỏ (-)"
                    disabled={zoomLevel <= 0.65}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    className="btn-zoom-circle"
                    onClick={handleZoomIn}
                    title="Phóng to (+)"
                    disabled={zoomLevel >= 2.2}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="zoom-bar-divider" />
                  <button
                    type="button"
                    className="btn-zoom-reset"
                    onClick={handleResetZoom}
                    title="Căn vừa màn hình (Reset 100%)"
                  >
                    <RotateCcw size={14} />
                    <span>Vừa vặn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Thanh điều khiển dưới đáy hiển thị vị trí được chọn và nút tiếp tục */}
            <footer className="cinema-modal-footer">
              <div className="footer-booking-info">
                <div className="footer-selected-pill-box">
                  {selectedItems.length > 0 ? (
                    <div className="pill-selected-badge">
                      {isTableMode ? <TableMeetingIcon size={16} /> : <Armchair size={16} />}
                      <span className="pill-name">
                        {isTableMode ? 'Bàn' : 'Ghế'} <strong>{selectedItems[0]}</strong>
                      </span>
                      <span className="pill-sub">
                        {isTableMode && selectedTable ? `(${selectedTable.capacity} chỗ)` : 'Chỗ ngồi cá nhân'}
                      </span>
                    </div>
                  ) : (
                    <div className="pill-unselected-badge">
                      <span className="pulse-dot" />
                      <span>Chạm vào {isTableMode ? 'bàn' : 'ghế'} trên sơ đồ để chọn</span>
                    </div>
                  )}
                </div>

                <span className="footer-meta-time">
                  <CalendarDays size={14} />
                  {bookingDate && bookingStartTime && bookingEndTime
                    ? `${formatDateVI(bookingDate)} · ${bookingStartTime}–${bookingEndTime}`
                    : 'Khung giờ chọn ở bước 2'}
                </span>
              </div>

              <div className="footer-actions">
                <button type="button" className="btn-cinema-cancel" onClick={onClose}>Hủy</button>
                <button
                  type="button"
                  className="btn-cinema-confirm"
                  onClick={continueToDetails}
                  disabled={!selectedItems.length}
                >
                  Tiếp tục đặt chỗ →
                </button>
              </div>
            </footer>
          </>
        ) : (
          /* Giao diện Bước 2: Nhập thông tin chi tiết và xác nhận đơn đặt */
          <main className="booking-details-step">
            <div className={`selected-resource-summary ${isTableMode ? 'summary-compact-table' : ''}`}>
              <div className="selected-resource-icon" aria-hidden="true">
                {isTableMode ? <TableMeetingIcon size={20} strokeWidth={2.3} /> : <Armchair size={23} strokeWidth={2.3} />}
              </div>
              <div className="selected-resource-info">
                <span className="resource-tag">VỊ TRÍ ĐÃ CHỌN</span>
                <strong className="resource-name">{isTableMode ? 'Bàn' : 'Ghế'} {selectedItems[0]}</strong>
                <span className="resource-sub">{isTableMode ? `Sức chứa tối đa ${selectedCapacity} người` : 'Chỗ ngồi học tập cá nhân'}</span>
              </div>
              <button
                type="button"
                className="btn-change-resource"
                onClick={() => { setStep('SELECT'); setErrorMessage(null); }}
              >
                Đổi vị trí
              </button>
            </div>

            {/* Biểu mẫu điền ngày giờ, số lượng người và mục đích sử dụng */}
            <form className="selection-booking-form" onSubmit={(event) => { event.preventDefault(); handleConfirmBooking(); }}>
              <div className="selection-form-field full-width">
                <label><CalendarDays size={16} /> Ngày sử dụng</label>
                <DateInputVI className="selection-form-control selection-date-input" value={bookingDate} min={today} onChange={setBookingDate} required />
              </div>

              <div className="selection-time-grid">
                <div className="selection-form-field">
                  <label><Clock3 size={16} /> Giờ bắt đầu</label>
                  <TimeInput24H value={bookingStartTime} min={openingHour} max={closingHour} onChange={setBookingStartTime} required />
                </div>
                <div className="selection-form-field">
                  <label><Clock3 size={16} /> Giờ kết thúc</label>
                  <TimeInput24H value={bookingEndTime} min={openingHour} max={closingHour} onChange={setBookingEndTime} required />
                </div>
              </div>

              <div className="selection-hours-note">
                <Clock3 size={14} /> Giờ mở cửa toàn tòa: <strong>{openingHour} – {closingHour}</strong> · Tối đa {Math.floor(maxDurationMinutes / 60)} giờ/lượt
              </div>

              {isTableMode && (
                <div className="selection-form-field full-width">
                  <label>
                    <Users size={16} /> Số người tham gia
                    <span className="selection-capacity-hint">(Bàn {selectedItems[0]}: 1 đến tối đa {selectedCapacity} người)</span>
                  </label>
                  <input
                    className="selection-form-control"
                    type="number"
                    min={1}
                    max={selectedCapacity}
                    value={bookingParticipantCount}
                    onChange={(event) => setBookingParticipantCount(Math.max(1, Number(event.target.value) || 1))}
                    required
                  />
                </div>
              )}

              <div className="selection-form-field full-width">
                <label>Mục đích sử dụng {requiresApproval && <em>*</em>}</label>
                <textarea
                  className="selection-form-textarea"
                  value={bookingPurpose}
                  onChange={(event) => setBookingPurpose(event.target.value)}
                  placeholder={isTableMode ? 'Ví dụ: Họp nhóm, thảo luận đồ án, làm bài tập chung...' : 'Ví dụ: Tự học, ôn thi, làm bài tập...'}
                  required={requiresApproval}
                />
              </div>

              {/* Các nút quay lại hoặc xác nhận tạo đơn đặt */}
              <div className="selection-form-actions">
                <button type="button" className="selection-back-button" onClick={() => { setStep('SELECT'); setErrorMessage(null); }} disabled={submitting}>
                  <ArrowLeft size={16} /> Quay lại chọn vị trí
                </button>
                <button type="submit" className="selection-submit-button" disabled={submitting || loadingData}>
                  {loadingData
                    ? 'Đang kiểm tra vị trí...'
                    : submitting
                      ? 'Đang xác nhận...'
                      : <><CheckCircle2 size={17} /> Xác nhận đặt {isTableMode ? 'bàn' : 'ghế'}</>}
                </button>
              </div>
            </form>
          </main>
        )}
      </div>
    </div>
  );
};
