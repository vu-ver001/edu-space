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
  const [participantCount, setParticipantCount] = useState<number>(4);
  const [selectedSpaceTypeId, setSelectedSpaceTypeId] = useState<number | undefined>(undefined);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);

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

  const handleApplyFilter = () => {
    onSearch({
      date,
      startTime: startTime + ':00',
      endTime: endTime + ':00',
      participantCount,
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
          <div className="input-with-icon">
            <input
              type="date"
              className="internal-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
            />
          </div>
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ bắt đầu</label>
          <div className="input-with-icon">
            <select
              className="internal-select"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="field-icon">🕒</span>
          </div>
        </div>

        <div className="internal-field">
          <label className="internal-label">Giờ kết thúc</label>
          <div className="input-with-icon">
            <select
              className="internal-select"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="field-icon">🕒</span>
          </div>
        </div>

        <div className="internal-field">
          <label className="internal-label">Số người</label>
          <input
            type="number"
            className="internal-input"
            value={participantCount}
            onChange={(e) => setParticipantCount(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={50}
          />
        </div>
      </div>

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
