import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Building2, ClipboardList, Plus, Sparkles } from 'lucide-react';
import type { Space, Facility, SpaceCreateRequest, SpaceUpdateRequest } from '../types/space';
import type { SpaceType } from '../types/spaceType';
import { spaceApi } from '../api/spaceApi';
import { spaceTypeApi } from '../api/spaceTypeApi';
import { spaceImageApi } from '../api/spaceImageApi';
import { readSpaceApiError } from '../api/spaceApiError';
import { SpaceStatsCardsKT } from '../components/SpaceStatsCardsKT';
import { SpaceFilterBarKT } from '../components/SpaceFilterBarKT';
import { SpaceTableKT } from '../components/SpaceTableKT';
import { SpaceCardGridKT } from '../components/SpaceCardGridKT';
import { SpaceFormModalKT, type FormImageItem } from '../components/SpaceFormModalKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Pagination } from '../../../components/common/Pagination';
import './SpaceListPageKT.css';

export const SpaceListPageKT: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Chế độ xem: 'card' (Dạng thẻ) hoặc 'table' (Dạng bảng)
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    return (localStorage.getItem('eduspace_space_view_mode') as 'table' | 'card') || 'card';
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookingMode, setFilterBookingMode] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterBuilding, setFilterBuilding] = useState('ALL');


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);
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
      const [spacesRes, typesRes, facilitiesRes] = await Promise.all([
        spaceApi.getAllAdminSpaces().catch(async () => {
          return await spaceApi.getAllSpaces();
        }),
        spaceTypeApi.getAll().catch(() => []),
        spaceApi.getFacilities().catch(() => []),
      ]);
      const sorted = [...spacesRes].sort((a, b) => b.id - a.id);
      setSpaces(sorted);
      setSpaceTypes(typesRes);
      setFacilities(facilitiesRes);
    } catch (error: unknown) {
      const apiError = readSpaceApiError(error, 'Không thể tải danh sách không gian');
      setError(apiError.message);
      showToast(apiError.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique list of buildings for filter dropdown
  const uniqueBuildings = useMemo(() => {
    const set = new Set<string>();
    spaces.forEach((s) => {
      if (s.building && s.building.trim()) {
        set.add(s.building.trim());
      }
    });
    return Array.from(set).sort();
  }, [spaces]);

  // Filtered spaces
  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      // 1. Search query (space code, name, building, floor, description)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = sp.spaceCode.toLowerCase().includes(q);
        const matchName = sp.name.toLowerCase().includes(q);
        const matchBuilding = sp.building.toLowerCase().includes(q);
        const matchFloor = sp.floor.toLowerCase().includes(q);
        const matchDesc = sp.description?.toLowerCase().includes(q) || false;
        if (!matchCode && !matchName && !matchBuilding && !matchFloor && !matchDesc) return false;
      }

      // 2. Filter by Booking Mode (Hình thức đặt)
      if (filterBookingMode !== 'ALL') {
        const mode = sp.bookingMode || sp.spaceType?.bookingMode;
        if (mode !== filterBookingMode) return false;
      }

      // 3. Filter by Status
      if (filterStatus !== 'ALL') {
        if (sp.status !== filterStatus) return false;
      }

      // 4. Filter by Building
      if (filterBuilding !== 'ALL') {
        if (sp.building !== filterBuilding) return false;
      }

      return true;
    });
  }, [spaces, searchQuery, filterBookingMode, filterStatus, filterBuilding]);

  // Paginated spaces
  const paginatedSpaces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSpaces.slice(start, start + pageSize);
  }, [filteredSpaces, currentPage, pageSize]);

  // Stats Calculations
  const stats = useMemo(() => {
    const total = spaces.length;
    let available = 0;
    let maintenance = 0;
    let inactive = 0;
    for (const sp of spaces) {
      if (sp.status === 'AVAILABLE') available++;
      else if (sp.status === 'MAINTENANCE') maintenance++;
      else if (sp.status === 'INACTIVE') inactive++;
    }
    return { total, available, maintenance, inactive };
  }, [spaces]);

  // Handlers
  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingSpace(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: Space) => {
    setFormMode('edit');
    setEditingSpace(item);
    setFormModalOpen(true);
  };

  const handleOpenView = (item: Space) => {
    navigate(`/admin/spaces/${item.id}`);
  };

  const handleOpenDelete = (item: Space) => {
    setDeletingSpace(item);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (
    data: SpaceCreateRequest | SpaceUpdateRequest,
    images?: FormImageItem[]
  ) => {
    setFormSubmitting(true);
    try {
      if (formMode === 'create') {
        const response = await spaceApi.createSpace(data as SpaceCreateRequest);
        const created = response.data;
        // Đưa không gian mới tạo lên ngay đầu danh sách
        setSpaces((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
        setCurrentPage(1);

        // Lưu toàn bộ danh sách ảnh vào bảng space_images
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            try {
              if (img.type === 'file' && img.file) {
                const formData = new FormData();
                formData.append('file', img.file);
                if (img.isPrimary !== undefined) {
                  formData.append('isPrimary', String(Boolean(img.isPrimary)));
                }
                formData.append('sortOrder', String(i));
                await spaceImageApi.uploadImage(created.id, formData);
              } else if (img.type === 'url' && img.url) {
                await spaceImageApi.addImageUrl(created.id, {
                  imageUrl: img.url.trim(),
                  isPrimary: Boolean(img.isPrimary),
                  sortOrder: i,
                });
              }
            } catch (imgErr) {
              console.error('Lỗi khi tải ảnh lên cho không gian mới:', imgErr);
            }
          }
        } else if (data.imageUrl && data.imageUrl.trim()) {
          await spaceImageApi.addImageUrl(created.id, {
            imageUrl: data.imageUrl.trim(),
            isPrimary: true,
            sortOrder: 0,
          }).catch(() => {});
        }
        showToast(response.message);
      } else if (editingSpace) {
        const response = await spaceApi.updateSpace(editingSpace.id, data as SpaceUpdateRequest);

        // Xử lý ảnh thêm mới trong chế độ chỉnh sửa
        if (images && images.length > 0) {
          const newImages = images.filter((img) => img.type !== 'existing');
          for (let i = 0; i < newImages.length; i++) {
            const img = newImages[i];
            try {
              if (img.type === 'file' && img.file) {
                const formData = new FormData();
                formData.append('file', img.file);
                if (img.isPrimary !== undefined) {
                  formData.append('isPrimary', String(Boolean(img.isPrimary)));
                }
                formData.append('sortOrder', String(img.sortOrder ?? i));
                await spaceImageApi.uploadImage(editingSpace.id, formData);
              } else if (img.type === 'url' && img.url) {
                await spaceImageApi.addImageUrl(editingSpace.id, {
                  imageUrl: img.url.trim(),
                  isPrimary: Boolean(img.isPrimary),
                  sortOrder: img.sortOrder ?? i,
                });
              }
            } catch (imgErr) {
              console.error('Lỗi khi thêm ảnh mới khi chỉnh sửa:', imgErr);
            }
          }
        } else if (data.imageUrl && data.imageUrl.trim() && data.imageUrl !== editingSpace.primaryImageUrl) {
          await spaceImageApi.addImageUrl(editingSpace.id, {
            imageUrl: data.imageUrl.trim(),
            isPrimary: true,
            sortOrder: 0,
          }).catch(() => {});
        }
        showToast(response.message);
      }
      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      // Lỗi được modal (SpaceFormModalKT) hiển thị trực tiếp trên form, không cần hiện thêm toast ở góc
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };


  const handleConfirmDelete = async () => {
    if (!deletingSpace) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await spaceApi.deleteSpace(deletingSpace.id);
      showToast(response.message);
      setDeleteConfirmOpen(false);
      setDeletingSpace(null);
      setDeleteError(null);
      fetchData();
    } catch (error: unknown) {
      const apiError = readSpaceApiError(error, 'Không thể xóa không gian.');

      if (apiError.code === 'SPACE_NOT_FOUND') {
        setDeleteConfirmOpen(false);
        setDeletingSpace(null);
        showToast(apiError.message, 'error');
        fetchData();
        return;
      }

      setDeleteError(apiError.message);
      showToast(apiError.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="kt-page-wrapper">
      <main className="kt-main-content">
        {/* Sub Navigation Bar to toggle KT management pages */}
        <div className="kt-subnav-bar">
          <Link
            to="/admin/space-types"
            className={`kt-subnav-item ${location.pathname.includes('space-types') ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>Loại không gian</span>
          </Link>
          <Link
            to="/admin/spaces"
            className={`kt-subnav-item ${location.pathname.includes('spaces') ? 'active' : ''}`}
          >
            <Building2 size={16} />
            <span>Không gian</span>
          </Link>
          <Link
            to="/admin/facilities"
            className={`kt-subnav-item ${location.pathname.includes('facilities') ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            <span>Tiện ích</span>
          </Link>
          <Link
            to="/staff"
            className={`kt-subnav-item ${location.pathname.startsWith('/staff') ? 'active' : ''}`}
          >
            <ClipboardList size={16} />
            <span>Vận hành Staff</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="page-header-row">
          <div className="page-header-left">
            <h1>Quản lý không gian</h1>
            <p>
              Quản lý danh sách các phòng học, khu tự học, phòng họp, sức chứa và tiện ích
            </p>
          </div>
          <button
            type="button"
            className="btn-primary-add"
            onClick={handleOpenCreate}
            id="btn-add-space"
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Thêm không gian
          </button>
        </div>

        {/* 4 Stats Cards (Thống kê số lượng theo trạng thái) */}
        <SpaceStatsCardsKT
          totalCount={stats.total}
          availableCount={stats.available}
          maintenanceCount={stats.maintenance}
          inactiveCount={stats.inactive}
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

        {/* Unified Table Card */}
        <div className="table-container-card">
          <SpaceFilterBarKT
            totalCount={filteredSpaces.length}
            searchTerm={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            bookingModeFilter={filterBookingMode}
            onBookingModeFilterChange={(val) => {
              setFilterBookingMode(val);
              setCurrentPage(1);
            }}
            statusFilter={filterStatus}
            onStatusFilterChange={(val) => {
              setFilterStatus(val);
              setCurrentPage(1);
            }}
            buildingFilter={filterBuilding}
            onBuildingFilterChange={(val) => {
              setFilterBuilding(val);
              setCurrentPage(1);
            }}
            buildings={uniqueBuildings}
            onReset={() => {
              setSearchQuery('');
              setFilterBookingMode('ALL');
              setFilterStatus('ALL');
              setFilterBuilding('ALL');
              setCurrentPage(1);
              fetchData();
              showToast('Đã làm mới danh sách và xóa toàn bộ bộ lọc');
            }}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              localStorage.setItem('eduspace_space_view_mode', mode);
            }}
          />

          {viewMode === 'table' ? (
            <SpaceTableKT
              items={paginatedSpaces}
              loading={isLoading}
              startIndex={(currentPage - 1) * pageSize}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ) : (
            <SpaceCardGridKT
              items={paginatedSpaces}
              loading={isLoading}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          )}

          {filteredSpaces.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredSpaces.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="không gian"
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

      {/* Form Modal (Create / Edit) */}
      <SpaceFormModalKT
        isOpen={formModalOpen}
        mode={formMode}
        space={editingSpace}
        spaceTypes={spaceTypes}
        facilities={facilities}
        isLoading={formSubmitting}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Xác nhận xóa không gian"
        message={`Bạn có chắc chắn muốn xóa không gian "${deletingSpace?.name || ''}"?`}
        warningNote="Không gian và toàn bộ chỗ ngồi/bàn thuộc không gian này sẽ bị xóa khỏi hệ thống."
        errorMessage={deleteError}
        confirmText="Xóa không gian"
        cancelText="Hủy"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeletingSpace(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
};
