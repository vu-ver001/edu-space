import React from 'react';
import type { StaffAuditLog } from '../types/staff';

interface StaffAuditLogTableKTProps {
  logs: StaffAuditLog[];
  isLoading?: boolean;
}

export const StaffAuditLogTableKT: React.FC<StaffAuditLogTableKTProps> = ({
  logs,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="staff-loading-card">
        <div className="staff-spinner" />
        <p>Đang tải nhật ký kiểm toán...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="staff-empty-card">
        <span style={{ fontSize: '32px' }}>📜</span>
        <h4>Chưa có bản ghi nhật ký kiểm toán</h4>
        <p>Các hành động phê duyệt, từ chối, check-in và bảo trì sẽ được ghi vết tự động tại đây.</p>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BOOKING_APPROVED':
        return <span className="staff-badge staff-badge-approved">✓ DUYỆT ĐẶT PHÒNG</span>;
      case 'BOOKING_REJECTED':
        return <span className="staff-badge staff-badge-rejected">✕ TỪ CHỐI ĐẶT PHÒNG</span>;
      case 'STAFF_CHECK_IN':
        return <span className="staff-badge staff-badge-checkin">🛎️ STAFF CHECK-IN</span>;
      case 'MAINTENANCE_CREATED':
        return <span className="staff-badge staff-badge-maint-create">+ TẠO BẢO TRÌ</span>;
      case 'MAINTENANCE_UPDATED':
        return <span className="staff-badge staff-badge-maint-update">✏️ SỬA BẢO TRÌ</span>;
      case 'MAINTENANCE_DELETED':
        return <span className="staff-badge staff-badge-maint-delete">🗑️ HỦY BẢO TRÌ</span>;
      default:
        return <span className="staff-badge">{action}</span>;
    }
  };

  return (
    <div className="staff-table-card">
      <table className="staff-data-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Thời gian</th>
            <th>Nhân sự Staff</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
            <th>Không gian</th>
            <th>Chi tiết thao tác</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const dt = new Date(log.createdAt);
            return (
              <tr key={log.id}>
                <td>
                  <span className="booking-id-chip">#{log.id}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px', color: '#64748b' }}>
                  {dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                  <strong>{dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.actorEmail}</div>
                  <small style={{ color: '#94a3b8' }}>ID: {log.actorUserId}</small>
                </td>
                <td>{getActionBadge(log.action)}</td>
                <td>
                  <span style={{ fontWeight: 500 }}>{log.targetType}</span>{' '}
                  <span style={{ color: '#2563eb' }}>#{log.targetId}</span>
                </td>
                <td>
                  {log.spaceId ? <span className="badge-space-id">Space #{log.spaceId}</span> : <span style={{ color: '#94a3b8' }}>-</span>}
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <div className="audit-detail-text" title={log.details || ''}>
                    {log.details || <em>(Không có chi tiết)</em>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
