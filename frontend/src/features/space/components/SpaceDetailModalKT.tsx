import React from 'react';
import {
  X,
  Pencil,
  Building2,
  MapPin,
  Users,
  DoorOpen,
  Armchair,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Space } from '../types/space';
import './SpaceTypeFormModalKT.css';

interface Props {
  isOpen: boolean;
  space: Space | null;
  onClose: () => void;
  onEdit: (space: Space) => void;
}

export const SpaceDetailModalKT: React.FC<Props> = ({
  isOpen,
  space,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !space) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleDateString('vi-VN')} lúc ${d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return dateStr;
    }
  };

  const bookingMode = space.spaceType?.bookingMode || space.bookingMode || 'WHOLE_SPACE';

  const renderStatus = () => {
    if (space.status === 'AVAILABLE') {
      return (
        <span className="status-badge-kt status-available" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} />
          Đang hoạt động
        </span>
      );
    }
    if (space.status === 'MAINTENANCE') {
      return (
        <span className="status-badge-kt status-maintenance" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Wrench size={13} />
          Đang bảo trì
        </span>
      );
    }
    return (
      <span className="status-badge-kt status-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={13} />
        Tạm ngưng
      </span>
    );
  };

  return (
    <div className="astp-modal-backdrop" onClick={onClose}>
      <div
        className="astp-modal-card"
        style={{ maxWidth: '680px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="astp-modal-header">
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="astp-modal-icon" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <Building2 size={24} color="#2563eb" />
            </div>
            <div className="astp-modal-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="astp-modal-title" style={{ marginBottom: 0 }}>
                  {space.name}
                </h2>
                {renderStatus()}
              </div>
              <p className="astp-modal-subtitle">
                Vị trí: {space.building} - {space.floor.startsWith('Tầng') ? space.floor : `Tầng ${space.floor}`}
              </p>
            </div>
          </div>
          <button
            className="astp-modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="astp-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gallery / Primary Image preview from space_images */}
          {(() => {
            const activeImg = space.primaryImageUrl || (space.images && space.images.length > 0 ? space.images[0].imageUrl : null);
            if (!activeImg) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ borderRadius: '12px', overflow: 'hidden', maxHeight: '220px', width: '100%', border: '1px solid #e2e8f0' }}>
                  <img
                    src={activeImg}
                    alt={space.name}
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                  />
                </div>
                {space.images && space.images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {space.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.imageUrl}
                        alt="Ảnh không gian"
                        style={{
                          width: '60px',
                          height: '40px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: img.isPrimary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}


          {/* Quick Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Loại không gian */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={13} />
                Loại phòng
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {space.spaceType?.name || space.spaceTypeName || 'Chưa phân loại'}
              </div>
            </div>

            {/* Hình thức đặt */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {bookingMode === 'WHOLE_SPACE' ? <DoorOpen size={13} /> : bookingMode === 'PER_SEAT' ? <Armchair size={13} /> : <Users size={13} />}
                Hình thức đặt
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {bookingMode === 'WHOLE_SPACE' ? 'Nguyên phòng' : bookingMode === 'PER_SEAT' ? 'Chỗ ngồi độc lập' : 'Theo từng bàn'}
              </div>
            </div>

            {/* Vị trí */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} />
                Vị trí
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {space.building} • {space.floor.startsWith('Tầng') ? space.floor : `Tầng ${space.floor}`}
              </div>
            </div>

            {/* Sức chứa */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={13} />
                Sức chứa
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                {space.capacity} người
              </div>
            </div>
          </div>

          {/* Sub-breakdown for PER_SEAT or PER_TABLE */}
          {bookingMode === 'PER_SEAT' && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                Cấu hình chỗ ngồi: {space.activeSeatCount ?? space.capacity} chỗ đang hoạt động
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                Sinh viên có thể đặt chỗ riêng lẻ theo từng ghế.
              </div>
            </div>
          )}

          {bookingMode === 'PER_TABLE' && (
            <div style={{ padding: '12px 16px', background: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b21a8' }}>
                Cấu hình bàn: {space.activeTableCount ?? '—'} bàn (tổng sức chứa: {space.activeTableCapacity ?? space.capacity} người)
              </div>
              <div style={{ fontSize: '12px', color: '#7e22ce', marginTop: '2px' }}>
                Sinh viên có thể đặt theo từng bàn thảo luận nhóm.
              </div>
            </div>
          )}

          {/* Tiện ích */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#f59e0b" />
              Tiện ích đi kèm ({space.facilities?.length || 0})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {space.facilities && space.facilities.length > 0 ? (
                space.facilities.map((fac) => (
                  <span
                    key={fac.id}
                    style={{
                      padding: '5px 12px',
                      background: '#f1f5f9',
                      borderRadius: '16px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                    }}
                    title={fac.description || fac.name}
                  >
                    ✓ {fac.name}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa thiết lập tiện ích</span>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Mô tả chi tiết
            </span>
            <p
              style={{
                fontSize: '13.5px',
                color: '#475569',
                margin: '6px 0 0',
                lineHeight: 1.6,
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #f1f5f9',
              }}
            >
              {space.description || 'Không có mô tả bổ sung cho không gian này.'}
            </p>
          </div>

          {/* Timestamps */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: '12px',
              color: '#64748b',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} />
              Ngày tạo: {formatDate(space.createdAt)}
            </span>
            {space.updatedAt && (
              <span>Cập nhật: {formatDate(space.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Footer */}
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
              onEdit(space);
            }}
          >
            <Pencil size={14} style={{ marginRight: '6px' }} />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};
