import React from 'react';
import { Building2, Inbox } from 'lucide-react';
import type { Space } from '../types/space';
import { Tooltip } from '../../../components/common/Tooltip';
import { formatImageUrl } from '../../../utils/imageUrl';

interface Props {
  items: Space[];
  loading: boolean;
  onView: (item: Space) => void;
  onEdit: (item: Space) => void;
  onDelete: (item: Space) => void;
}

export const SpaceCardGridKT: React.FC<Props> = ({
  items,
  loading,
  onView,
  onEdit,
  onDelete,
}) => {
  // Lấy chính xác ảnh đại diện chính (cột is_primary = true trong bảng space_images)
  const getPrimaryImageUrl = (item: Space): string | null => {
    let raw: string | null = null;
    if (item.primaryImageUrl && item.primaryImageUrl.trim()) {
      raw = item.primaryImageUrl.trim();
    } else if (item.images && item.images.length > 0) {
      const primary = item.images.find(
        (img: any) => img.isPrimary === true || img.primary === true
      );
      if (primary && primary.imageUrl && primary.imageUrl.trim()) {
        raw = primary.imageUrl.trim();
      } else if (item.images[0]?.imageUrl && item.images[0].imageUrl.trim()) {
        raw = item.images[0].imageUrl.trim();
      }
    } else if (item.imageUrl && item.imageUrl.trim()) {
      raw = item.imageUrl.trim();
    }
    return formatImageUrl(raw);
  };

  // Làm sạch hiển thị tầng: "Tầng 2" -> "2"
  const cleanFloor = (floor?: string | null) => {
    if (!floor) return '';
    return floor.replace(/Tầng\s*/i, '').trim();
  };

  // Badge góc trên bên phải ảnh (Có thể đặt / Cần phê duyệt / Bảo trì / Tạm ngưng)
  const renderCardBadge = (item: Space) => {
    if (item.status === 'MAINTENANCE') {
      return (
        <span className="card-status-badge badge-warning">
          <span className="badge-dot dot-warning" />
          Đang bảo trì
        </span>
      );
    }
    if (item.status === 'INACTIVE') {
      return (
        <span className="card-status-badge badge-danger">
          <span className="badge-dot dot-danger" />
          Không hoạt động
        </span>
      );
    }

    // Khi status là AVAILABLE
    const requiresApproval =
      item.spaceType?.requiresApproval ?? item.requiresApproval ?? false;

    if (requiresApproval) {
      return (
        <span className="card-status-badge badge-warning">
          <span className="badge-dot dot-warning" />
          Cần phê duyệt
        </span>
      );
    }

    return (
      <span className="card-status-badge badge-success">
        <span className="badge-dot dot-success" />
        Có thể đặt
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-card-grid-loading">
        <p>Đang tải dữ liệu không gian...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-card-grid-empty">
        <Inbox size={42} strokeWidth={1.5} color="#94a3b8" />
        <p>Không tìm thấy không gian nào phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="space-card-grid-container">
      {items.map((item) => {
        const primaryImg = getPrimaryImageUrl(item);
        const typeName =
          item.spaceType?.name || item.spaceTypeName || 'Chưa phân loại';
        const facilities = item.facilities || [];
        const visibleFacilities = facilities.slice(0, 3);
        const remaining = facilities.length - 3;

        return (
          <div key={item.id} className="space-grid-card-item">
            {/* Top Image container */}
            <div
              className="space-card-image-wrap"
              onClick={() => onView(item)}
              title="Nhấp để xem chi tiết"
            >
              {primaryImg ? (
                <img
                  src={primaryImg}
                  alt={item.name}
                  className="space-card-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    const placeholder = parent?.querySelector(
                      '.space-card-placeholder'
                    );
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}

              <div
                className="space-card-placeholder"
                style={{ display: primaryImg ? 'none' : 'flex' }}
              >
                <Building2 size={28} color="#94a3b8" />
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Chưa có ảnh (space_images)
                </span>
              </div>

              {/* Status Badge Overlay */}
              <div className="space-card-badge-overlay">
                {renderCardBadge(item)}
              </div>
            </div>

            {/* Body Content */}
            <div className="space-card-content">
              {/* Space Name */}
              <Tooltip content={item.name} maxWidth={320}>
                <h3
                  className="space-card-title"
                  onClick={() => onView(item)}
                >
                  {item.name}
                </h3>
              </Tooltip>

              {/* Meta: Type · Building, Floor · Capacity */}
              <p className="space-card-meta">
                <Tooltip content={typeName} maxWidth={320}>
                  <span className="space-card-meta-type">
                    {typeName}
                  </span>
                </Tooltip>
                <span className="meta-dot">·</span>
                <span className="space-card-meta-loc">
                  {item.building}{item.floor ? `, tầng ${cleanFloor(item.floor)}` : ''}
                </span>
                <span className="meta-dot">·</span>
                <span className="space-card-meta-cap">{item.capacity} chỗ</span>
              </p>

              {/* Facilities list */}
              <div className="space-card-facilities">
                {facilities.length === 0 ? (
                  <span className="facility-empty-hint">Chưa có tiện ích</span>
                ) : (
                  <>
                    {visibleFacilities.map((fac) => (
                      <span
                        key={fac.id}
                        className="space-card-facility-tag"
                        title={fac.description || fac.name}
                      >
                        {fac.name}
                      </span>
                    ))}
                    {remaining > 0 && (
                      <span
                        className="space-card-facility-tag"
                        title={facilities.slice(3).map((f) => f.name).join(', ')}
                      >
                        +{remaining}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Actions: Chỉnh sửa | Xóa không gian */}
              <div className="space-card-actions">
                <button
                  type="button"
                  className="btn-card-edit"
                  onClick={() => onEdit(item)}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  className="btn-card-delete"
                  onClick={() => onDelete(item)}
                >
                  Xóa không gian
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
