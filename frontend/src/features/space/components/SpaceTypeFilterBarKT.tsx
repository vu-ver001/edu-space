import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchInput } from '../../../components/common/SearchInput';

interface Props {
  totalCount: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  modeFilter: string;
  onModeFilterChange: (val: string) => void;
  approvalFilter: string;
  onApprovalFilterChange: (val: string) => void;
  onReset: () => void;
}

export const SpaceTypeFilterBarKT: React.FC<Props> = ({
  totalCount,
  searchTerm,
  onSearchChange,
  modeFilter,
  onModeFilterChange,
  approvalFilter,
  onApprovalFilterChange,
  onReset,
}) => {
  return (
    <div className="table-card-header-bar">
      {/* Left: Title & Subtitle */}
      <div className="table-card-title-group">
        <h2 className="table-card-title">Danh sách loại không gian</h2>
        <span className="table-card-subtitle">Tổng cộng {totalCount} loại không gian</span>
      </div>

      {/* Right: Search, Filters, Refresh */}
      <div className="table-card-actions-group">
        <SearchInput
          placeholder="Tìm kiếm loại không gian..."
          value={searchTerm}
          onChange={onSearchChange}
          height={36}
        />

        <select
          className="filter-select"
          value={modeFilter}
          onChange={(e) => onModeFilterChange(e.target.value)}
        >
          <option value="ALL">Tất cả chế độ</option>
          <option value="WHOLE_SPACE">Đặt nguyên phòng</option>
          <option value="PER_SEAT">Đặt theo chỗ ngồi</option>
          <option value="PER_TABLE">Đặt theo bàn</option>
        </select>

        <select
          className="filter-select"
          value={approvalFilter}
          onChange={(e) => onApprovalFilterChange(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái duyệt</option>
          <option value="YES">Có yêu cầu duyệt</option>
          <option value="NO">Không yêu cầu duyệt</option>
        </select>

        <button
          className="btn-filter-refresh btn-filter-refresh-icon-only"
          onClick={onReset}
          type="button"
          title="Làm mới bộ lọc và danh sách"
          aria-label="Làm mới bộ lọc và danh sách"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
