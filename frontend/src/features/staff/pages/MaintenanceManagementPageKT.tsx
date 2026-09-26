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
import { FilterSelect } from '../../../components/common/FilterSelect';
import { Pagination } from '../../../components/common/Pagination';
import { Tooltip } from '../../../components/common/Tooltip';
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

const sortMaintenanceByPriority = (
  a: MaintenanceBlock,
  b: MaintenanceBlock,
  now: number,
) => {
  const statusA = getTimeStatus(a, now);
  const statusB = getTimeStatus(b, now);
  const statusPriority: Record<MaintenanceTimeStatus, number> = {
    IN_PROGRESS: 0,
    UPCOMING: 1,
    COMPLETED: 2,
  };

  const groupOrder = statusPriority[statusA] - statusPriority[statusB];
  if (groupOrder !== 0) return groupOrder;

  const startA = new Date(a.startTime).getTime();
  const startB = new Date(b.startTime).getTime();
  const endA = new Date(a.endTime).getTime();
  const endB = new Date(b.endTime).getTime();

  if (statusA === 'IN_PROGRESS') {
    return (endA - endB) || (startB - startA) || (b.id - a.id);
  }
  if (statusA === 'UPCOMING') {
    return (startA - startB) || (endA - endB) || (b.id - a.id);
  }
  return (endB - endA) || (startB - startA) || (b.id - a.id);
};

const statusInfo = (status: MaintenanceTimeStatus) => {
  if (status === 'UPCOMING') return { label: 'Sắp diễn ra', className: 'upcoming' };
  if (status === 'IN_PROGRESS') return { label: 'Đang bảo trì', className: 'in-progress' };
  return { label: 'Đã kết thúc', className: 'completed' };
};

const formatShortDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
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
      .sort((a, b) => sortMaintenanceByPriority(a, b, now));
  }, [maintenanceList, searchQuery, spaceFilter, statusFilter, dateFilter, spaceById, now]);

  const totalPages = Math.max(1, Math.ceil(filteredMaintenance.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleMaintenance = filteredMaintenance.slice((safePage - 1) * pageSize, safePage * pageSize);
  const deletingTimeStatus = deletingMaintenance ? getTimeStatus(deletingMaintenance, now) : null;
  const deletingIsCompleted = deletingTimeStatus === 'COMPLETED';
  const deletingIsInProgress = deletingTimeStatus === 'IN_PROGRESS';

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
    if (getTimeStatus(item, Date.now()) === 'COMPLETED') return;
    setFormMode('edit');
    setEditingMaintenance(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async (spaceId: number, data: MaintenanceCreateRequest) => {
    if (
      formMode === 'edit'
      && editingMaintenance
      && getTimeStatus(editingMaintenance, Date.now()) === 'COMPLETED'
    ) {
      setFormOpen(false);
      setEditingMaintenance(null);
      showToast('Lịch bảo trì đã kết thúc, không thể chỉnh sửa.', 'error');
      return;
    }
    setFormSubmitting(true);
    try {
      const updateData = formMode === 'edit'
        && editingMaintenance
        && getTimeStatus(editingMaintenance, Date.now()) === 'IN_PROGRESS'
        ? {
            ...data,
            startTime: editingMaintenance.startTime,
          }
        : data;
      const response = formMode === 'create'
        ? await maintenanceApi.createMaintenance(spaceId, data)
        : await maintenanceApi.updateMaintenance(editingMaintenance!.id, updateData as MaintenanceUpdateRequest);
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
    if (getTimeStatus(deletingMaintenance, Date.now()) === 'IN_PROGRESS') return;
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
              <FilterSelect
                value={spaceFilter}
                ariaLabel="Lọc theo không gian"
                options={[
                  { value: 'ALL', label: 'Tất cả không gian' },
                  ...spaces.map((space) => ({ value: String(space.id), label: `${space.spaceCode} — ${space.name}` })),
                ]}
                onChange={(value) => { setSpaceFilter(value); setCurrentPage(1); }}
              />
            </label>
            <label>
              <FilterSelect
                value={statusFilter}
                ariaLabel="Lọc theo trạng thái"
                options={STATUS_OPTIONS}
                onChange={(value) => { setStatusFilter(value as MaintenanceTimeStatus | 'ALL'); setCurrentPage(1); }}
              />
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
                    const timeStatus = getTimeStatus(item, now);
                    const status = statusInfo(timeStatus);
                    const deleteLabel = timeStatus === 'COMPLETED' ? 'Xóa khỏi danh sách' : 'Hủy lịch bảo trì';
                    return (
                      <tr key={item.id}>
                        <td><span className="maintenance-row-number">{(safePage - 1) * pageSize + index + 1}</span></td>
                        <td>
                          <div className="maintenance-space-cell">
                            <div><strong>{space?.spaceCode || item.spaceName}</strong><small>{item.spaceName}<br />{space ? `${space.building} · Tầng ${space.floor}` : ''}<br />Tạo {formatCreatedAt(item.createdAt)}</small></div>
                          </div>
                        </td>
                        <td>
                          <div className="maintenance-time-range">
                            <strong>{formatShortDate(item.startTime)} – {formatShortDate(item.endTime)}</strong>
                            <span>{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
                          </div>
                        </td>
                        <td>
                          <Tooltip content={item.reason} maxWidth={420} onlyWhenOverflow>
                            <span className="maintenance-reason">{item.reason}</span>
                          </Tooltip>
                        </td>
                        <td>
                          <Tooltip content={item.creatorEmail || 'Không xác định'} maxWidth={360} onlyWhenOverflow>
                            <strong className="maintenance-creator">{item.creatorEmail || 'Không xác định'}</strong>
                          </Tooltip>
                        </td>
                        <td><span className={`maintenance-status ${status.className}`}>{status.label}</span></td>
                        <td>
                          <div className="maintenance-row-actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => openEdit(item)}
                              disabled={timeStatus === 'COMPLETED'}
                              aria-label={timeStatus === 'COMPLETED'
                                ? `Không thể sửa lịch bảo trì đã kết thúc của ${item.spaceName}`
                                : `Sửa lịch bảo trì của ${item.spaceName}`}
                              title={timeStatus === 'COMPLETED' ? 'Lịch đã kết thúc, không thể chỉnh sửa' : 'Chỉnh sửa'}
                            >
                              <Pencil size={16} />
                            </button>
                            <button type="button" className="delete" onClick={() => { setDeleteError(null); setDeletingMaintenance(item); }} aria-label={`${deleteLabel} của ${item.spaceName}`} title={deleteLabel}><Trash2 size={16} /></button>
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
        title={deletingIsInProgress
          ? 'Không thể xóa lịch đang diễn ra'
          : deletingIsCompleted ? 'Xóa lịch đã kết thúc' : 'Hủy lịch bảo trì'}
        message={deletingMaintenance
          ? deletingIsInProgress
            ? `Lịch bảo trì của “${deletingMaintenance.spaceName}” đang diễn ra và không thể xóa.`
            : deletingIsCompleted
            ? `Bạn có chắc muốn xóa lịch bảo trì đã kết thúc của “${deletingMaintenance.spaceName}” khỏi danh sách?`
            : `Bạn có chắc muốn hủy lịch bảo trì của “${deletingMaintenance.spaceName}”?`
          : ''}
        warningNote={deletingIsInProgress
          ? 'Vui lòng chờ lịch bảo trì kết thúc trước khi xóa khỏi danh sách.'
          : deletingIsCompleted
            ? 'Lịch đã kết thúc sẽ được xóa khỏi danh sách và thao tác này được ghi vào nhật ký vận hành.'
            : 'Lịch sẽ được hủy khỏi hệ thống và thao tác này được ghi vào nhật ký vận hành.'}
        errorMessage={deleteError}
        confirmText={deletingIsInProgress
          ? 'Không thể xóa'
          : deletingIsCompleted ? 'Xóa khỏi danh sách' : 'Hủy lịch bảo trì'}
        cancelText="Quay lại"
        isDanger
        isLoading={deleteLoading}
        isConfirmDisabled={deletingIsInProgress}
        onConfirm={() => void handleDelete()}
        onCancel={() => { if (!deleteLoading) { setDeletingMaintenance(null); setDeleteError(null); } }}
      />
    </div>
  );
};
