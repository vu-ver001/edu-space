import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Sparkles } from 'lucide-react';
import type { Facility, FacilityCreateRequest, FacilityUpdateRequest } from '../types/space';
import './FacilityFormModalKT.css';

interface FacilityFormModalKTProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  facility?: Facility | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: FacilityCreateRequest | FacilityUpdateRequest) => Promise<void>;
}

export const FacilityFormModalKT: React.FC<FacilityFormModalKTProps> = ({
  isOpen,
  mode,
  facility,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && facility) {
        setName(facility.name || '');
        setDescription(facility.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setValidationError(null);
    }
  }, [isOpen, mode, facility]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin. Vui lòng thử lại.';
      setValidationError(msg);
    }
  };

  return (
    <div className="astp-modal-backdrop" onClick={onClose}>
      <div className="astp-modal-card facility-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="astp-modal-header">
          <div className="astp-modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="astp-modal-title">
                {mode === 'create' ? 'Thêm tiện ích mới' : `Chỉnh sửa: ${facility?.name || ''}`}
              </h3>
              <p className="astp-modal-subtitle">
                {mode === 'create'
                  ? 'Khai báo tiện ích dùng chung cho các không gian học tập'
                  : 'Cập nhật thông tin tiện ích phòng học'}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="astp-modal-form" noValidate style={{ padding: '20px 24px' }}>
          <div className="astp-form-group" style={{ marginBottom: '18px' }}>
            <label className="astp-form-label">
              Tên tiện ích <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`astp-form-input ${validationError ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="VD: Wi-Fi, Máy chiếu Full HD, Điều hòa, Bảng trắng..."
              disabled={isLoading}
              maxLength={100}
            />
            {validationError && (
              <span className="astp-field-error-msg">{validationError}</span>
            )}
          </div>

          <div className="astp-form-group" style={{ marginBottom: '24px' }}>
            <label className="astp-form-label">Mô tả tiện ích</label>
            <textarea
              className="astp-textarea"
              style={{
                width: '100%',
                minHeight: '85px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chức năng, thông số kỹ thuật hoặc ghi chú sử dụng..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="astp-modal-footer" style={{ padding: '0', background: 'none', borderTop: 'none' }}>
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
              {isLoading ? 'Đang lưu...' : mode === 'create' ? 'Tạo tiện ích' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
