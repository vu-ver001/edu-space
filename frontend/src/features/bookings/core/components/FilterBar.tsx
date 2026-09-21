import React, { useEffect, useState } from 'react';
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
  const [timeError, setTimeError] = useState<string | null>(null);

  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    spaceService.getSpaceTypes().then(setSpaceTypes).catch(() => {});
    spaceService.getFacilities().then(setFacilities).catch(() => {});
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
    if (startTime >= endTime) {
      setTimeError(`Giờ bắt đầu (${startTime}) phải trước giờ kết thúc (${endTime}). Vui lòng chọn lại khung giờ.`);
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
      <h3 className="internal-search-title">Tìm không gian học tập</h3>

      {/* Row 1: Ngày, Giờ bắt đầu, Giờ kết thúc, Số người */}
      <div className="internal-form-row four-cols">
        <div className="internal-field">
          <label className="internal-label">Ngày sử dụng</label>
          <input
            type="date"
            className="internal-input internal-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
          />
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ bắt đầu</label>
          <input
            type="time"
            step="60"
            className={`internal-input internal-time-input ${timeError ? 'input-error' : ''}`}
            value={startTime}
            onChange={(e) => {
              const val = e.target.value;
              setStartTime(val);
              if (val >= endTime) {
                setTimeError(`Giờ bắt đầu (${val}) phải trước giờ kết thúc (${endTime}). Vui lòng chọn lại khung giờ.`);
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
            className={`internal-input internal-time-input ${timeError ? 'input-error' : ''}`}
            value={endTime}
            onChange={(e) => {
              const val = e.target.value;
              setEndTime(val);
              if (startTime >= val) {
                setTimeError(`Giờ bắt đầu (${startTime}) phải trước giờ kết thúc (${val}). Vui lòng chọn lại khung giờ.`);
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

      {/* Hiển thị cảnh báo lỗi thời gian */}
      {timeError && (
        <div className="internal-field-error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{timeError}</span>
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
                {t.name} {t.requiresApproval ? '(Yêu cầu duyệt)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="internal-field">
          <label className="internal-label">Tiện ích</label>
          <div className="internal-pills-group">
            {facilities.map((f) => {
              const isSelected = selectedFacilityIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`facility-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleFacilityToggle(f.id)}
                >
                  {f.name}
                </button>
              );
            })}
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
    </div>
  );
};
