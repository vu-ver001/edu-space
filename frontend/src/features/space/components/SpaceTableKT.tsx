import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  Inbox,
  Users,
  User,
  Armchair,
  BookOpen,
  Presentation,
  DoorOpen,
  Building2,
} from 'lucide-react';
import { Tooltip } from '../../../components/common/Tooltip';
import type { Space } from '../types/space';
import { formatImageUrl } from '../../../utils/imageUrl';

interface Props {
  items: Space[];
  loading: boolean;
  startIndex: number;
  onView: (item: Space) => void;
  onEdit: (item: Space) => void;
  onDelete: (item: Space) => void;
}


export const SpaceTableKT: React.FC<Props> = ({
  items,
  loading,
  startIndex,
  onView,
  onEdit,
  onDelete,
}) => {
  // Làm sạch hiển thị tầng: "Tầng 2" -> "2" để ghép "Tòa B - Tầng 2"
  const formatLocation = (building: string, floor: string) => {
    const cleanFloor = floor.replace(/Tầng\s*/i, '').trim();
    return `${building} - Tầng ${cleanFloor}`;
  };

  // Badge loại không gian theo đúng bảng màu & icon pastel
  const renderSpaceTypeBadge = (item: Space) => {
    const typeName = item.spaceType?.name || item.spaceTypeName || 'Chưa phân loại';
    const lower = typeName.toLowerCase();
    const mode = item.spaceType?.bookingMode || item.bookingMode;

    const badge = (className: string, Icon: React.ElementType) => (
      <Tooltip content={typeName} maxWidth={320}>
        <span className={`space-type-badge-pill ${className}`}>
          <Icon size={13} className="space-type-icon" />
          <span>{typeName}</span>
        </span>
      </Tooltip>
    );

    if (lower.includes('thảo luận') || lower.includes('thao luan')) {
      return badge('badge-type-discussion', Users);
    }
    if (lower.includes('học nhóm') || lower.includes('hoc nhom')) {
      return badge('badge-type-group', User);
    }
    if (lower.includes('tự học') || lower.includes('tu hoc')) {
      return badge('badge-type-self-study', BookOpen);
    }
    if (lower.includes('bàn học') || lower.includes('ban hoc') || mode === 'PER_TABLE') {
      return badge('badge-type-desk', Armchair);
    }
    if (lower.includes('seminar') || lower.includes('hội thảo') || lower.includes('thuyết trình')) {
      return badge('badge-type-seminar', Presentation);
    }
    if (mode === 'PER_SEAT') {
      return badge('badge-type-desk', Armchair);
    }
    return badge('badge-type-group', DoorOpen);
  };

  // Badge trạng thái theo chuẩn (Hoạt động, Bảo trì, Ngưng hoạt động)
  const renderStatusBadge = (status: Space['status']) => {
    if (status === 'AVAILABLE') {
      return <span className="status-badge-pill status-pill-available">Hoạt động</span>;
    }
    if (status === 'MAINTENANCE') {
      return <span className="status-badge-pill status-pill-maintenance">Bảo trì</span>;
    }
    return <span className="status-badge-pill status-pill-inactive">Ngưng hoạt động</span>;
  };

  // Lấy chính xác ảnh đại diện chính (cột is_primary = true trong bảng space_images)
  const getPrimaryImageUrl = (item: Space): string | null => {
    let raw: string | null = null;
    // 1. Backend trả về trường primaryImageUrl (được filter từ space_images có is_primary = true)
    if (item.primaryImageUrl && item.primaryImageUrl.trim()) {
      raw = item.primaryImageUrl.trim();
    } else if (item.images && item.images.length > 0) {
      // 2. Tìm trong danh sách images ảnh có isPrimary = true (hoặc primary = true do Jackson serialize)
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

  return (
    <div className="table-responsive-wrapper">
      <table className="custom-spaces-table-v2">
        <thead>
          <tr>
            <th style={{ width: '38px' }} className="col-center col-compact">#</th>
            <th style={{ width: '84px' }} className="col-compact">Hình ảnh</th>
            <th style={{ width: '100px' }} className="col-compact">Mã không gian</th>
            <th style={{ width: '140px' }}>Tên không gian</th>
            <th style={{ width: '130px' }}>Loại không gian</th>
            <th style={{ width: '115px' }}>Tòa nhà</th>
            <th style={{ width: '60px' }} className="col-center col-compact">Sức chứa</th>
            <th style={{ width: '105px' }} className="col-center col-compact">Trạng thái</th>
            <th style={{ width: '128px' }} className="col-center col-compact">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="empty-table-state">
                <p>Đang tải dữ liệu không gian...</p>
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={9} className="empty-table-state">
                <Inbox size={36} strokeWidth={1.5} color="#94a3b8" />
                <p>Không tìm thấy không gian nào phù hợp với bộ lọc.</p>
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const primaryImgUrl = getPrimaryImageUrl(item);

              return (
                <tr key={item.id}>
                  {/* 1. # */}
                  <td className="col-center col-index-text col-compact">
                    {startIndex + idx + 1}
                  </td>

                  {/* 2. Hình ảnh (lấy đúng ảnh có is_primary = true trong bảng space_images) */}
                  <td className="col-compact">
                    <div className="space-table-thumb-container">
                      {primaryImgUrl ? (
                        <img
                          src={primaryImgUrl}
                          alt={item.name}
                          className="space-table-thumb-img"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            const placeholder = parent?.querySelector('.space-thumb-placeholder-box');
                            if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="space-thumb-placeholder-box"
                        style={{ display: primaryImgUrl ? 'none' : 'flex' }}
                        title="Chưa có ảnh đại diện chính (cột is_primary = true trong space_images)"
                      >
                        <Building2 size={18} color="#94a3b8" />
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Chưa có ảnh</span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Mã không gian (Lấy trực tiếp từ CSDL: cột space_code) */}
                  <td className="col-compact">
                    <span className="space-code-badge">
                      {item.spaceCode || '—'}
                    </span>
                  </td>

                  {/* 4. Tên không gian */}
                  <td>
                    <Tooltip content={item.name} maxWidth={320}>
                      <span className="space-name-plain">{item.name}</span>
                    </Tooltip>
                  </td>

                  {/* 5. Loại không gian (Pill badge pastel có icon) */}
                  <td>
                    {renderSpaceTypeBadge(item)}
                  </td>

                  {/* 6. Tòa nhà (VD: Tòa B - Tầng 2) */}
                  <td>
                    <span className="space-building-text">
                      {formatLocation(item.building, item.floor)}
                    </span>
                  </td>

                  {/* 7. Sức chứa (Số đơn giản) */}
                  <td className="col-center col-capacity-number col-compact">
                    {item.capacity}
                  </td>

                  {/* 8. Trạng thái (Hoạt động, Bảo trì, Ngưng hoạt động) */}
                  <td className="col-center col-compact">
                    {renderStatusBadge(item.status)}
                  </td>

                  {/* 9. Thao tác (3 icon buttons vuông bo góc) */}
                  <td className="col-center col-compact">
                    <div className="action-buttons-group-v2">
                      <button
                        className="btn-action-icon btn-action-view"
                        title="Xem chi tiết"
                        onClick={() => onView(item)}
                        type="button"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        className="btn-action-icon btn-action-edit"
                        title="Chỉnh sửa không gian"
                        onClick={() => onEdit(item)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="btn-action-icon btn-action-delete"
                        title="Xóa không gian"
                        onClick={() => onDelete(item)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
