import api from '../../../services/api';
import type { StaffAuditLog } from '../types/staff';

export interface AuditLogQueryParams {
  action?: string;
  targetType?: string;
  targetId?: number;
  spaceId?: number;
}

export const auditLogApi = {
  /**
   * GET /api/staff/audit-logs
   * Lấy nhật ký kiểm toán thao tác Staff
   */
  getAuditLogs: async (params?: AuditLogQueryParams): Promise<StaffAuditLog[]> => {
    const res = await api.get<StaffAuditLog[]>('/api/staff/audit-logs', { params });
    return res.data;
  },
};
