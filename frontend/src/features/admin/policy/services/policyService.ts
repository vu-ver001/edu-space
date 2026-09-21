import api from '../../../../services/api';
import type { PolicyResponse, PolicyUpdateRequest, AuditLogResponse, SpaceTypeItem } from '../types/policy';

export const policyService = {
  async getPolicy(): Promise<PolicyResponse> {
    const res = await api.get<PolicyResponse>('/api/admin/policies');
    return res.data;
  },

  async updatePolicy(payload: PolicyUpdateRequest): Promise<PolicyResponse> {
    const res = await api.put<PolicyResponse>('/api/admin/policies', payload);
    return res.data;
  },

  async getAuditLogs(): Promise<AuditLogResponse[]> {
    const res = await api.get<AuditLogResponse[]>('/api/admin/policies/history');
    return res.data;
  },

  async getSpaceTypes(): Promise<SpaceTypeItem[]> {
    const res = await api.get<SpaceTypeItem[]>('/api/space-types');
    return res.data;
  },

  async updateSpaceTypeApproval(spaceType: SpaceTypeItem, requiresApproval: boolean): Promise<void> {
    await api.put(`/api/admin/space-types/${spaceType.id}`, {
      name: spaceType.name,
      description: spaceType.description || '',
      bookingMode: spaceType.bookingMode || 'WHOLE_SPACE',
      requiresApproval,
    });
  },

  async quickAdminLogin(): Promise<string> {
    const res = await api.post<{ token: string; tokenType: string }>('/api/auth/login', {
      email: 'admin@eduspace.vn',
      password: '123456',
    });
    localStorage.setItem('eduspace_token', res.data.token);
    return res.data.token;
  },
};
