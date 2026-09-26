import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Building2,
  ClipboardList,
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { Facility, FacilityCreateRequest, FacilityUpdateRequest } from '../types/space';
import { facilityApi } from '../api/facilityApi';
import { readSpaceApiError } from '../api/spaceApiError';
import { FacilityFormModalKT } from '../components/FacilityFormModalKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { FilterSelect } from '../../../components/common/FilterSelect';
import { Tooltip } from '../../../components/common/Tooltip';
import './FacilityListPageKT.css';

export const FacilityListPageKT: React.FC = () => {
  const location = useLocation();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_USE' | 'UNUSED'>('ALL');

  // Detail panel selection
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Form Modal (Create / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const data = await facilityApi.getAllFacilities();
      setFacilities(data || []);
      // If currently selected facility was updated, refresh reference
      if (selectedFacility) {
        const found = (data || []).find((f) => f.id === selectedFacility.id);
        setSelectedFacility(found || null);
      }
    } catch (error: unknown) {
      console.error('Lỗi khi tải danh sách tiện ích:', error);
      showToast(readSpaceApiError(error, 'Không thể tải danh mục tiện ích').message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Filtered list
  const filteredFacilities = facilities.filter((fac) => {
    const matchSearch =
      searchText.trim() === '' ||
      fac.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (fac.description && fac.description.toLowerCase().includes(searchText.toLowerCase()));

    const count = fac.spaceCount || 0;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_USE' && count > 0) ||
      (statusFilter === 'UNUSED' && count === 0);

    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalCount = facilities.length;
  const inUseCount = facilities.filter((f) => (f.spaceCount || 0) > 0).length;
  const unusedCount = facilities.filter((f) => (f.spaceCount || 0) === 0).length;

  // Handlers
  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingFacility(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (fac: Facility, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormMode('edit');
    setEditingFacility(fac);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (fac: Facility, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingFacility(fac);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (data: FacilityCreateRequest | FacilityUpdateRequest) => {
    setFormSubmitting(true);
    try {
      if (formMode === 'create') {
        const response = await facilityApi.createFacility(data as FacilityCreateRequest);
        showToast(response.message);
      } else if (editingFacility) {
        const response = await facilityApi.updateFacility(editingFacility.id, data as FacilityUpdateRequest);
        showToast(response.message);
      }
      setFormModalOpen(false);
      fetchFacilities();
    } catch (err: any) {
      // Form modal handles error directly on form
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFacility) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await facilityApi.deleteFacility(deletingFacility.id);
      showToast(response.message);
      setDeleteConfirmOpen(false);
      if (selectedFacility?.id === deletingFacility.id) {
        setSelectedFacility(null);
      }
      setDeletingFacility(null);
      fetchFacilities();
    } catch (error: unknown) {
      const apiError = readSpaceApiError(error, 'Không thể xóa tiện ích. Vui lòng thử lại.');

      if (apiError.code === 'FACILITY_NOT_FOUND') {
        setDeleteConfirmOpen(false);
        setDeletingFacility(null);
        showToast(apiError.message, 'error');
        fetchFacilities();
        return;
      }

      if (apiError.code === 'FACILITY_IN_USE') {
        setDeleteError(apiError.message);
        return;
      }

      setDeleteError(apiError.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="facility-page-wrapper kt-page-wrapper">
      <main className="facility-main-content">
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
            <h1>Quản lý tiện ích</h1>
            <p>
              Quản lý danh mục tiện ích sử dụng trong các không gian học tập
            </p>
          </div>
          <button
            type="button"
            className="btn-primary-add"
            onClick={handleOpenCreate}
            id="btn-add-facility"
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Thêm tiện ích
          </button>
        </div>

        {/* Top 3 Stat Cards */}
        <div className="facility-stats-grid">
          {/* Card 1: Tổng số tiện ích - Pastel Blue */}
          <div className="stat-card-box stat-card-pastel-blue">
            <div className="stat-card-top-row">
              <span className="stat-card-label">Tổng số tiện ích</span>
              <div className="stat-card-icon-badge icon-blue">
                <Package size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className="stat-card-value-row">
              <span className="stat-card-value">{totalCount}</span>
            </div>
          </div>

          {/* Card 2: Đang được sử dụng - Pastel Green */}
          <div className="stat-card-box stat-card-pastel-green">
            <div className="stat-card-top-row">
              <span className="stat-card-label">Đang được sử dụng</span>
              <div className="stat-card-icon-badge icon-green">
                <CheckCircle2 size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className="stat-card-value-row">
              <span className="stat-card-value">{inUseCount}</span>
            </div>
          </div>

          {/* Card 3: Chưa được sử dụng - Pastel Rose */}
          <div className="stat-card-box stat-card-pastel-rose">
            <div className="stat-card-top-row">
              <span className="stat-card-label">Chưa được sử dụng</span>
              <div className="stat-card-icon-badge icon-rose">
                <XCircle size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className="stat-card-value-row">
              <span className="stat-card-value">{unusedCount}</span>
            </div>
          </div>
        </div>

        <div className="facility-list-card">
          <div className="facility-list-card-header">
            <div className="facility-list-card-title-group">
              <h2>Danh sách tiện ích</h2>
              <span>{filteredFacilities.length} tiện ích</span>
            </div>

            {/* Filter & Search Bar */}
            <div className="facility-filter-bar">
              <div className="facility-search-box">
                <Search size={17} className="facility-search-icon" />
                <input
                  type="text"
                  className="facility-search-input"
                  placeholder="Tìm kiếm tiện ích theo tên, mô tả..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <FilterSelect
                className="facility-filter-select"
                value={statusFilter}
                ariaLabel="Lọc theo trạng thái"
                options={[
                  { value: 'ALL', label: 'Tất cả trạng thái' },
                  { value: 'IN_USE', label: 'Đang sử dụng' },
                  { value: 'UNUSED', label: 'Chưa sử dụng' },
                ]}
                onChange={(value) => setStatusFilter(value as 'ALL' | 'IN_USE' | 'UNUSED')}
              />

              <button
                type="button"
                className="btn-filter-refresh-icon-only"
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('ALL');
                  void fetchFacilities();
                }}
                disabled={loading}
                title="Xóa bộ lọc và tải lại danh sách"
                aria-label="Xóa bộ lọc và tải lại danh sách tiện ích"
              >
                <RefreshCw size={18} className={loading ? 'kt-control-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Content Layout: Master Table + Detail Sidebar */}
          <div className="facility-content-layout">
            <div className="facility-table-container">
            {loading ? (
              <div className="facility-empty-state">
                <p>Đang tải danh sách tiện ích từ hệ thống...</p>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="facility-empty-state">
                <div className="facility-empty-icon">
                  <Package size={28} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>
                  Không tìm thấy tiện ích nào
                </h4>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  {searchText ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bấm nút "Thêm tiện ích" để tạo tiện ích đầu tiên.'}
                </p>
              </div>
            ) : (
              <table className="facility-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '22%' }}>Tên tiện ích</th>
                    <th style={{ width: '26%' }}>Mô tả</th>
                    <th style={{ textAlign: 'center', width: '18%' }}>Không gian sử dụng</th>
                    <th style={{ textAlign: 'center', width: '18%' }}>Trạng thái</th>
                    <th style={{ textAlign: 'center', width: '16%' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((fac, idx) => {
                    const isSelected = selectedFacility?.id === fac.id;
                    const inUse = (fac.spaceCount || 0) > 0;
                    return (
                      <tr
                        key={fac.id}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => setSelectedFacility(fac)}
                      >
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 500 }}>{idx + 1}</td>
                        <td style={{ overflow: 'hidden' }}>
                          <Tooltip content={fac.name} maxWidth={320}>
                            <span className="facility-truncate-text name">{fac.name}</span>
                          </Tooltip>
                        </td>
                        <td style={{ overflow: 'hidden' }}>
                          {fac.description ? (
                            <Tooltip content={fac.description} maxWidth={420}>
                              <span className="facility-truncate-text desc">{fac.description}</span>
                            </Tooltip>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="facility-count-badge">
                            {fac.spaceCount || 0} phòng
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`facility-status-badge ${inUse ? 'in-use' : 'unused'}`}>
                            {inUse ? 'Đang sử dụng' : 'Chưa sử dụng'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="facility-action-btns">
                            <button
                              type="button"
                              className="facility-btn-action edit"
                              title="Chỉnh sửa tiện ích"
                              onClick={(e) => handleOpenEdit(fac, e)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="facility-btn-action delete"
                              title="Xóa tiện ích"
                              onClick={(e) => handleOpenDelete(fac, e)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            </div>

            {/* Right Detail Sidebar Panel */}
            {selectedFacility && (
              <div className="facility-detail-sidebar">
              <div className="facility-detail-header">
                <h3 className="facility-detail-title">Chi tiết tiện ích</h3>
                <button
                  type="button"
                  className="facility-detail-close-btn"
                  onClick={() => setSelectedFacility(null)}
                  title="Đóng chi tiết"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="facility-detail-body">
                {/* Hero Box */}
                <div className="facility-detail-hero-box">
                  <div className="facility-detail-hero-top">
                    <Tooltip content={selectedFacility.name} maxWidth={320}>
                      <h4 className="facility-detail-hero-title">
                        {selectedFacility.name}
                      </h4>
                    </Tooltip>
                    <span className={`facility-status-badge ${(selectedFacility.spaceCount || 0) > 0 ? 'in-use' : 'unused'}`}>
                      {(selectedFacility.spaceCount || 0) > 0 ? 'Đang sử dụng' : 'Chưa sử dụng'}
                    </span>
                  </div>
                  {selectedFacility.description ? (
                    <Tooltip content={selectedFacility.description} maxWidth={360}>
                      <p className="facility-detail-hero-desc">
                        {selectedFacility.description}
                      </p>
                    </Tooltip>
                  ) : (
                    <p className="facility-detail-hero-desc" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                      Chưa có mô tả chi tiết cho tiện ích này.
                    </p>
                  )}
                </div>

                {/* Key-Value Specifications */}
                <div className="facility-detail-specs">
                  <div className="facility-spec-row">
                    <div className="facility-spec-label">
                      <Building2 size={15} className="facility-spec-icon" />
                      <span>Không gian sử dụng</span>
                    </div>
                    <span className="facility-spec-value-highlight">
                      {selectedFacility.spaceCount || 0} phòng
                    </span>
                  </div>

                  <div className="facility-spec-row">
                    <div className="facility-spec-label">
                      <Calendar size={15} className="facility-spec-icon" />
                      <span>Ngày tạo</span>
                    </div>
                    <span className="facility-spec-value">
                      {formatDate(selectedFacility.createdAt)}
                    </span>
                  </div>

                  <div className="facility-spec-row">
                    <div className="facility-spec-label">
                      <Clock size={15} className="facility-spec-icon" />
                      <span>Cập nhật gần nhất</span>
                    </div>
                    <span className="facility-spec-value">
                      {formatDate(selectedFacility.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Create / Edit Modal */}
        <FacilityFormModalKT
          isOpen={formModalOpen}
          mode={formMode}
          facility={editingFacility}
          isLoading={formSubmitting}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleFormSubmit}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title="Xác nhận xóa tiện ích"
          message={`Bạn có chắc chắn muốn xóa tiện ích "${deletingFacility?.name || ''}" khỏi hệ thống?`}
          warningNote={
            deletingFacility && (deletingFacility.spaceCount || 0) > 0
              ? `Tiện ích này hiện đang được liên kết với ${deletingFacility.spaceCount} không gian học tập.`
              : undefined
          }
          errorMessage={deleteError}
          confirmText="Xóa tiện ích"
          cancelText="Hủy"
          isLoading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setDeletingFacility(null);
            setDeleteError(null);
          }}
        />
      </main>
    </div>
  );
};
