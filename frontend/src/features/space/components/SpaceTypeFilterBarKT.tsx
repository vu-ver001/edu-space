import React from 'react';
import { RefreshCw } from 'lucide-react';
import { FilterSelect } from '../../../components/common/FilterSelect';
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

        <FilterSelect
          className="filter-select"
          value={modeFilter}
          onChange={onModeFilterChange}
          ariaLabel="Chế độ đặt"
          options={[
            { value: 'ALL', label: 'Tất cả chế độ' },
            { value: 'WHOLE_SPACE', label: 'Đặt nguyên phòng' },
            { value: 'PER_SEAT', label: 'Đặt theo chỗ ngồi' },
            { value: 'PER_TABLE', label: 'Đặt theo bàn' },
          ]}
        />

        <FilterSelect
          className="filter-select"
          value={approvalFilter}
          onChange={onApprovalFilterChange}
          ariaLabel="Trạng thái duyệt"
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái duyệt' },
            { value: 'YES', label: 'Có yêu cầu duyệt' },
            { value: 'NO', label: 'Không yêu cầu duyệt' },
          ]}
        />

        <button
          className="btn-filter-refresh btn-filter-refresh-icon-only"
          onClick={onReset}
          type="button"
          title="Làm mới bộ lọc và danh sách"
          aria-label="Làm mới bộ lọc và danh sách"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
};
