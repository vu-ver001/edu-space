import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Eye,
  FileClock,
  Filter,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { allAuditActions, operationSpaces } from '../mockOperations';
import { auditLogApi } from '../../staff/api/auditLogApi';
import { spaceApi } from '../../space/api/spaceApi';
import type { StaffAuditLog } from '../../staff/types/staff';
import { getOperationsUser } from '../session';
import type { AuditAction, AuditQuery, OperationsAuditLog, OperationsRole } from '../types';
import '../operations.css';

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = new Date();
const defaultTo = toDateInputValue(today);
const defaultFromDate = new Date(today);
defaultFromDate.setDate(defaultFromDate.getDate() - 30);
const initialFrom = toDateInputValue(defaultFromDate);
const initialTo = defaultTo;
const pageSize = 10;

const mapStaffLogToOperations = (log: StaffAuditLog): OperationsAuditLog => {
  const action = log.action as AuditAction;
  const rawTarget = (log.targetType ?? 'BOOKING').toUpperCase();
  const targetType = (rawTarget === 'BOOKING' || rawTarget === 'MAINTENANCE' || rawTarget === 'STUDENT'
    ? rawTarget
    : 'BOOKING') as OperationsAuditLog['targetType'];
  const actorRole = (log.actorRole === 'ADMIN' ? 'ADMIN' : 'STAFF') as OperationsAuditLog['actorRole'];
  return {
    id: log.id,
    actorUserId: log.actorUserId,
    actorName: log.actorName ?? log.actorEmail ?? `User #${log.actorUserId}`,
    actorEmail: log.actorEmail,
    actorRole,
    action,
    targetType,
    targetId: log.targetId,
    targetLabel: log.targetLabel ?? `${log.targetType} #${log.targetId}`,
    spaceName: log.spaceName ?? '',
    details: log.details ?? '',
    createdAt: log.createdAt,
  };
};

const actionLabels: Record<AuditAction, string> = {
  BOOKING_APPROVED: 'Duyệt đặt phòng',
  BOOKING_REJECTED: 'Từ chối đặt phòng',
  STAFF_CHECKED_IN_BOOKING: 'Hỗ trợ check-in',
  MAINTENANCE_CREATED: 'Tạo lịch bảo trì',
  MAINTENANCE_UPDATED: 'Cập nhật bảo trì',
  MAINTENANCE_CANCELLED: 'Hủy lịch bảo trì',
};

const formatAuditDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

const actionTone = (action: AuditAction) => {
  if (action === 'BOOKING_APPROVED') return 'audit-action-green';
  if (action === 'BOOKING_REJECTED') return 'audit-action-red';
  if (action === 'STAFF_CHECKED_IN_BOOKING') return 'audit-action-purple';
  if (action === 'MAINTENANCE_CANCELLED') return 'audit-action-coral';
  return action === 'MAINTENANCE_UPDATED' ? 'audit-action-blue' : 'audit-action-orange';
};

const actionIcon = (action: AuditAction) => {
  if (action === 'BOOKING_APPROVED') return <CircleCheck size={14} />;
  if (action === 'BOOKING_REJECTED') return <CircleX size={14} />;
  if (action === 'STAFF_CHECKED_IN_BOOKING') return <UsersRound size={14} />;
  return <Wrench size={14} />;
};

const UserBadge = ({ log }: { log: OperationsAuditLog }) => (
  <div className="audit-user-cell">
    <span className={`audit-avatar ${log.actorRole === 'ADMIN' ? 'admin-avatar' : ''}`}>{log.actorName.split(' ').map((part) => part[0]).join('').slice(-2)}</span>
    <span><strong>{log.actorName}</strong><small>{log.actorEmail}</small></span>
  </div>
);

const StatsCard = ({ icon, label, value, trend, tone }: { icon: React.ReactNode; label: string; value: string; trend: string; tone: string }) => (
  <div className="audit-stat-card">
    <div className={`audit-stat-icon ${tone}`}>{icon}</div>
    <div><span>{label}</span><strong>{value} <em>↗ {trend}</em></strong><small>So với 7 ngày trước</small></div>
  </div>
);

interface AuditLogPageProps {
  role?: OperationsRole;
}

export const AuditLogPage = ({ role }: AuditLogPageProps) => {
  const currentUser = useMemo(() => getOperationsUser(), []);
  const currentRole = role ?? currentUser.role;
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [action, setAction] = useState<AuditAction | ''>('');
  const [spaceName, setSpaceName] = useState('');
  const [targetType, setTargetType] = useState('');
  const [actorUserId, setActorUserId] = useState<number | ''>('');
  const [appliedQuery, setAppliedQuery] = useState<AuditQuery>({ from: initialFrom, to: initialTo });
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [] as OperationsAuditLog[], totalElements: 0, totalPages: 1 });
  const [spaces, setSpaces] = useState(operationSpaces);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, checkIn: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<OperationsAuditLog | null>(null);

  const loadLogs = async (query: AuditQuery = appliedQuery, nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      // Backend tự scope STAFF theo JWT; ADMIN mới được lọc theo actorUserId.
      const params = {
        action: query.action || undefined,
        spaceName: query.spaceName || undefined,
        targetType: query.targetType || undefined,
        actorUserId: currentRole === 'ADMIN' ? query.actorUserId : undefined,
        from: query.from || undefined,
        to: query.to || undefined,
        page: nextPage,
        size: pageSize,
      };
      const [paged, statRes] = await Promise.all([
        auditLogApi.getAuditLogsPaged(params),
        auditLogApi.getAuditStats(params).catch(() => null),
      ]);
      setResult({
        content: (paged.content ?? []).map(mapStaffLogToOperations),
        totalElements: paged.totalElements ?? 0,
        totalPages: paged.totalPages ?? 1,
      });
      if (statRes) {
        setStats({
          total: statRes.totalActions,
          approved: statRes.approvedCount,
          rejected: statRes.rejectedCount,
          checkIn: statRes.checkInCount,
          maintenance: statRes.maintenanceCount,
        });
      } else {
        const content = (paged.content ?? []).map(mapStaffLogToOperations);
        setStats({
          total: paged.totalElements ?? 0,
          approved: content.filter((l) => l.action === 'BOOKING_APPROVED').length,
          rejected: content.filter((l) => l.action === 'BOOKING_REJECTED').length,
          checkIn: content.filter((l) => l.action === 'STAFF_CHECKED_IN_BOOKING').length,
          maintenance: content.filter((l) => l.action.startsWith('MAINTENANCE')).length,
        });
      }
      void currentUser;
    } catch {
      setError('Không thể tải nhật ký kiểm toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
    // Load once on entry; filters are applied explicitly by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    spaceApi.getAllSpaces()
      .then((realSpaces) => {
        if (cancelled || !Array.isArray(realSpaces) || realSpaces.length === 0) return;
        setSpaces(realSpaces.map((space) => ({ id: space.id, name: space.name })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const applyFilters = () => {
    const query: AuditQuery = { from, to, action, spaceName, targetType: targetType as AuditQuery['targetType'] };
    if (currentRole === 'ADMIN' && actorUserId !== '') query.actorUserId = actorUserId;
    setAppliedQuery(query);
    setPage(0);
    void loadLogs(query, 0);
  };

  const resetFilters = () => {
    setFrom(initialFrom); setTo(initialTo); setAction(''); setSpaceName(''); setTargetType(''); setActorUserId('');
    const query: AuditQuery = { from: initialFrom, to: initialTo };
    setAppliedQuery(query); setPage(0); void loadLogs(query, 0);
  };

  const changePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= result.totalPages) return;
    setPage(nextPage);
    void loadLogs(appliedQuery, nextPage);
  };

  const title = currentRole === 'ADMIN' ? 'Nhật ký kiểm toán hệ thống' : 'Nhật ký thao tác của tôi';
  const description = currentRole === 'ADMIN' ? 'Theo dõi toàn bộ thao tác vận hành của Staff và Admin.' : 'Chỉ hiển thị những thao tác do bạn thực hiện.';

  return (
    <div className="operations-page audit-page">
      <div className="operations-page-heading">
        <div className="operations-heading-icon"><FileClock size={28} strokeWidth={2.2} /></div>
        <div><h1>{title}</h1><p>{description}</p></div>
        <button type="button" className="operation-primary-button heading-refresh" onClick={() => void loadLogs()} disabled={loading}><RefreshCw size={17} className={loading ? 'operation-spin' : ''} /> Tải lại</button>
      </div>

      <div className="audit-stats-grid">
        <StatsCard icon={<FileClock size={22} />} label="Tổng số thao tác" value={`${stats.total}`} trend="thực tế" tone="stat-blue" />
        <StatsCard icon={<CircleCheck size={22} />} label="Số lượt duyệt" value={`${stats.approved}`} trend="thực tế" tone="stat-green" />
        <StatsCard icon={<CircleX size={22} />} label="Số lượt từ chối" value={`${stats.rejected}`} trend="thực tế" tone="stat-red" />
        <StatsCard icon={<UsersRound size={22} />} label="Số thao tác check-in" value={`${stats.checkIn}`} trend="thực tế" tone="stat-purple" />
        <StatsCard icon={<Wrench size={22} />} label="Số thao tác bảo trì" value={`${stats.maintenance}`} trend="thực tế" tone="stat-orange" />
      </div>

      <section className="operations-filter-card audit-filter-card" aria-label="Bộ lọc nhật ký kiểm toán">
        <label className="operation-field"><span>Từ ngày</span><div className="operation-date-wrap"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div></label>
        <label className="operation-field"><span>Đến ngày</span><div className="operation-date-wrap"><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div></label>
        <label className="operation-field"><span>Loại hành động</span><div className="operation-select-wrap"><select value={action} onChange={(event) => setAction(event.target.value as AuditAction | '')}><option value="">Tất cả</option>{allAuditActions.map((item) => <option value={item} key={item}>{actionLabels[item]}</option>)}</select><ChevronDown size={15} /></div></label>
        <label className="operation-field"><span>Không gian</span><div className="operation-select-wrap"><select value={spaceName} onChange={(event) => setSpaceName(event.target.value)}><option value="">Tất cả</option>{spaces.map((space) => <option value={space.name} key={space.id}>{space.name}</option>)}</select><ChevronDown size={15} /></div></label>
        <label className="operation-field"><span>Loại đối tượng</span><div className="operation-select-wrap"><select value={targetType} onChange={(event) => setTargetType(event.target.value)}><option value="">Tất cả</option><option value="BOOKING">Booking</option><option value="MAINTENANCE">Bảo trì</option><option value="STUDENT">Sinh viên</option></select><ChevronDown size={15} /></div></label>
        {currentRole === 'ADMIN' && <label className="operation-field"><span>Người thực hiện</span><div className="operation-select-wrap"><select value={actorUserId} onChange={(event) => setActorUserId(event.target.value ? Number(event.target.value) : '')}><option value="">Tất cả</option><option value="11">Nguyễn Văn An</option><option value="12">Lê Thị Mai</option><option value="1">Admin</option></select><ChevronDown size={15} /></div></label>}
        <div className="operation-filter-actions"><button type="button" className="operation-primary-button" onClick={applyFilters}><Filter size={16} /> Áp dụng</button><button type="button" className="operation-secondary-button" onClick={resetFilters}><RotateCcw size={16} /> Xóa bộ lọc</button></div>
      </section>

      {error ? <div className="operation-state-card operation-error-state"><strong>{error}</strong><button type="button" onClick={() => void loadLogs()}>Thử lại</button></div> : (
        <section className="audit-table-shell">
          <div className="audit-table-scroll">
            <table className="operations-table">
              <thead><tr><th>Thời gian <span>↓</span></th>{currentRole === 'ADMIN' && <th>Người thực hiện <span>⌃</span></th>}<th>Hành động <span>⌃</span></th><th>Đối tượng <span>⌃</span></th><th>Không gian <span>⌃</span></th><th>Chi tiết</th><th className="audit-actions-header">Xem chi tiết</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={currentRole === 'ADMIN' ? 7 : 6}><div className="operation-table-loading"><div className="operation-spinner" /> Đang tải nhật ký...</div></td></tr> : result.content.length === 0 ? <tr><td colSpan={currentRole === 'ADMIN' ? 7 : 6}><div className="operation-table-empty"><FileClock size={28} /><strong>Chưa có bản ghi phù hợp</strong><span>Thử thay đổi bộ lọc.</span></div></td></tr> : result.content.map((log) => <tr key={log.id}>
                  <td className="audit-time-cell"><strong>{formatAuditDate(log.createdAt).split(' ')[0]}</strong><small>{formatAuditDate(log.createdAt).split(' ').slice(1).join(' ')}</small></td>
                  {currentRole === 'ADMIN' && <td><UserBadge log={log} /><span className={`audit-role-pill ${log.actorRole === 'ADMIN' ? 'role-admin' : ''}`}>{log.actorRole === 'ADMIN' ? 'Admin' : 'Staff'}</span></td>}
                  <td><span className={`audit-action-pill ${actionTone(log.action)}`}>{actionIcon(log.action)} {actionLabels[log.action]}</span></td>
                  <td><span className="audit-target-label">{log.targetLabel}</span></td>
                  <td><span className="audit-space-label"><DoorIcon /> {log.spaceName}</span></td>
                  <td className="audit-detail-cell">{log.details}</td>
                  <td className="audit-row-actions"><button type="button" className="audit-view-button" aria-label={`Xem log ${log.id}`} onClick={() => setSelectedLog(log)}><Eye size={16} /></button><button type="button" className="operation-icon-button subtle" aria-label="Thêm thao tác"><MoreVertical size={17} /></button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="audit-table-footer"><div className="audit-page-size"><select value={pageSize} disabled><option>10</option></select><span>bản ghi mỗi trang</span><i /> <span>Tổng số {result.totalElements} bản ghi</span></div><div className="audit-pagination"><button type="button" onClick={() => changePage(page - 1)} disabled={page === 0}><ChevronLeft size={16} /> Trước</button>{Array.from({ length: Math.min(result.totalPages, 5) }, (_, index) => <button type="button" key={index} className={index === page ? 'active' : ''} onClick={() => changePage(index)}>{index + 1}</button>)}{result.totalPages > 5 && <span>…</span>}<button type="button" onClick={() => changePage(page + 1)} disabled={page >= result.totalPages - 1}>Tiếp <ChevronRight size={16} /></button></div></div>
        </section>
      )}

      {selectedLog && <div className="operation-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedLog(null); }}><section className="operation-detail-modal" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title"><header><div><span className="operation-modal-eyebrow">CHI TIẾT NHẬT KÝ #{selectedLog.id}</span><h2 id="audit-detail-title">{actionLabels[selectedLog.action]}</h2></div><button type="button" className="operation-icon-button" onClick={() => setSelectedLog(null)} aria-label="Đóng"><X size={19} /></button></header><div className="operation-detail-grid"><div><span>Thời gian</span><strong>{formatAuditDate(selectedLog.createdAt)}</strong></div><div><span>Người thực hiện</span><strong>{selectedLog.actorName}</strong><small>{selectedLog.actorEmail} · {selectedLog.actorRole}</small></div><div><span>Đối tượng</span><strong>{selectedLog.targetLabel}</strong></div><div><span>Không gian</span><strong>{selectedLog.spaceName}</strong></div></div><div className="operation-detail-note"><ShieldCheck size={17} /><span>{selectedLog.details}</span></div><footer><button type="button" className="operation-secondary-button" onClick={() => setSelectedLog(null)}>Đóng</button></footer></section></div>}
    </div>
  );
};

const DoorIcon = () => <span className="audit-door-icon"><UserRound size={14} /></span>;
