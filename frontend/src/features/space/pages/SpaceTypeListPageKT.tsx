import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SpaceType, SpaceTypeCreateRequest, SpaceTypeUpdateRequest } from '../types/spaceType';
import type { Space } from '../types/space';
import { spaceTypeApi } from '../api/spaceTypeApi';
import { spaceApi } from '../api/spaceApi';
import { SpaceTypeStatsCardsKT } from '../components/SpaceTypeStatsCardsKT';
import { SpaceTypeFilterBarKT } from '../components/SpaceTypeFilterBarKT';
import { SpaceTypeTableKT } from '../components/SpaceTypeTableKT';
import { SpaceTypeFormModalKT } from '../components/SpaceTypeFormModalKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Pagination } from '../../../components/common/Pagination';
import './SpaceTypeListPageKT.css';

export const SpaceTypeListPageKT: React.FC = () => {
  const navigate = useNavigate();
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterApproval, setFilterApproval] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingType, setEditingType] = useState<SpaceType | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<SpaceType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [typesRes, spacesRes] = await Promise.all([
        spaceTypeApi.getAll(),
        spaceApi.getAllSpaces().catch(() => []),
      ]);
      setSpaceTypes(typesRes);
      setSpaces(spacesRes);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách loại không gian';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map space count by spaceTypeId
  const spaceCountByType = useMemo(() => {
    const map: Record<number, number> = {};
    for (const sp of spaces) {
      const typeId = sp.spaceType?.id ?? sp.spaceTypeId;
      if (typeId) {
        map[typeId] = (map[typeId] || 0) + 1;
      }
    }
    return map;
  }, [spaces]);

  // Filtered space types
  const filteredSpaceTypes = useMemo(() => {
    return spaceTypes.filter((st) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchDesc = st.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc) return false;
      }
      // Mode
      if (filterMode !== 'ALL' && st.bookingMode !== filterMode) {
        return false;
      }
      // Approval
      if (filterApproval === 'YES' && !st.requiresApproval) return false;
      if (filterApproval === 'NO' && st.requiresApproval) return false;

      return true;
    });
  }, [spaceTypes, searchQuery, filterMode, filterApproval]);

  // Paginated space types
  const paginatedSpaceTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSpaceTypes.slice(start, start + pageSize);
  }, [filteredSpaceTypes, currentPage, pageSize]);

  // Stats Calculations
  const stats = useMemo(() => {
    const total = spaceTypes.length;
    let wholeSpace = 0;
    let perSeat = 0;
    let perTable = 0;
    for (const st of spaceTypes) {
      if (st.bookingMode === 'WHOLE_SPACE') wholeSpace++;
      else if (st.bookingMode === 'PER_SEAT') perSeat++;
      else if (st.bookingMode === 'PER_TABLE') perTable++;
    }
    return { total, wholeSpace, perSeat, perTable };
  }, [spaceTypes]);

  // Handlers
  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingType(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (st: SpaceType) => {
    setFormMode('edit');
    setEditingType(st);
    setFormModalOpen(true);
  };

  const handleOpenView = (st: SpaceType) => {
    navigate(`/admin/space-types/${st.id}`);
  };

  const handleOpenDelete = (st: SpaceType) => {
    setDeletingType(st);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (data: SpaceTypeCreateRequest | SpaceTypeUpdateRequest) => {
    setFormSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await spaceTypeApi.create(data as SpaceTypeCreateRequest);
        showToast(`Đã tạo loại không gian "${created.name}"`);
      } else if (editingType) {
        const updated = await spaceTypeApi.update(editingType.id, data as SpaceTypeUpdateRequest);
        showToast(`Đã cập nhật loại không gian "${updated.name}"`);
      }
      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin. Vui lòng thử lại.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await spaceTypeApi.delete(deletingType.id);
      showToast(`Đã xóa loại không gian "${deletingType.name}"`);
      setDeleteConfirmOpen(false);
      setDeletingType(null);
      setDeleteError(null);
      fetchData();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      let msg = 'Không thể xóa loại không gian.';
      if (rawMsg.includes('Vẫn còn phòng') || rawMsg.includes('SPACE_TYPE_IN_USE')) {
        msg = 'Không thể xóa do vẫn còn phòng đang hoạt động.';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setDeleteError(msg);
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };


  return (
    <div className="kt-page-wrapper">
      {/* Main Page Content */}
      <main className="kt-main-content">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="page-header-left">
            <h1>Quản lý loại không gian</h1>
            <p>
              Cấu hình phân loại không gian, chế độ đặt chỗ và quy tắc phê duyệt
            </p>
          </div>
          <button
            type="button"
            className="btn-primary-add"
            onClick={handleOpenCreate}
            id="btn-add-space-type"
          >
            <span>+</span> Thêm loại không gian
          </button>
        </div>

        {/* 4 Stats Cards */}
        <SpaceTypeStatsCardsKT
          totalCount={stats.total}
          wholeSpaceCount={stats.wholeSpace}
          perSeatCount={stats.perSeat}
          perTableCount={stats.perTable}
        />

        {/* Error Banner */}
        {error && (
          <div className="astp-alert astp-alert-error">
            <span>⚠️ {error}</span>
            <button
              type="button"
              className="astp-btn astp-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={fetchData}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Unified Table Card (Header Bar + Table + Pagination) */}
        <div className="table-container-card">
          <SpaceTypeFilterBarKT
            totalCount={filteredSpaceTypes.length}
            searchTerm={searchQuery}
            onSearchChange={(val: string) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            modeFilter={filterMode}
            onModeFilterChange={(val: string) => {
              setFilterMode(val);
              setCurrentPage(1);
            }}
            approvalFilter={filterApproval}
            onApprovalFilterChange={(val: string) => {
              setFilterApproval(val);
              setCurrentPage(1);
            }}
            onReset={fetchData}
          />

          <SpaceTypeTableKT
            items={paginatedSpaceTypes}
            loading={isLoading}
            startIndex={(currentPage - 1) * pageSize}
            spaceCountMap={spaceCountByType}
            onView={handleOpenView}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />

          {filteredSpaceTypes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredSpaceTypes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="loại không gian"
            />
          )}
        </div>
      </main>

      {/* Floating Toast */}
      {toastMessage && (
        <div className={`astp-toast-float astp-alert astp-alert-${toastMessage.type}`}>
          <span>{toastMessage.text}</span>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px' }}
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      <SpaceTypeFormModalKT
        isOpen={formModalOpen}
        mode={formMode}
        spaceType={editingType}
        isLoading={formSubmitting}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />


      {(() => {
        const linkedCount = deletingType ? (spaceCountByType[deletingType.id] || 0) : 0;
        const hasLinkedSpaces = linkedCount > 0;

        return (
          <ConfirmDialog
            isOpen={deleteConfirmOpen}
            title="Xác nhận xóa"
            message={`Bạn có chắc muốn xóa loại không gian "${deletingType?.name || ''}"?`}
            warningNote={
              hasLinkedSpaces
                ? `⚠️ Còn ${linkedCount} phòng thuộc loại này. Vui lòng chuyển hoặc xóa phòng trước.`
                : undefined
            }
            errorMessage={deleteError}
            isConfirmDisabled={hasLinkedSpaces}
            confirmText={hasLinkedSpaces ? 'Không thể xóa (còn phòng)' : 'Xóa'}
            cancelText={hasLinkedSpaces ? 'Đóng' : 'Hủy'}
            isLoading={deleteLoading}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setDeleteConfirmOpen(false);
              setDeletingType(null);
              setDeleteError(null);
            }}
          />
        );
      })()}
    </div>
  );
};
