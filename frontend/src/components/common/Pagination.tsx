import React from 'react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  itemLabel = 'mục'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="table-pagination-footer">
      <span className="pagination-info-text">
        Hiển thị {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} trong tổng số {totalItems} {itemLabel}
      </span>

      <div className="pagination-controls-right">
        <button
          type="button"
          className="pagination-btn-nav"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          title="Trang trước"
        >
          «
        </button>
        <span className="pagination-page-active">{currentPage}</span>
        <button
          type="button"
          className="pagination-btn-nav"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          title="Trang sau"
        >
          »
        </button>

        {onPageSizeChange && (
          <select
            className="page-size-selector"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
