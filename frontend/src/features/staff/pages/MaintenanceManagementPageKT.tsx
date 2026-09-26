import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Pagination } from '../../../components/common/Pagination';
import { spaceApi } from '../../space/api/spaceApi';
import type { Space } from '../../space/types/space';
import { maintenanceApi } from '../api/maintenanceApi';
import { readStaffApiError } from '../api/staffApiError';
import { MaintenanceFormModalKT } from '../components/MaintenanceFormModalKT';
import type {
  MaintenanceBlock,
  MaintenanceCreateRequest,
  MaintenanceUpdateRequest,
} from '../types/staff';
import './MaintenanceManagementPageKT.css';

type MaintenanceTimeStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

const STATUS_OPTIONS: Array<{ value: MaintenanceTimeStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'IN_PROGRESS', label: 'Đang bảo trì' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
];

const getTimeStatus = (item: MaintenanceBlock, now: number): MaintenanceTimeStatus => {
  if (new Date(item.startTime).getTime() > now) return 'UPCOMING';
  if (new Date(item.endTime).getTime() <= now) return 'COMPLETED';
  return 'IN_PROGRESS';
};

const statusInfo = (status: MaintenanceTimeStatus) => {
  if (status === 'UPCOMING') return { label: 'Sắp diễn ra', className: 'upcoming' };
  if (status === 'IN_PROGRESS') return { label: 'Đang bảo trì', className: 'in-progress' };
  return { label: 'Đã kết thúc', className: 'completed' };
};

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(value));

const formatCreatedAt = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value))
  : '—';

export const MaintenanceManagementPageKT = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [searchQuery, setSearchQuery] = useState('');
  const [spaceFilter, setSpaceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<MaintenanceTimeStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceBlock | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deletingMaintenance, setDeletingMaintenance] = useState<MaintenanceBlock | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const spaceData = await spaceApi.getAllAdminSpaces();
      const responses = await Promise.all(
        spaceData.map((space) => maintenanceApi.getMaintenanceBySpace(space.id)),
      );
      setSpaces(spaceData);
      setMaintenanceList(responses.flat());
    } catch (loadError: unknown) {
      const apiError = readStaffApiError(loadError, 'Không thể tải danh sách bảo trì.');
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const spaceById = useMemo(() => new Map(spaces.map((space) => [space.id, space])), [spaces]);

  const stats = useMemo(() => {
    let upcoming = 0;
    let inProgress = 0;
    let completed = 0;
    maintenanceList.forEach((item) => {
      const status = getTimeStatus(item, now);
      if (status === 'UPCOMING') upcoming += 1;
      else if (status === 'IN_PROGRESS') inProgress += 1;
      else completed += 1;
    });
    return { total: maintenanceList.length, upcoming, inProgress, completed };
  }, [maintenanceList, now]);

  const filteredMaintenance = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...maintenanceList]
      .filter((item) => {
        const space = spaceById.get(item.spaceId);
        const matchesSearch = !query
          || item.spaceName.toLowerCase().includes(query)
          || space?.spaceCode?.toLowerCase().includes(query)
          || item.reason.toLowerCase().includes(query)
          || item.creatorEmail?.toLowerCase().includes(query);
        const matchesSpace = spaceFilter === 'ALL' || item.spaceId === Number(spaceFilter);
        const matchesStatus = statusFilter === 'ALL' || getTimeStatus(item, now) === statusFilter;
        const matchesDate = !dateFilter || item.startTime.slice(0, 10) === dateFilter;
        return matchesSearch && matchesSpace && matchesStatus && matchesDate;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [maintenanceList, searchQuery, spaceFilter, statusFilter, dateFilter, spaceById, now]);

  const totalPages = Math.max(1, Math.ceil(filteredMaintenance.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleMaintenance = filteredMaintenance.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => {
    setSearchQuery('');
    setSpaceFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('');
    setCurrentPage(1);
  };

  const openCreate = () => {
    setFormMode('create');
    setEditingMaintenance(null);
    setFormOpen(true);
  };

  const openEdit = (item: MaintenanceBlock) => {
    setFormMode('edit');
    setEditingMaintenance(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (spaceId: number, data: MaintenanceCreateRequest) => {
    setFormSubmitting(true);
    try {
      const response = formMode === 'create'
        ? await maintenanceApi.createMaintenance(spaceId, data)
        : await maintenanceApi.updateMaintenance(editingMaintenance!.id, data as MaintenanceUpdateRequest);
      setFormOpen(false);
      setEditingMaintenance(null);
      showToast(response.message);
      await loadData();
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMaintenance) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await maintenanceApi.deleteMaintenance(deletingMaintenance.id);
      setDeletingMaintenance(null);
      showToast(response.message);
      await loadData();
    } catch (deleteRequestError: unknown) {
      setDeleteError(readStaffApiError(deleteRequestError, 'Không thể hủy lịch bảo trì.').message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="maintenance-page">
      {toast && <div className={`maintenance-toast ${toast.type}`}>{toast.message}</div>}

      <header className="maintenance-page-header">
        <div>
          <h1>Quản lý bảo trì</h1>
          <p>Lập lịch và theo dõi các khoảng thời gian không gian tạm ngừng phục vụ</p>
        </div>
        <button type="button" className="maintenance-create-btn" onClick={openCreate}>
          <Plus size={18} /> Tạo lịch bảo trì
        </button>
      </header>

      <section className="maintenance-stats" aria-label="Thống kê lịch bảo trì">
        <article className="maintenance-stat-card total">
          <div><span>Tổng lịch bảo trì</span><i><Wrench size={22} /></i></div>
          <strong>{stats.total}</strong>
        </article>
        <article className="maintenance-stat-card upcoming">
          <div><span>Sắp diễn ra</span><i><Clock3 size={22} /></i></div>
          <strong>{stats.upcoming}</strong>
        </article>
        <article className="maintenance-stat-card progress">
          <div><span>Đang bảo trì</span><i><PlayCircle size={22} /></i></div>
          <strong>{stats.inProgress}</strong>
        </article>
        <article className="maintenance-stat-card completed">
          <div><span>Đã kết thúc</span><i><CheckCircle2 size={22} /></i></div>
          <strong>{stats.completed}</strong>
        </article>
      </section>

      <main className="maintenance-list-panel">
        <div className="maintenance-list-header">
          <div className="maintenance-list-title">
            <h2>Danh sách lịch bảo trì</h2>
            <p>Tổng cộng {maintenanceList.length} lịch bảo trì</p>
          </div>
          <div className="maintenance-filter-bar">
            <label className="maintenance-search">
              <Search size={17} />
              <input
                value={searchQuery}
                placeholder="Tìm không gian, lý do, người tạo..."
                onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
              />
            </label>
            <label>
              <select value={spaceFilter} aria-label="Lọc theo không gian" onChange={(event) => { setSpaceFilter(event.target.value); setCurrentPage(1); }}>
                <option value="ALL">Tất cả không gian</option>
                {spaces.map((space) => <option key={space.id} value={space.id}>{space.spaceCode} — {space.name}</option>)}
              </select>
            </label>
            <label>
              <select value={statusFilter} aria-label="Lọc theo trạng thái" onChange={(event) => { setStatusFilter(event.target.value as MaintenanceTimeStatus | 'ALL'); setCurrentPage(1); }}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label><input type="date" value={dateFilter} aria-label="Lọc theo ngày bắt đầu" onChange={(event) => { setDateFilter(event.target.value); setCurrentPage(1); }} /></label>
            <button
              type="button"
              className="maintenance-refresh-btn"
              onClick={() => { clearFilters(); void loadData(); }}
              disabled={loading}
              title="Xóa bộ lọc và tải lại dữ liệu"
              aria-label="Xóa bộ lọc và tải lại dữ liệu"
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="maintenance-error-state">
            <span>{error}</span>
            <button type="button" onClick={() => void loadData()}>Thử lại</button>
          </div>
        )}

        {loading ? (
          <div className="maintenance-loading"><span /><p>Đang tải dữ liệu bảo trì...</p></div>
        ) : !error && filteredMaintenance.length === 0 ? (
          <div className="maintenance-empty">
            <CalendarClock size={40} />
            <h3>Chưa có lịch bảo trì phù hợp</h3>
            <p>Tạo lịch mới hoặc thay đổi điều kiện tìm kiếm.</p>
            {(searchQuery || spaceFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter) && (
              <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
            )}
          </div>
        ) : !error && (
          <>
            <div className="maintenance-table-wrap">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Không gian</th>
                    <th>Thời gian</th>
                    <th>Lý do</th>
                    <th>Người tạo</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMaintenance.map((item, index) => {
                    const space = spaceById.get(item.spaceId);
                    const status = statusInfo(getTimeStatus(item, now));
                    return (
                      <tr key={item.id}>
                        <td><span className="maintenance-row-number">{(safePage - 1) * pageSize + index + 1}</span></td>
                        <td>
                          <div className="maintenance-space-cell">
                            <div><strong>{space?.spaceCode || item.spaceName}</strong><small>{item.spaceName}<br />{space ? `${space.building} · Tầng ${space.floor}` : ''}<br />Tạo {formatCreatedAt(item.createdAt)}</small></div>
                          </div>
                        </td>
                        <td><strong>{formatDate(item.startTime)}</strong><small>{formatTime(item.startTime)} – {formatTime(item.endTime)}</small></td>
                        <td><span className="maintenance-reason" title={item.reason}>{item.reason}</span></td>
                        <td><strong className="maintenance-creator">{item.creatorEmail || 'Không xác định'}</strong></td>
                        <td><span className={`maintenance-status ${status.className}`}>{status.label}</span></td>
                        <td>
                          <div className="maintenance-row-actions">
                            <button type="button" className="edit" onClick={() => openEdit(item)} aria-label={`Sửa lịch bảo trì của ${item.spaceName}`} title="Chỉnh sửa"><Pencil size={16} /></button>
                            <button type="button" className="delete" onClick={() => { setDeleteError(null); setDeletingMaintenance(item); }} aria-label={`Hủy lịch bảo trì của ${item.spaceName}`} title="Hủy lịch bảo trì"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              totalItems={filteredMaintenance.length}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(value) => { setPageSize(value); setCurrentPage(1); }}
              itemLabel="lịch bảo trì"
            />
          </>
        )}
      </main>

      <MaintenanceFormModalKT
        isOpen={formOpen}
        mode={formMode}
        spaces={spaces}
        maintenance={editingMaintenance}
        isSubmitting={formSubmitting}
        onClose={() => { if (!formSubmitting) setFormOpen(false); }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingMaintenance)}
        title="Hủy lịch bảo trì"
        message={deletingMaintenance ? `Bạn có chắc muốn hủy lịch bảo trì của “${deletingMaintenance.spaceName}”?` : ''}
        warningNote="Lịch sẽ được hủy khỏi hệ thống và thao tác này được ghi vào nhật ký vận hành."
        errorMessage={deleteError}
        confirmText="Hủy lịch bảo trì"
        cancelText="Quay lại"
        isDanger
        isLoading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => { if (!deleteLoading) { setDeletingMaintenance(null); setDeleteError(null); } }}
      />
    </div>
  );
};
