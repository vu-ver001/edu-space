import React from 'react';
import { Eye, Pencil, Trash2, DoorOpen, Armchair, Users, Inbox } from 'lucide-react';
import { Tooltip } from '../../../components/common/Tooltip';
import type { SpaceType, BookingMode } from '../types/spaceType';

interface Props {
  items: SpaceType[];
  loading: boolean;
  startIndex: number;
  spaceCountMap: Record<number, number>;
  onView: (item: SpaceType) => void;
  onEdit: (item: SpaceType) => void;
  onDelete: (item: SpaceType) => void;
}

export const SpaceTypeTableKT: React.FC<Props> = ({
  items,
  loading,
  startIndex,
  spaceCountMap,
  onView,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '18/09/2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const renderModeBadge = (mode: BookingMode) => {
    if (mode === 'WHOLE_SPACE') {
      return (
        <span className="badge-pill badge-mode-whole">
          <DoorOpen size={13} style={{ marginRight: '5px' }} />
          Nguyên phòng
        </span>
      );
    }
    if (mode === 'PER_SEAT') {
      return (
        <span className="badge-pill badge-mode-seat">
          <Armchair size={13} style={{ marginRight: '5px' }} />
          Chỗ ngồi
        </span>
      );
    }
    return (
      <span className="badge-pill badge-mode-table">
        <Users size={13} style={{ marginRight: '5px' }} />
        Theo bàn
      </span>
    );
  };

  return (
    <div className="table-responsive-wrapper">
      <table className="custom-space-types-table">
        <thead>
          <tr>
            <th style={{ width: '45px' }} className="col-center">#</th>
            <th style={{ minWidth: '180px' }}>Tên loại không gian</th>
            <th style={{ width: '140px', minWidth: '130px' }}>Hình thức đặt</th>
            <th className="col-center col-approval">Yêu cầu duyệt</th>
            <th style={{ minWidth: '240px' }}>Mô tả</th>
            <th className="col-center col-space-count">Số không gian</th>
            <th style={{ width: '105px', minWidth: '95px' }}>Ngày tạo</th>
            <th style={{ width: '110px' }} className="col-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="empty-table-state">
                <p>Đang tải dữ liệu loại không gian...</p>
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-table-state">
                <Inbox size={36} strokeWidth={1.5} color="#94a3b8" />
                <p>Không tìm thấy loại không gian nào phù hợp với bộ lọc.</p>
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const count = spaceCountMap[item.id] || 0;

              return (
                <tr key={item.id}>
                  {/* 1. Index */}
                  <td className="col-center count-number-bold">
                    {startIndex + idx + 1}
                  </td>

                  {/* 2. Tên loại không gian */}
                  <td>
                    <Tooltip content={item.name} maxWidth={320}>
                      <span className="type-name-text">{item.name}</span>
                    </Tooltip>
                  </td>

                  {/* 3. Hình thức đặt */}
                  <td>
                    {renderModeBadge(item.bookingMode)}
                  </td>

                  {/* 4. Yêu cầu duyệt */}
                  <td className="col-center col-approval">
                    {item.requiresApproval ? (
                      <span className="badge-pill badge-approval-yes">Có</span>
                    ) : (
                      <span className="badge-pill badge-approval-no">Không</span>
                    )}
                  </td>

                  {/* 5. Mô tả */}
                  <td>
                    {item.description ? (
                      <Tooltip content={item.description} maxWidth={400}>
                        <span className="description-cell-text" title={item.description}>
                          {item.description}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="description-cell-text">—</span>
                    )}
                  </td>

                  {/* 6. Số không gian */}
                  <td className="col-center col-space-count count-number-bold">
                    {count}
                  </td>

                  {/* 7. Ngày tạo */}
                  <td>
                    <span className="date-cell-text">
                      {formatDate(item.createdAt)}
                    </span>
                  </td>

                  {/* 8. Thao tác (3 icon buttons) */}
                  <td className="col-center">
                    <div className="action-buttons-group">
                      {/* Xem chi tiết */}
                      <button
                        className="action-btn action-btn-view"
                        title="Xem chi tiết"
                        onClick={() => onView(item)}
                        type="button"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Chỉnh sửa */}
                      <button
                        className="action-btn action-btn-edit"
                        title="Chỉnh sửa"
                        onClick={() => onEdit(item)}
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Xóa */}
                      <button
                        className="action-btn action-btn-delete"
                        title="Xóa loại không gian"
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
