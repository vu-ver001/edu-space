import React from 'react';
import { RotateCcw, LayoutGrid, List } from 'lucide-react';
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
            placeholder="Tìm tên, tòa, tầng..."
            value={searchTerm}
            onChange={onSearchChange}
            height={36}
          />
        </div>

        {/* Filter: Hình thức đặt */}
        <select
          className="filter-select space-select-fluid"
          value={bookingModeFilter}
          onChange={(e) => onBookingModeFilterChange(e.target.value)}
          title="Hình thức đặt"
        >
          <option value="ALL">Tất cả hình thức đặt</option>
          <option value="WHOLE_SPACE">Đặt nguyên phòng</option>
          <option value="PER_SEAT">Đặt theo chỗ ngồi</option>
          <option value="PER_TABLE">Đặt theo bàn</option>
        </select>

        {/* Filter: Trạng thái */}
        <select
          className="filter-select space-select-fluid"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          title="Trạng thái"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Hoạt động</option>
          <option value="MAINTENANCE">Bảo trì</option>
          <option value="INACTIVE">Ngưng hoạt động</option>
        </select>

        {/* Filter: Tòa nhà */}
        <select
          className="filter-select space-select-fluid"
          value={buildingFilter}
          onChange={(e) => onBuildingFilterChange(e.target.value)}
          title="Tòa nhà"
        >
          <option value="ALL">Tất cả tòa nhà</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <button
          className="btn-filter-refresh btn-filter-refresh-icon-only"
          onClick={onReset}
          type="button"
          title="Làm mới bộ lọc"
          aria-label="Làm mới bộ lọc"
        >
          <RotateCcw size={16} />
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

