import React from 'react';
import type { SpaceType } from '../types/spaceType';
import type { Space } from '../types/space';

interface SpaceTypeDetailModalKTProps {
  isOpen: boolean;
  spaceType: SpaceType | null;
  associatedSpaces: Space[];
  isLoadingSpaces?: boolean;
  onClose: () => void;
  onEdit: (st: SpaceType) => void;
}

export const SpaceTypeDetailModalKT: React.FC<SpaceTypeDetailModalKTProps> = ({
  isOpen,
  spaceType,
  associatedSpaces,
  isLoadingSpaces = false,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !spaceType) return null;

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'WHOLE_SPACE':
        return <span className="astp-badge astp-badge-whole">WHOLE_SPACE (Toàn bộ phòng)</span>;
      case 'PER_SEAT':
        return <span className="astp-badge astp-badge-seat">PER_SEAT (Từng chỗ ngồi)</span>;
      case 'PER_TABLE':
        return <span className="astp-badge astp-badge-table">PER_TABLE (Từng bàn)</span>;
      default:
        return <span className="astp-badge">{mode}</span>;
    }
  };

  return (
    <div className="astp-modal-backdrop" onClick={onClose}>
      <div className="astp-modal-card astp-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="astp-modal-header">
          <div className="astp-modal-title-group">
            <span className="astp-modal-icon">👁️</span>
            <div>
              <h3 className="astp-modal-title">Chi tiết loại không gian: {spaceType.name}</h3>
            </div>
          </div>
          <button className="astp-modal-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="astp-modal-body" style={{ padding: '24px' }}>
          {/* Overview Grid */}
          <div className="astp-detail-grid">
            <div className="astp-detail-item">
              <span className="astp-detail-label">Tên phân loại</span>
              <span className="astp-detail-value">{spaceType.name}</span>
            </div>

            <div className="astp-detail-item">
              <span className="astp-detail-label">Chế độ đặt chỗ</span>
              <div style={{ marginTop: '4px' }}>{getModeBadge(spaceType.bookingMode)}</div>
            </div>

            <div className="astp-detail-item">
              <span className="astp-detail-label">Yêu cầu phê duyệt</span>
              <div style={{ marginTop: '4px' }}>
                {spaceType.requiresApproval ? (
                  <span className="astp-badge astp-badge-approval-yes">🛡️ Có yêu cầu duyệt</span>
                ) : (
                  <span className="astp-badge astp-badge-approval-no">⚡ Tự động duyệt</span>
                )}
              </div>
            </div>

            <div className="astp-detail-item">
              <span className="astp-detail-label">Số không gian áp dụng</span>
              <span className="astp-detail-value" style={{ color: '#2563eb', fontWeight: 600 }}>
                {associatedSpaces.length} không gian
              </span>
            </div>
          </div>

          <div className="astp-detail-item full-width" style={{ marginTop: '16px' }}>
            <span className="astp-detail-label">Mô tả quy cách / chức năng</span>
            <p className="astp-detail-desc">
              {spaceType.description || <em>(Chưa có thông tin mô tả chi tiết)</em>}
            </p>
          </div>

          {/* Associated Spaces Table */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>
              Danh sách phòng / không gian đang thuộc loại này ({associatedSpaces.length})
            </h4>

            {isLoadingSpaces ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Đang tải danh sách không gian liên kết...
              </div>
            ) : associatedSpaces.length === 0 ? (
              <div className="astp-empty-inline">
                <span>ℹ️ Hiện chưa có không gian nào được gán cho loại này.</span>
              </div>
            ) : (
              <div className="astp-inline-table-wrapper">
                <table className="astp-inline-table">
                  <thead>
                    <tr>
                      <th>Mã không gian</th>
                      <th>Tên không gian</th>
                      <th>Tòa nhà</th>
                      <th>Sức chứa</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associatedSpaces.map((sp) => (
                      <tr key={sp.id}>
                        <td>{sp.spaceCode || '—'}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{sp.name}</td>
                        <td>{sp.building || 'Chưa cập nhật'}</td>
                        <td>{sp.capacity} người</td>
                        <td>
                          <span
                            className={`astp-badge ${
                              sp.status === 'AVAILABLE'
                                ? 'astp-badge-approval-no'
                                : 'astp-badge-approval-yes'
                            }`}
                          >
                            {sp.status || 'AVAILABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="astp-modal-footer">
          <button
            type="button"
            className="astp-btn astp-btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className="astp-btn astp-btn-primary"
            onClick={() => {
              onClose();
              onEdit(spaceType);
            }}
          >
            ✏️ Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
};
