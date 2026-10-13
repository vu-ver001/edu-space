// Thanh bộ lọc tìm kiếm phòng học và kiểm tra khả dụng theo thời gian thực (Module M04 - Khánh Vân).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Facility, SearchFilter, SpaceType } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import { DateInputVI } from './DateInputVI';
import { TimeInput24H } from './TimeInput24H';
import '../pages/SearchSpacesPage.css';

// Định nghĩa các thuộc tính Props đầu vào của thanh công cụ tìm kiếm phòng.
interface Props {
  onSearch: (filter: SearchFilter) => void;
  isLoading: boolean;
  availableCount?: number;
  initialFilter?: SearchFilter;
}

// Chuyển đổi đối tượng Date thành chuỗi định dạng YYYY-MM-DD theo múi giờ địa phương.
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Component FilterBar cung cấp bộ lọc động đa tiêu chí theo khung giờ, số người và tiện ích.
export const FilterBar: React.FC<Props> = ({ onSearch, isLoading, availableCount, initialFilter }) => {
  // Lấy ngày hiện tại và khởi tạo các biến trạng thái tiêu chí tìm kiếm.
  const today = toLocalDateString(new Date());
  const [date, setDate] = useState<string>(initialFilter?.date || '');
  const [startTime, setStartTime] = useState<string>(initialFilter?.startTime?.substring(0, 5) || '');
  const [endTime, setEndTime] = useState<string>(initialFilter?.endTime?.substring(0, 5) || '');
  const [participantCount, setParticipantCount] = useState<number | string>(initialFilter?.participantCount || '');
  const [selectedSpaceTypeId, setSelectedSpaceTypeId] = useState<number | undefined>(initialFilter?.spaceTypeId);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>(initialFilter?.facilityIds || []);
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<string | null>(null);

  // Danh mục loại không gian và tiện ích nạp từ cơ sở dữ liệu.
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Quản lý đo đạc kích thước danh sách tiện ích để hiển thị tối đa 2 dòng kèm nút mở rộng (+).
  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(facilities.length);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Thuật toán đo lường tính toán số lượng tiện ích hiển thị vừa vặn trong 2 dòng giao diện.
  const recalculateVisibleFacilities = useCallback(() => {
    if (!measureContainerRef.current || !pillsContainerRef.current || facilities.length === 0) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    const container = measureContainerRef.current;
    const currentContainerWidth = pillsContainerRef.current.clientWidth;
    if (currentContainerWidth <= 0) return;

    // Đồng bộ chiều rộng phần tử container giả lập đo lường.
    container.style.width = `${currentContainerWidth}px`;

    const pillEls = Array.from(container.querySelectorAll<HTMLElement>('.measure-pill'));
    const plusEl = container.querySelector<HTMLElement>('.measure-plus');
    if (pillEls.length === 0) return;

    const top1 = pillEls[0].offsetTop;

    // Xác định vị trí phần tử bắt đầu dòng 2.
    let top2: number | null = null;
    let line2StartIndex = -1;
    for (let i = 1; i < pillEls.length; i++) {
      if (pillEls[i].offsetTop > top1 + 5) {
        top2 = pillEls[i].offsetTop;
        line2StartIndex = i;
        break;
      }
    }

    // Trường hợp tất cả các tiện ích đều nằm vừa vặn trên dòng 1.
    if (top2 === null || line2StartIndex === -1) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    // Xác định phần tử đầu tiên tràn sang dòng 3.
    let line3Index = -1;
    for (let i = line2StartIndex; i < pillEls.length; i++) {
      if (pillEls[i].offsetTop > top2 + 5) {
        line3Index = i;
        break;
      }
    }

    // Trường hợp toàn bộ tiện ích nằm vừa vặn trong 2 dòng.
    if (line3Index === -1) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    // Trường hợp tràn sang dòng 3: tính toán thêm nút (+) ở cuối dòng 2.
    const plusWidth = plusEl ? plusEl.offsetWidth : 44;
    const gap = 8;
    const maxRight = currentContainerWidth;

    let bestCount = line3Index - 1;
    for (let i = line3Index - 1; i >= line2StartIndex; i--) {
      const itemEl = pillEls[i];
      const itemRight = itemEl.offsetLeft + itemEl.offsetWidth;
      if (itemRight + gap + plusWidth <= maxRight) {
        bestCount = i + 1;
        break;
      }
    }

    setHasOverflow(true);
    setVisibleCount(Math.max(1, bestCount));
  }, [facilities]);

  // Lắng nghe sự kiện thay đổi kích thước cửa sổ để tính toán lại số tiện ích hiển thị.
  useEffect(() => {
    recalculateVisibleFacilities();

    const container = pillsContainerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        recalculateVisibleFacilities();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      recalculateVisibleFacilities();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [recalculateVisibleFacilities]);

  // Hỗ trợ phím Escape để đóng nhanh hộp thoại danh sách tiện ích.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Định dạng chuỗi thời gian thành dạng HH:mm chuẩn.
  const formatTimeHHmm = (timeStr?: string, defaultVal: string = '07:00'): string => {
    if (!timeStr) return defaultVal;
    const trimmed = String(timeStr).trim();
    if (/^\d{1,2}$/.test(trimmed)) {
      const h = parseInt(trimmed, 10);
      return `${String(h).padStart(2, '0')}:00`;
    }
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
      const [h, m] = trimmed.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    return defaultVal;
  };

  // Chuyển đổi chuỗi giờ HH:mm sang tổng số phút trong ngày.
  const toMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Lưu trữ khung giờ mở và đóng cửa của toàn bộ tòa nhà lấy từ CSDL.
  const [operatingHours, setOperatingHours] = useState<{ openingHour: string; closingHour: string }>({
    openingHour: '07:00',
    closingHour: '22:00'
  });

  // Tải danh mục loại phòng, tiện ích và chính sách giờ mở cửa khi khởi tạo.
  useEffect(() => {
    spaceService.getSpaceTypes().then(setSpaceTypes).catch(() => {});
    spaceService.getFacilities().then(setFacilities).catch(() => {});
    spaceService.getOperatingHours().then((res) => {
      if (res) {
        setOperatingHours({
          openingHour: formatTimeHHmm(res.openingHour, '07:00'),
          closingHour: formatTimeHHmm(res.closingHour, '22:00')
        });
      }
    }).catch(() => {});
  }, []);

  // Xử lý bật/tắt chọn một tiện ích lọc phòng học.
  const handleFacilityToggle = (facilityId: number) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId]
    );
  };

  // Chuẩn hóa thời gian sang định dạng HH:mm:ss trước khi truyền vào API tìm kiếm.
  const normalizeTime = (t: string) => {
    if (!t) return t;
    const parts = t.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return t;
  };

  // Xác thực các tiêu chí tìm kiếm và kích hoạt hàm callback onSearch.
  const handleApplyFilter = () => {
    const now = new Date();
    const todayStr = toLocalDateString(now);

    // Kiểm tra không cho phép chọn ngày trong quá khứ.
    if (date && date < todayStr) {
      setDateError('Không được nhập ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
      return;
    }
    setDateError(null);

    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    const openM = toMinutes(operatingHours.openingHour);
    const closeM = toMinutes(operatingHours.closingHour);

    // Kiểm tra giờ bắt đầu không được nhỏ hơn giờ hiện tại nếu tìm cho ngày hôm nay.
    if (date === todayStr && startTime) {
      const currentM = now.getHours() * 60 + now.getMinutes();
      if (startM < currentM) {
        setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại khi tìm phòng cho ngày hôm nay.');
        return;
      }
    }

    // Kiểm tra giờ bắt đầu phải trước giờ kết thúc và nằm trong giờ mở cửa.
    if (startTime && endTime && startM >= endM) {
      setTimeError(`Giờ bắt đầu (${startTime}) phải trước giờ kết thúc (${endTime}). Vui lòng chọn lại khung giờ.`);
      return;
    }
    if ((startTime && startM < openM) || (endTime && endM > closeM)) {
      setTimeError(`Không gian học tập chỉ mở cửa từ ${operatingHours.openingHour} đến ${operatingHours.closingHour} hàng ngày.`);
      return;
    }
    setTimeError(null);

    // Kiểm tra số lượng người tham gia hợp lệ.
    if (participantCount !== '' && Number(participantCount) < 1) {
      setParticipantError('Vui lòng nhập số người tham gia từ 1 người trở lên.');
      return;
    }
    setParticipantError(null);

    // Phát sự kiện tìm kiếm tới trang chính để gọi API máy chủ.
    onSearch({
      date,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      participantCount: participantCount === '' ? undefined : Number(participantCount),
      spaceTypeId: selectedSpaceTypeId,
      facilityIds: selectedFacilityIds.length > 0 ? selectedFacilityIds : undefined
    });
  };

  return (
    // Biểu mẫu bộ lọc tìm kiếm không gian học tập
    <form
      className="internal-search-card"
      onSubmit={(event) => {
        event.preventDefault();
        handleApplyFilter();
      }}
    >
      {/* Tiêu đề biểu mẫu và nhãn giờ mở cửa toàn tòa lấy từ CSDL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="internal-search-title" style={{ margin: 0 }}>Tìm không gian học tập</h3>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
          Giờ mở cửa toàn tòa: {operatingHours.openingHour} – {operatingHours.closingHour}
        </span>
      </div>

      {/* Dòng 1: Các trường ngày sử dụng, giờ bắt đầu, kết thúc và số lượng người */}
      <div className="internal-form-row four-cols">
        <div className="internal-field">
          <label className="internal-label">Ngày sử dụng</label>
          <DateInputVI
            className={`internal-input internal-date-input ${dateError ? 'input-error' : ''}`}
            value={date}
            min={today}
            onChange={(val) => {
              setDate(val);
              if (val && val < today) {
                setDateError('Không được nhập ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
              } else {
                setDateError(null);
                if (val === today) {
                  const nowCheck = new Date();
                  const curM = nowCheck.getHours() * 60 + nowCheck.getMinutes();
                  if (startTime && toMinutes(startTime) < curM) {
                    setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
                  } else {
                    setTimeError(null);
                  }
                }
              }
            }}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ bắt đầu</label>
          <TimeInput24H
            min={
              date === today
                ? (toMinutes(`${new Date().getHours()}:${new Date().getMinutes()}`) > toMinutes(operatingHours.openingHour)
                    ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                    : operatingHours.openingHour)
                : operatingHours.openingHour
            }
            max={operatingHours.closingHour}
            value={startTime}
            placeholder="HH:mm"
            onChange={(val) => {
              setStartTime(val);
              if (!val) {
                setTimeError(null);
                return;
              }
              const valM = toMinutes(val);
              const endM = toMinutes(endTime);
              const openM = toMinutes(operatingHours.openingHour);
              const nowCheck = new Date();
              const curM = nowCheck.getHours() * 60 + nowCheck.getMinutes();

              if (date === today && valM < curM) {
                setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
              } else if (valM < openM) {
                setTimeError(`Giờ bắt đầu phải từ ${operatingHours.openingHour} trở đi (giờ mở cửa tòa nhà).`);
              } else {
                if (endTime && valM >= endM) {
                  const closeM = toMinutes(operatingHours.closingHour);
                  const suggestedEndM = Math.min(valM + 120, closeM);
                  const h = Math.floor(suggestedEndM / 60);
                  const m = suggestedEndM % 60;
                  const newEndStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  setEndTime(newEndStr);
                }
                setTimeError(null);
              }
            }}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ kết thúc</label>
          <TimeInput24H
            min={operatingHours.openingHour}
            max={operatingHours.closingHour}
            value={endTime}
            placeholder="HH:mm"
            onChange={(val) => {
              setEndTime(val);
              if (!val) {
                setTimeError(null);
                return;
              }
              const valM = toMinutes(val);
              const startM = toMinutes(startTime);
              const closeM = toMinutes(operatingHours.closingHour);
              if (startTime && startM >= valM) {
                setTimeError(`Giờ bắt đầu (${startTime}) phải trước giờ kết thúc (${val}). Vui lòng chọn lại khung giờ.`);
              } else if (valM > closeM) {
                setTimeError(`Giờ kết thúc không được vượt quá ${operatingHours.closingHour} (giờ đóng cửa tòa nhà).`);
              } else {
                setTimeError(null);
              }
            }}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Số người</label>
          <input
            type="number"
            className="internal-input"
            value={participantCount}
            onChange={(e) => {
              const val = e.target.value;
              setParticipantCount(val === '' ? '' : Math.max(1, parseInt(val) || 1));
              setParticipantError(null);
            }}
            min={1}
            max={500}
            placeholder="Nhập số người"
          />
        </div>
      </div>

      {/* Hiển thị banner cảnh báo lỗi ngày hoặc thời gian */}
      {(dateError || timeError || participantError) && (
        <div className="internal-field-error-banner" role="alert" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <span className="error-icon">⚠️</span>
          <span>{dateError || timeError || participantError}</span>
        </div>
      )}

      {/* Dòng 2: Lựa chọn loại không gian và danh mục tiện ích */}
      <div className="internal-form-row two-cols">
        <div className="internal-field">
          <label className="internal-label">Loại không gian</label>
          <select
            className="internal-select"
            value={selectedSpaceTypeId ?? ''}
            onChange={(e) => setSelectedSpaceTypeId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Tất cả</option>
            {spaceTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="internal-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="internal-label" style={{ margin: 0 }}>Tiện ích</label>
            {selectedFacilityIds.length > 0 && (
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>
                Đã chọn {selectedFacilityIds.length}
              </span>
            )}
          </div>

          {/* Nhóm nút chọn nhanh tiện ích hiển thị trong 2 dòng */}
          <div
            ref={pillsContainerRef}
            className="internal-pills-group"
            style={{
              maxHeight: '78px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {(hasOverflow ? facilities.slice(0, visibleCount) : facilities).map((f) => {
              const isSelected = selectedFacilityIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`facility-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleFacilityToggle(f.id)}
                  title={f.name}
                >
                  {f.name}
                </button>
              );
            })}

            {/* Nút cộng (+) mở modal toàn bộ tiện ích khi số lượng tràn */}
            {hasOverflow && (
              (() => {
                const hiddenSelectedCount = facilities
                  .slice(visibleCount)
                  .filter((f) => selectedFacilityIds.includes(f.id)).length;
                return (
                  <button
                    type="button"
                    className={`facility-plus-btn ${hiddenSelectedCount > 0 ? 'has-active' : ''}`}
                    onClick={() => setIsModalOpen(true)}
                    title={`Xem toàn bộ ${facilities.length} tiện ích`}
                  >
                    <span>+</span>
                    {hiddenSelectedCount > 0 && (
                      <span className="plus-badge">+{hiddenSelectedCount}</span>
                    )}
                  </button>
                );
              })()
            )}
          </div>

          {/* Phần tử container ẩn để tính toán kích thước dòng thực tế */}
          <div
            ref={measureContainerRef}
            style={{
              position: 'absolute',
              top: -9999,
              left: -9999,
              visibility: 'hidden',
              pointerEvents: 'none',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
            aria-hidden="true"
          >
            {facilities.map((f) => (
              <button key={f.id} type="button" className="facility-pill-btn measure-pill">
                {f.name}
              </button>
            ))}
            <button type="button" className="facility-plus-btn measure-plus">
              <span>+</span>
              <span className="plus-badge">+1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dòng 3: Hiển thị số lượng phòng khả dụng và nút kích hoạt tìm kiếm */}
      <div className="internal-actions-row">
        <div className="filter-summary-count">
          {availableCount !== undefined && (
            <span className="available-count-text">
              <strong>{availableCount}</strong> phòng khả dụng
            </span>
          )}
        </div>
        <button
          type="submit"
          className="btn-internal-search"
          onClick={handleApplyFilter}
          disabled={isLoading}
        >
          {isLoading ? 'Đang kiểm tra...' : 'Tìm không gian'}
        </button>
      </div>

      {/* Hộp thoại Modal chọn tiện ích đầy đủ với chức năng tìm kiếm nhanh */}
      {isModalOpen && (
        <div className="facilities-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="facilities-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Tiêu đề modal danh sách tiện ích */}
            <div className="facilities-modal-header">
              <div className="facilities-modal-title-wrap">
                <div className="facilities-modal-icon-badge">✨</div>
                <div>
                  <h3 className="facilities-modal-title">Tất cả tiện ích không gian</h3>
                  <p className="facilities-modal-subtitle">
                    Chọn các tiện ích mong muốn để lọc không gian phù hợp với nhu cầu
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="facilities-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                title="Đóng (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Thanh tìm kiếm và các nút thao tác chọn tất cả / bỏ chọn */}
            <div className="facilities-modal-toolbar">
              <div className="facilities-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="facilities-search-input"
                  placeholder="Tìm kiếm tiện ích (VD: Máy chiếu, Điều hòa, Bảng...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="facilities-quick-actions">
                <span className="facilities-counter-badge">
                  Đã chọn <strong>{selectedFacilityIds.length}</strong> / {facilities.length}
                </span>
                {selectedFacilityIds.length < facilities.length ? (
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => setSelectedFacilityIds(facilities.map((f) => f.id))}
                  >
                    Chọn tất cả
                  </button>
                ) : (
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => setSelectedFacilityIds([])}
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
            </div>

            {/* Lưới danh sách các thẻ tiện ích để tích chọn */}
            <div className="facilities-modal-body">
              {facilities
                .filter((f) => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                .length === 0 ? (
                <div className="facilities-empty-state">
                  <span style={{ fontSize: '32px' }}>🔎</span>
                  <p>Không tìm thấy tiện ích nào khớp với "{searchQuery}"</p>
                </div>
              ) : (
                <div className="facilities-grid">
                  {facilities
                    .filter((f) => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .map((f) => {
                      const isSelected = selectedFacilityIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          className={`facility-grid-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleFacilityToggle(f.id)}
                        >
                          <div className={`facility-checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected ? '✓' : ''}
                          </div>
                          <span className="facility-grid-name">{f.name}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Các nút đóng và áp dụng bộ lọc tiện ích */}
            <div className="facilities-modal-footer">
              <div className="facilities-footer-left">
                {selectedFacilityIds.length > 0 && (
                  <button
                    type="button"
                    className="btn-clear-facilities"
                    onClick={() => setSelectedFacilityIds([])}
                  >
                    Xóa tất cả đã chọn
                  </button>
                )}
              </div>
              <div className="facilities-footer-right">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn-modal-apply"
                  onClick={() => setIsModalOpen(false)}
                >
                  Áp dụng ({selectedFacilityIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
