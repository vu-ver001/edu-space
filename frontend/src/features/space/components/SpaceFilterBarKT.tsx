import React from 'react';
import { RefreshCw, LayoutGrid, List } from 'lucide-react';
import { FilterSelect } from '../../../components/common/FilterSelect';
import { SearchInput } from '../../../components/common/SearchInput';

interface Props {
  totalCount: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  bookingModeFilter: string;
  onBookingModeFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  buildingFilter: string;
  onBuildingFilterChange: (val: string) => void;
  buildings: string[];
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onReset: () => void;
}

export const SpaceFilterBarKT: React.FC<Props> = ({
  totalCount,
  searchTerm,
  onSearchChange,
  bookingModeFilter,
  onBookingModeFilterChange,
  statusFilter,
  onStatusFilterChange,
  buildingFilter,
  onBuildingFilterChange,
  buildings,
  viewMode,
  onViewModeChange,
  onReset,
}) => {

  return (
    <div className="table-card-header-bar space-header-bar-fluid">
      {/* Left: Title & Subtitle */}
      <div className="table-card-title-group">
        <h2 className="table-card-title">Danh sách không gian</h2>
        <span className="table-card-subtitle">Tổng cộng {totalCount} không gian</span>
      </div>

      {/* Cụm Tìm kiếm, Lọc, Làm mới và Chế độ xem: đi liền với nhau, cách chữ Danh sách 100px */}
      <div className="space-filters-cluster-group">
        <div className="space-filter-search-fluid">
          <SearchInput
            placeholder="Tìm mã, tên, tòa, tầng..."
            value={searchTerm}
            onChange={onSearchChange}
            height={36}
          />
        </div>

        {/* Filter: Hình thức đặt */}
        <FilterSelect
          className="filter-select space-select-fluid"
          value={bookingModeFilter}
          onChange={onBookingModeFilterChange}
          ariaLabel="Hình thức đặt"
          title="Hình thức đặt"
          options={[
            { value: 'ALL', label: 'Tất cả hình thức đặt' },
            { value: 'WHOLE_SPACE', label: 'Đặt nguyên phòng' },
            { value: 'PER_SEAT', label: 'Đặt theo chỗ ngồi' },
            { value: 'PER_TABLE', label: 'Đặt theo bàn' },
          ]}
        />

        {/* Filter: Trạng thái */}
        <FilterSelect
          className="filter-select space-select-fluid"
          value={statusFilter}
          onChange={onStatusFilterChange}
          ariaLabel="Trạng thái"
          title="Trạng thái"
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'AVAILABLE', label: 'Hoạt động' },
            { value: 'MAINTENANCE', label: 'Bảo trì' },
            { value: 'INACTIVE', label: 'Ngưng hoạt động' },
          ]}
        />

        {/* Filter: Tòa nhà */}
        <FilterSelect
          className="filter-select space-select-fluid"
          value={buildingFilter}
          onChange={onBuildingFilterChange}
          ariaLabel="Tòa nhà"
          title="Tòa nhà"
          options={[
            { value: 'ALL', label: 'Tất cả tòa nhà' },
            ...buildings.map((building) => ({ value: building, label: building })),
          ]}
        />

        <button
          className="btn-filter-refresh btn-filter-refresh-icon-only"
          onClick={onReset}
          type="button"
          title="Làm mới bộ lọc"
          aria-label="Làm mới bộ lọc"
        >
          <RefreshCw size={18} />
        </button>

        {/* Cụm nút chuyển đổi Chế độ xem: Dạng bảng / Dạng thẻ (đi liền kề không bị tách xa) */}
        <div className="view-mode-toggle-group">
          <button
            type="button"
            className={`btn-view-mode ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => onViewModeChange('card')}
            title="Hiển thị dạng thẻ (Card Grid)"
          >
            <LayoutGrid size={15} />
            <span>Thẻ</span>
          </button>
          <button
            type="button"
            className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Hiển thị dạng bảng (Table)"
          >
            <List size={15} />
            <span>Bảng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
