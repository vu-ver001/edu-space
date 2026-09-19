import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  warningNote?: string;
  errorMessage?: string | null;
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = true,
  isLoading = false,
  warningNote,
  errorMessage,
  isConfirmDisabled = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-blur">
      <div className="modal-dialog-box">
        <div className="modal-dialog-header">
          <h3 style={{ color: isDanger ? '#ef4444' : '#0f172a' }}>{title}</h3>
          <button className="modal-close-btn" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-dialog-body">
          <p style={{ fontSize: '14.5px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>

          {errorMessage && (
            <div className="modal-error-banner">
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          {warningNote && !errorMessage && (
            <div className="modal-alert-error" style={{ marginTop: '8px' }}>
              <AlertTriangle size={20} />
              <span>{warningNote}</span>
            </div>
          )}
        </div>

        <div className="modal-dialog-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn-modal-danger' : 'btn-modal-submit'}
            onClick={onConfirm}
            disabled={isLoading || isConfirmDisabled}
            title={isConfirmDisabled ? 'Chức năng bị khóa do điều kiện chưa thỏa mãn' : undefined}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
