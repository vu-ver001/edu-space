import api from '../../../services/api';
import type { StaffAuditLog, StaffAuditLogPage, StaffAuditStats } from '../types/staff';

export interface AuditLogQueryParams {
  action?: string;
  targetType?: string;
  targetId?: number;
  spaceId?: number;
  spaceName?: string;
  actorUserId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

const isPagedResponse = (data: unknown): data is StaffAuditLogPage =>
  typeof data === 'object' && data !== null && 'content' in data && 'totalElements' in data;

export const auditLogApi = {
  /**
   * GET /api/staff/audit-logs
   * Lấy nhật ký kiểm toán thao tác Staff (tương thích List cũ).
   */
  getAuditLogs: async (params?: AuditLogQueryParams): Promise<StaffAuditLog[]> => {
    const res = await api.get<StaffAuditLog[] | StaffAuditLogPage>('/api/staff/audit-logs', { params });
    if (isPagedResponse(res.data)) return res.data.content;
    return res.data;
  },

  /**
   * GET /api/staff/audit-logs?page=&size=&from=&to=...
   * Trang AuditLog chuẩn nghiệp vụ: lọc ngày, phân trang server.
   */
  getAuditLogsPaged: async (params?: AuditLogQueryParams): Promise<StaffAuditLogPage> => {
    const res = await api.get<StaffAuditLogPage>('/api/staff/audit-logs', {
      params: { page: 0, size: 10, ...params },
    });
    return res.data;
  },

  /**
   * GET /api/staff/audit-logs/stats
   * Thống kê cho các cards tổng quan.
   */
  getAuditStats: async (params?: Omit<AuditLogQueryParams, 'page' | 'size'>): Promise<StaffAuditStats> => {
    const res = await api.get<StaffAuditStats>('/api/staff/audit-logs/stats', { params });
    return res.data;
  },
};
