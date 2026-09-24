import api from '../../../services/api';
import type {
  MaintenanceBlock,
  MaintenanceCreateRequest,
  MaintenanceUpdateRequest,
} from '../types/staff';
import type { StaffActionResponse } from '../types/api';

export const maintenanceApi = {
  /**
   * GET /api/staff/spaces/{spaceId}/maintenance
   * Lấy danh sách bảo trì active của một không gian
   */
  getMaintenanceBySpace: async (spaceId: number): Promise<MaintenanceBlock[]> => {
    const res = await api.get<MaintenanceBlock[]>(`/api/staff/spaces/${spaceId}/maintenance`);
    return res.data;
  },

  /**
   * GET /api/staff/maintenance/{maintenanceId}
   * Chi tiết bảo trì
   */
  getMaintenanceById: async (maintenanceId: number): Promise<MaintenanceBlock> => {
    const res = await api.get<MaintenanceBlock>(`/api/staff/maintenance/${maintenanceId}`);
    return res.data;
  },

  /**
   * POST /api/staff/spaces/{spaceId}/maintenance
   * Tạo khoảng bảo trì
   */
  createMaintenance: async (
    spaceId: number,
    data: MaintenanceCreateRequest
  ): Promise<StaffActionResponse<MaintenanceBlock>> => {
    const res = await api.post<StaffActionResponse<MaintenanceBlock>>(
      `/api/staff/spaces/${spaceId}/maintenance`,
      data
    );
    return res.data;
  },

  /**
   * PUT /api/staff/maintenance/{maintenanceId}
   * Cập nhật khoảng bảo trì
   */
  updateMaintenance: async (
    maintenanceId: number,
    data: MaintenanceUpdateRequest
  ): Promise<StaffActionResponse<MaintenanceBlock>> => {
    const res = await api.put<StaffActionResponse<MaintenanceBlock>>(
      `/api/staff/maintenance/${maintenanceId}`,
      data
    );
    return res.data;
  },

  /**
   * DELETE /api/staff/maintenance/{maintenanceId}
   * Xóa mềm khoảng bảo trì
   */
  deleteMaintenance: async (maintenanceId: number): Promise<StaffActionResponse<null>> => {
    const res = await api.delete<StaffActionResponse<null>>(`/api/staff/maintenance/${maintenanceId}`);
    return res.data;
  },
};
