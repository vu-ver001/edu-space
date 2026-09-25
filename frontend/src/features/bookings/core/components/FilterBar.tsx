import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Facility, SearchFilter, SpaceType } from '../services/spaceService';
import { spaceService } from '../services/spaceService';

interface Props {
  onSearch: (filter: SearchFilter) => void;
  isLoading: boolean;
  availableCount?: number;
}

// Tự động tính toán khung giờ khả dụng tiếp theo (không bao giờ bị quá khứ)
export const getNextAvailableSlot = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const nextHour = currentHour + 1;
  
  if (nextHour >= 21) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: tomorrow.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '10:00',
    };
  }
  
  const startH = Math.max(8, nextHour);
  const endH = Math.min(22, startH + 2);
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return {
    date: now.toISOString().split('T')[0],
    startTime: `${pad(startH)}:00`,
    endTime: `${pad(endH)}:00`,
  };
};

export const FilterBar: React.FC<Props> = ({ onSearch, isLoading, availableCount }) => {
  const defaultSlot = getNextAvailableSlot();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(defaultSlot.date);
  const [startTime, setStartTime] = useState<string>(defaultSlot.startTime);
  const [endTime, setEndTime] = useState<string>(defaultSlot.endTime);
  const [participantCount, setParticipantCount] = useState<number | string>(4);
  const [selectedSpaceTypeId, setSelectedSpaceTypeId] = useState<number | undefined>(undefined);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Đo đạc tiện ích để giới hạn tối đa 2 dòng, thêm nút "+" ở cuối dòng 2
  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(facilities.length);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const recalculateVisibleFacilities = useCallback(() => {
    if (!measureContainerRef.current || !pillsContainerRef.current || facilities.length === 0) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    const container = measureContainerRef.current;
    const currentContainerWidth = pillsContainerRef.current.clientWidth;
    if (currentContainerWidth <= 0) return;

    // Đồng bộ chiều rộng container clone đo lường
    container.style.width = `${currentContainerWidth}px`;

    const pillEls = Array.from(container.querySelectorAll<HTMLElement>('.measure-pill'));
    const plusEl = container.querySelector<HTMLElement>('.measure-plus');
    if (pillEls.length === 0) return;

    const top1 = pillEls[0].offsetTop;

    // Tìm dòng 2
    let top2: number | null = null;
    let line2StartIndex = -1;
    for (let i = 1; i < pillEls.length; i++) {
      if (pillEls[i].offsetTop > top1 + 5) {
        top2 = pillEls[i].offsetTop;
        line2StartIndex = i;
        break;
      }
    }

    // Nếu tất cả pill đều nằm trên 1 dòng
    if (top2 === null || line2StartIndex === -1) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    // Tìm pill đầu tiên rơi sang dòng 3
    let line3Index = -1;
    for (let i = line2StartIndex; i < pillEls.length; i++) {
      if (pillEls[i].offsetTop > top2 + 5) {
        line3Index = i;
        break;
      }
    }

    // Nếu không có pill nào sang dòng 3 (tất cả vừa khít trong 2 dòng)
    if (line3Index === -1) {
      setHasOverflow(false);
      setVisibleCount(facilities.length);
      return;
    }

    // Tiện ích có nhiều hơn 2 dòng -> Cần thêm nút "+" ở cuối dòng 2
    const plusWidth = plusEl ? plusEl.offsetWidth : 44;
    const gap = 8;
    const maxRight = currentContainerWidth;

    // Duyệt lùi từ phần tử cuối cùng của dòng 2 (line3Index - 1)
    let bestCount = line3Index - 1;
    for (let i = line3Index - 1; i >= line2StartIndex; i--) {
      const itemEl = pillEls[i];
      const itemRight = itemEl.offsetLeft + itemEl.offsetWidth;
      // Nếu đặt thêm nút "+" sau item này mà vẫn nằm vừa trong chiều rộng container:
      if (itemRight + gap + plusWidth <= maxRight) {
        bestCount = i + 1;
        break;
      }
    }

    setHasOverflow(true);
    setVisibleCount(Math.max(1, bestCount));
  }, [facilities]);

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

  // Phím Escape để đóng modal tiện ích
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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

  const toMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const [operatingHours, setOperatingHours] = useState<{ openingHour: string; closingHour: string }>({
    openingHour: '07:00',
    closingHour: '22:00'
  });

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

  const handleFacilityToggle = (facilityId: number) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId]
    );
  };

  const normalizeTime = (t: string) => {
    if (!t) return t;
    const parts = t.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return t;
  };

  const handleApplyFilter = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (!date) {
      setDateError('Vui lòng chọn ngày sử dụng.');
      return;
    }

    if (date < todayStr) {
      setDateError('Không được nhập ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
      return;
    }
    setDateError(null);

    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    const openM = toMinutes(operatingHours.openingHour);
    const closeM = toMinutes(operatingHours.closingHour);

    if (date === todayStr) {
      const currentM = now.getHours() * 60 + now.getMinutes();
      if (startM < currentM) {
        setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại khi tìm phòng cho ngày hôm nay.');
        return;
      }
    }

    if (startM >= endM) {
      setTimeError(`Giờ bắt đầu (${startTime}) phải trước giờ kết thúc (${endTime}). Vui lòng chọn lại khung giờ.`);
      return;
    }
    if (startM < openM || endM > closeM) {
      setTimeError(`Không gian học tập chỉ mở cửa từ ${operatingHours.openingHour} đến ${operatingHours.closingHour} hàng ngày.`);
      return;
    }
    setTimeError(null);
    onSearch({
      date,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      participantCount: Number(participantCount) || 1,
      spaceTypeId: selectedSpaceTypeId,
      facilityIds: selectedFacilityIds.length > 0 ? selectedFacilityIds : undefined
    });
  };

  return (
    <div className="internal-search-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="internal-search-title" style={{ margin: 0 }}>Tìm không gian học tập</h3>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
          Giờ mở cửa toàn tòa: {operatingHours.openingHour} – {operatingHours.closingHour}
        </span>
      </div>

      {/* Row 1: Ngày, Giờ bắt đầu, Giờ kết thúc, Số người */}
      <div className="internal-form-row four-cols">
        <div className="internal-field">
          <label className="internal-label">Ngày sử dụng</label>
          <input
            type="date"
            className={`internal-input internal-date-input ${dateError ? 'input-error' : ''}`}
            value={date}
            onChange={(e) => {
              const val = e.target.value;
              setDate(val);
              if (val && val < today) {
                setDateError('Không được nhập ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
              } else {
                setDateError(null);
                if (val === today) {
                  const nowCheck = new Date();
                  const curM = nowCheck.getHours() * 60 + nowCheck.getMinutes();
                  if (toMinutes(startTime) < curM) {
                    setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
                  } else {
                    setTimeError(null);
                  }
                }
              }
            }}
            min={today}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ bắt đầu</label>
          <input
            type="time"
            step="60"
            min={
              date === today
                ? (toMinutes(`${new Date().getHours()}:${new Date().getMinutes()}`) > toMinutes(operatingHours.openingHour)
                    ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                    : operatingHours.openingHour)
                : operatingHours.openingHour
            }
            max={operatingHours.closingHour}
            className={`internal-input internal-time-input ${timeError ? 'input-error' : ''}`}
            value={startTime}
            onChange={(e) => {
              const val = e.target.value;
              setStartTime(val);
              const valM = toMinutes(val);
              const endM = toMinutes(endTime);
              const openM = toMinutes(operatingHours.openingHour);
              const nowCheck = new Date();
              const curM = nowCheck.getHours() * 60 + nowCheck.getMinutes();

              if (date === today && valM < curM) {
                setTimeError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
              } else if (endTime && valM >= endM) {
                setTimeError(`Giờ bắt đầu (${val}) phải trước giờ kết thúc (${endTime}). Vui lòng chọn lại khung giờ.`);
              } else if (valM < openM) {
                setTimeError(`Giờ bắt đầu phải từ ${operatingHours.openingHour} trở đi (giờ mở cửa tòa nhà).`);
              } else {
                setTimeError(null);
              }
            }}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ kết thúc</label>
          <input
            type="time"
            step="60"
            min={operatingHours.openingHour}
            max={operatingHours.closingHour}
            className={`internal-input internal-time-input ${timeError ? 'input-error' : ''}`}
            value={endTime}
            onChange={(e) => {
              const val = e.target.value;
              setEndTime(val);
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
            }}
            onBlur={() => {
              if (!participantCount || Number(participantCount) < 1) {
                setParticipantCount(1);
              }
            }}
            min={1}
            max={500}
            placeholder="VD: 4"
          />
        </div>
      </div>

      {/* Hiển thị cảnh báo lỗi ngày hoặc thời gian */}
      {(dateError || timeError) && (
        <div className="internal-field-error-banner" role="alert" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <span className="error-icon">⚠️</span>
          <span>{dateError || timeError}</span>
        </div>
      )}

      {/* Row 2: Loại không gian & Tiện ích */}
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

          {/* Danh sách tiện ích hiển thị tối đa 2 dòng */}
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

            {/* Nút "+" ở cuối dòng 2 khi có nhiều hơn 2 dòng */}
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

          {/* Invisible measuring clone container để tính toán chuẩn xác */}
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

      {/* Row 3: Nút hành động "Tìm không gian" & Số phòng khả dụng */}
      <div className="internal-actions-row">
        <div className="filter-summary-count">
          {availableCount !== undefined && (
            <span className="available-count-text">
              <strong>{availableCount}</strong> phòng khả dụng
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn-internal-search"
          onClick={handleApplyFilter}
          disabled={isLoading}
        >
          {isLoading ? 'Đang kiểm tra...' : 'Tìm không gian'}
        </button>
      </div>

      {/* Modal Toàn bộ tiện ích */}
      {isModalOpen && (
        <div className="facilities-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="facilities-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
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

            {/* Modal Toolbar: Tìm kiếm & Thao tác nhanh */}
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

            {/* Modal Body: Lưới tiện ích */}
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

            {/* Modal Footer */}
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
    </div>
  );
};
