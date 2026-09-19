import React, { useState, useEffect } from 'react';
import type { MaintenanceBlock, MaintenanceCreateRequest, MaintenanceUpdateRequest } from '../types/staff';
import type { Space } from '../../space/types/space';

interface MaintenanceFormModalKTProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  maintenance?: MaintenanceBlock | null;
  spaces: Space[];
  defaultSpaceId?: number;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (spaceId: number, data: MaintenanceCreateRequest | MaintenanceUpdateRequest) => Promise<void>;
}

export const MaintenanceFormModalKT: React.FC<MaintenanceFormModalKTProps> = ({
  isOpen,
  mode,
  maintenance,
  spaces,
  defaultSpaceId,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [spaceId, setSpaceId] = useState<number>(defaultSpaceId || (spaces[0]?.id || 0));
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && maintenance) {
        setSpaceId(maintenance.spaceId);
        setReason(maintenance.reason || '');
        setStartTime(maintenance.startTime ? maintenance.startTime.slice(0, 16) : '');
        setEndTime(maintenance.endTime ? maintenance.endTime.slice(0, 16) : '');
        setDescription('');
      } else {
        setSpaceId(defaultSpaceId || (spaces[0]?.id || 0));
        setReason('');
        // default next hour to +3 hours
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const next = new Date(now);
        next.setHours(next.getHours() + 2);

        const pad = (n: number) => (n < 10 ? `0${n}` : n);
        const formatLocalISO = (d: Date) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        setStartTime(formatLocalISO(now));
        setEndTime(formatLocalISO(next));
        setDescription('');
      }
      setError(null);
    }
  }, [isOpen, mode, maintenance, spaces, defaultSpaceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do bảo trì.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    setError(null);
    try {
      await onSubmit(spaceId, {
        reason: reason.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        description: description.trim() ? description.trim() : undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.');
    }
  };

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="staff-modal-header">
          <div className="staff-modal-title-group">
            <span style={{ fontSize: '24px' }}>🛠️</span>
            <div>
              <h3 className="staff-modal-title">
                {mode === 'create' ? 'Tạo khoảng bảo trì không gian' : 'Cập nhật thông tin bảo trì'}
              </h3>
              <p className="staff-modal-subtitle">
                Trong thời gian bảo trì, không gian sẽ bị khóa lịch đặt cho sinh viên
              </p>
            </div>
          </div>
          <button className="staff-modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="staff-alert staff-alert-error" style={{ margin: '16px 24px 0' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="staff-modal-form">
          {mode === 'create' && (
            <div className="staff-form-group">
              <label className="staff-form-label">
                Không gian cần bảo trì <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="staff-select"
                value={spaceId}
                onChange={(e) => setSpaceId(Number(e.target.value))}
                disabled={isLoading}
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.building || 'Tòa nhà'} • Sức chứa {s.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="staff-form-group">
            <label className="staff-form-label">
              Lý do bảo trì <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="staff-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Kiểm tra hệ thống điều hòa, Nâng cấp máy chiếu..."
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="staff-form-group">
              <label className="staff-form-label">
                Bắt đầu từ <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="datetime-local"
                className="staff-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="staff-form-group">
              <label className="staff-form-label">
                Kết thúc lúc <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="datetime-local"
                className="staff-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="staff-form-group">
            <label className="staff-form-label">Ghi chú bổ sung</label>
            <textarea
              className="staff-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhân sự kỹ thuật phụ trách, số liên hệ nhà thầu..."
              disabled={isLoading}
            />
          </div>

          <div className="staff-modal-footer">
            <button
              type="button"
              className="staff-btn staff-btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="staff-btn staff-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : mode === 'create' ? 'Tạo bảo trì' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
