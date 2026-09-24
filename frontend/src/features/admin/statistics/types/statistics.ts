export interface MaintenanceResourceDetail {
  resourceType: string;
  resourceCode: string;
  resourceName: string;
  spaceCode?: string;
  spaceName?: string;
  location?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  statusText?: string;
}

export interface DashboardStatisticsResponse {
  fromDate?: string;
  toDate?: string;
  totalBookings: number;
  actualUsageRate: number;
  noShowRate: number;
  pendingApprovalCount: number;
  expiredPendingCount: number;
  maintenanceSpacesCount: number;
  maintenanceTablesCount?: number;
  maintenanceSeatsCount?: number;
  totalMaintenanceCount?: number;
  confirmedCount: number;
  checkedInCount: number;
  completedCount: number;
  noShowCount: number;
  cancelledCount: number;
  rejectedCount: number;
  calculatedAt?: string;
  maintenanceDetails?: MaintenanceResourceDetail[];
}

export type TimeFilterPreset = '7days' | '30days' | 'this_month' | 'all' | 'custom';

export interface StatisticsFilterState {
  preset: TimeFilterPreset;
  from: string;
  to: string;
}
