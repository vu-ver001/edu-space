import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { SpaceType, SpaceTypeCreateRequest, SpaceTypeUpdateRequest, BookingMode } from '../types/spaceType';
import './SpaceTypeFormModalKT.css';

interface SpaceTypeFormModalKTProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  spaceType?: SpaceType | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: SpaceTypeCreateRequest | SpaceTypeUpdateRequest) => Promise<void>;
}

export const SpaceTypeFormModalKT: React.FC<SpaceTypeFormModalKTProps> = ({
  isOpen,
  mode,
  spaceType,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bookingMode, setBookingMode] = useState<BookingMode>('WHOLE_SPACE');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && spaceType) {
        setName(spaceType.name || '');
        setDescription(spaceType.description || '');
        setBookingMode(spaceType.bookingMode || 'WHOLE_SPACE');
        setRequiresApproval(Boolean(spaceType.requiresApproval));
      } else {
        setName('');
        setDescription('');
        setBookingMode('WHOLE_SPACE');
        setRequiresApproval(false);
      }
      setValidationError(null);
    }
  }, [isOpen, mode, spaceType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        bookingMode,
        requiresApproval,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin. Vui lòng thử lại.';
      setValidationError(msg);
    }
  };

  return (
    <div className="astp-modal-backdrop" onClick={onClose}>
      <div className="astp-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="astp-modal-header">
          <div className="astp-modal-title-group">
            <h3 className="astp-modal-title">
              {mode === 'create' ? 'Thêm loại không gian' : `Chỉnh sửa: ${spaceType?.name}`}
            </h3>
            <p className="astp-modal-subtitle">
              {mode === 'create'
                ? 'Nhập thông tin và hình thức đặt chỗ.'
                : 'Cập nhật cấu hình loại không gian.'}
            </p>
          </div>
          <button className="astp-modal-close-btn" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {validationError && (
          <div className="astp-alert astp-alert-error" style={{ margin: '16px 24px 0', display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={17} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="astp-modal-form" noValidate>
          <div className="astp-form-group">
            <label className="astp-form-label">
              Tên loại không gian <span className="astp-required">*</span>
            </label>
            <input
              type="text"
              className={`astp-input ${validationError ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="VD: Phòng học nhóm tiêu chuẩn, Hội trường lớn, Phòng Lab..."
              disabled={isLoading}
            />
            {validationError && (
              <span className="astp-field-error-msg">{validationError}</span>
            )}
          </div>

          <div className="astp-form-group">
            <label className="astp-form-label">Mô tả chức năng</label>
            <textarea
              className="astp-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục đích sử dụng, trang thiết bị đi kèm hoặc đối tượng được phép đặt..."
              disabled={isLoading}
            />
          </div>

          <div className="astp-form-group">
            <label className="astp-form-label">
              Hình thức đặt chỗ <span className="astp-required">*</span>
            </label>
            <div className="astp-mode-options">
              <label className={`astp-mode-card ${bookingMode === 'WHOLE_SPACE' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="WHOLE_SPACE"
                  checked={bookingMode === 'WHOLE_SPACE'}
                  onChange={() => setBookingMode('WHOLE_SPACE')}
                  disabled={isLoading}
                />
                <div className="astp-mode-card-content">
                  <div className="astp-mode-title">Đặt nguyên phòng (Whole Space)</div>
                  <div className="astp-mode-desc">
                    Đặt trọn gói cả phòng hoặc hội trường cho 1 nhóm hoặc 1 sự kiện trong khung giờ nhất định.
                  </div>
                </div>
              </label>

              <label className={`astp-mode-card ${bookingMode === 'PER_SEAT' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="PER_SEAT"
                  checked={bookingMode === 'PER_SEAT'}
                  onChange={() => setBookingMode('PER_SEAT')}
                  disabled={isLoading}
                />
                <div className="astp-mode-card-content">
                  <div className="astp-mode-title">Đặt theo chỗ ngồi (Per Seat)</div>
                  <div className="astp-mode-desc">
                    Người dùng chọn và đặt từng ghế ngồi cụ thể (dành cho phòng tự học, thư viện, khu vực làm việc chung).
                  </div>
                </div>
              </label>

              <label className={`astp-mode-card ${bookingMode === 'PER_TABLE' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="PER_TABLE"
                  checked={bookingMode === 'PER_TABLE'}
                  onChange={() => setBookingMode('PER_TABLE')}
                  disabled={isLoading}
                />
                <div className="astp-mode-card-content">
                  <div className="astp-mode-title">Đặt theo từng bàn (Per Table)</div>
                  <div className="astp-mode-desc">
                    Người dùng đặt theo từng cụm bàn thảo luận nhóm trong không gian mở.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="astp-form-group">
            <div className="astp-switch-group">
              <label className="astp-switch-container">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="astp-switch-slider"></span>
              </label>
              <div className="astp-switch-label-group">
                <span className="astp-switch-title">Yêu cầu Quản trị viên / Nhân viên xét duyệt</span>
                <span className="astp-switch-hint">
                  Khi bật, các yêu cầu đặt phòng thuộc loại này cần được nhân viên duyệt thì mới thành công. Khi tắt, người dùng đặt xong sẽ được xác nhận tự động.
                </span>
              </div>
            </div>
          </div>

          <div className="astp-modal-footer">
            <button
              type="button"
              className="astp-btn astp-btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="astp-btn astp-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : mode === 'create' ? 'Tạo loại không gian' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
