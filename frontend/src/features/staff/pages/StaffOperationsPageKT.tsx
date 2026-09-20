import React, { useState, useEffect } from 'react';
import type {
  PendingBooking,
  StaffTimeline,
  MaintenanceBlock,
  StaffAuditLog,
  MaintenanceCreateRequest,
  MaintenanceUpdateRequest,
} from '../types/staff';
import type { Space } from '../../space/types/space';
import { staffApi } from '../api/staffApi';
import { maintenanceApi } from '../api/maintenanceApi';
import { auditLogApi } from '../api/auditLogApi';
import { spaceApi } from '../../space/api/spaceApi';
import { PendingBookingTableKT } from '../components/PendingBookingTableKT';
import { RejectBookingModalKT } from '../components/RejectBookingModalKT';
import { StaffTimelineKT } from '../components/StaffTimelineKT';
import { MaintenanceFormModalKT } from '../components/MaintenanceFormModalKT';
import { StaffAuditLogTableKT } from '../components/StaffAuditLogTableKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import CheckInTokenInput from '../../bookings/checkin/components/CheckInTokenInput';
import './StaffOperationsPageKT.css';

type StaffTab = 'pending' | 'timeline' | 'maintenance' | 'audit';

export const StaffOperationsPageKT: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StaffTab>('pending');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>(0);

  // Tab 1: Pending Bookings
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState<PendingBooking | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approvingBooking, setApprovingBooking] = useState<PendingBooking | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab 2: Timeline
  const [timeline, setTimeline] = useState<StaffTimeline | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineDays, setTimelineDays] = useState(7);
  const [checkInLoadingId, setCheckInLoadingId] = useState<number | null>(null);
  const [tokenBookingId, setTokenBookingId] = useState<number | null>(null);

  // Tab 3: Maintenance
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceBlock[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [maintMode, setMaintMode] = useState<'create' | 'edit'>('create');
  const [editingMaint, setEditingMaint] = useState<MaintenanceBlock | null>(null);
  const [deletingMaint, setDeletingMaint] = useState<MaintenanceBlock | null>(null);
  const [deleteMaintConfirmOpen, setDeleteMaintConfirmOpen] = useState(false);

  // Tab 4: Audit Logs
  const [auditLogs, setAuditLogs] = useState<StaffAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load spaces list once
  useEffect(() => {
    spaceApi.getAllSpaces()
      .then((data) => {
        setSpaces(data);
        if (data.length > 0) {
          setSelectedSpaceId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching spaces:', err));
  }, []);

  // Fetch Pending Bookings
  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const data = await staffApi.getPendingBookings();
      setPendingBookings(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải danh sách chờ duyệt', 'error');
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch Timeline
  const fetchTimeline = async (spId: number, days: number) => {
    if (!spId) return;
    setLoadingTimeline(true);
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setDate(to.getDate() + days);
      to.setHours(23, 59, 59, 999);

      const data = await staffApi.getSpaceTimeline(spId, now.toISOString(), to.toISOString());
      setTimeline(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải timeline', 'error');
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Fetch Maintenance
  const fetchMaintenance = async (spId: number) => {
    if (!spId) return;
    setLoadingMaintenance(true);
    try {
      const data = await maintenanceApi.getMaintenanceBySpace(spId);
      setMaintenanceList(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải danh sách bảo trì', 'error');
    } finally {
      setLoadingMaintenance(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (action?: string) => {
    setLoadingAudit(true);
    try {
      const params = action ? { action } : undefined;
      const data = await auditLogApi.getAuditLogs(params);
      setAuditLogs(data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải nhật ký kiểm toán', 'error');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Switch tabs & trigger data loading
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    } else if (activeTab === 'timeline' && selectedSpaceId) {
      fetchTimeline(selectedSpaceId, timelineDays);
    } else if (activeTab === 'maintenance' && selectedSpaceId) {
      fetchMaintenance(selectedSpaceId);
    } else if (activeTab === 'audit') {
      fetchAuditLogs(auditActionFilter);
    }
  }, [activeTab, selectedSpaceId, timelineDays, auditActionFilter]);

  // Handler: Approve Booking
  const handleConfirmApprove = async () => {
    if (!approvingBooking) return;
    setActionLoading(true);
    try {
      await staffApi.approveBooking(approvingBooking.id);
      showToast(`✓ Đã duyệt thành công yêu cầu đặt phòng #${approvingBooking.id}`);
      setApproveConfirmOpen(false);
      setApprovingBooking(null);
      fetchPending();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi duyệt đặt phòng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reject Booking
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingBooking) return;
    setActionLoading(true);
    try {
      await staffApi.rejectBooking(rejectingBooking.id, reason);
      showToast(`✕ Đã từ chối yêu cầu đặt phòng #${rejectingBooking.id}`);
      setRejectModalOpen(false);
      setRejectingBooking(null);
      fetchPending();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi từ chối đặt phòng', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Staff Check-In
  const handleStaffCheckIn = async (bookingId: number) => {
    setCheckInLoadingId(bookingId);
    try {
      await staffApi.staffAssistedCheckIn(bookingId);
      showToast(`✓ Staff hỗ trợ Check-in thành công cho Booking #${bookingId}`);
      if (selectedSpaceId) fetchTimeline(selectedSpaceId, timelineDays);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi hỗ trợ check-in', 'error');
    } finally {
      setCheckInLoadingId(null);
    }
  };

  // Handler: Save Maintenance
  const handleSaveMaintenance = async (
    spId: number,
    data: MaintenanceCreateRequest | MaintenanceUpdateRequest
  ) => {
    try {
      if (maintMode === 'create') {
        await maintenanceApi.createMaintenance(spId, data as MaintenanceCreateRequest);
        showToast('✓ Đã tạo khoảng bảo trì thành công');
      } else if (editingMaint) {
        await maintenanceApi.updateMaintenance(editingMaint.id, data as MaintenanceUpdateRequest);
        showToast('✓ Đã cập nhật thông tin bảo trì');
      }
      setMaintModalOpen(false);
      fetchMaintenance(spId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi lưu bảo trì', 'error');
      throw err;
    }
  };

  // Handler: Delete Maintenance
  const handleDeleteMaintenance = async () => {
    if (!deletingMaint) return;
    setActionLoading(true);
    try {
      await maintenanceApi.deleteMaintenance(deletingMaint.id);
      showToast(`✓ Đã hủy khoảng bảo trì #${deletingMaint.id}`);
      setDeleteMaintConfirmOpen(false);
      setDeletingMaint(null);
      if (selectedSpaceId) fetchMaintenance(selectedSpaceId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi hủy bảo trì', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="staff-page-wrapper">
      {/* Tabs Navigation */}
      <div className="staff-tabs-bar">
        <button
          type="button"
          className={`staff-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          📋 Duyệt đặt phòng
          {pendingBookings.length > 0 && (
            <span className="staff-tab-count alert">{pendingBookings.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`staff-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 Timeline hoạt động
        </button>

        <button
          type="button"
          className={`staff-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          🛠️ Quản lý bảo trì
        </button>

        <button
          type="button"
          className={`staff-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📜 Nhật ký kiểm toán (Audit Logs)
        </button>
      </div>

      {/* Main Content Area */}
      <main className="kt-main-content">
        {/* Tab 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="staff-rule-notice">
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <strong>Quy tắc nghiệp vụ phê duyệt phòng chuyên dụng (Staff Workflow):</strong>
                <div>
                  Theo quy tắc <code>R-18</code>, Staff chỉ có thể duyệt khi <code>now &lt; startTime</code>. Nếu đã quá giờ, booking tự chuyển sang <code>EXPIRED</code>. Khi từ chối bắt buộc nhập lý do theo quy tắc <code>R-20</code>.
                </div>
              </div>
            </div>

            <div className="filter-action-bar">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                  Danh sách yêu cầu đặt chỗ đang chờ duyệt ({pendingBookings.length})
                </h3>
              </div>
              <button
                type="button"
                className="btn-refresh-data"
                onClick={fetchPending}
                disabled={loadingPending}
              >
                🔄 Tải lại dữ liệu
              </button>
            </div>

            <PendingBookingTableKT
              bookings={pendingBookings}
              isLoading={loadingPending}
              onApprove={(b) => {
                setApprovingBooking(b);
                setApproveConfirmOpen(true);
              }}
              onReject={(b) => {
                setRejectingBooking(b);
                setRejectModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="staff-rule-notice notice-warning">
              <span style={{ fontSize: '20px' }}>ℹ️</span>
              <div>
                <strong>Dòng thời gian vận hành hợp nhất:</strong> Hiển thị cả lịch đặt phòng sinh viên và các khoảng bảo trì kỹ thuật để tránh xung đột lịch trình.
              </div>
            </div>

            <div className="filter-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                  Chọn không gian:
                </label>
                <select
                  className="filter-select-dropdown"
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(Number(e.target.value))}
                >
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.building || 'Tòa nhà'} • #{sp.id})
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', marginLeft: '8px' }}>
                  Khoảng thời gian:
                </label>
                <select
                  className="filter-select-dropdown"
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(Number(e.target.value))}
                >
                  <option value={3}>3 ngày tới</option>
                  <option value={7}>7 ngày tới</option>
                  <option value={14}>14 ngày tới</option>
                  <option value={30}>30 ngày tới</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-refresh-data"
                onClick={() => fetchTimeline(selectedSpaceId, timelineDays)}
                disabled={loadingTimeline}
              >
                🔄 Cập nhật Timeline
              </button>
            </div>

            <StaffTimelineKT
              events={timeline?.events || []}
              isLoading={loadingTimeline}
              onCheckIn={handleStaffCheckIn}
              onVerifyToken={setTokenBookingId}
              checkInLoadingId={checkInLoadingId}
            />
            {tokenBookingId !== null && (
              <div className="staff-token-verification">
                <div className="staff-token-verification__heading">
                  <div>
                    <strong>Xác minh check-in bằng QR/mã một lần</strong>
                    <span>Booking #{tokenBookingId}</span>
                  </div>
                  <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setTokenBookingId(null)}>
                    Đóng
                  </button>
                </div>
                <CheckInTokenInput
                  bookingId={tokenBookingId}
                  onVerified={() => {
                    showToast(`✓ Đã xác minh mã cho Booking #${tokenBookingId}`);
                    setTokenBookingId(null);
                    if (selectedSpaceId) fetchTimeline(selectedSpaceId, timelineDays);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Maintenance Blocks */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="filter-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                  Không gian:
                </label>
                <select
                  className="filter-select-dropdown"
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(Number(e.target.value))}
                >
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.building || 'Tòa nhà'} • #{sp.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn-primary-add"
                onClick={() => {
                  setEditingMaint(null);
                  setMaintMode('create');
                  setMaintModalOpen(true);
                }}
              >
                + Tạo khoảng bảo trì
              </button>
            </div>

            {loadingMaintenance ? (
              <div className="staff-loading-card">
                <div className="staff-spinner" />
                <p>Đang tải danh sách bảo trì...</p>
              </div>
            ) : maintenanceList.length === 0 ? (
              <div className="staff-empty-card">
                <span style={{ fontSize: '32px' }}>🛠️</span>
                <h4>Không có lịch bảo trì nào cho không gian này</h4>
                <p>Không gian đang sẵn sàng phục vụ sinh viên mà không bị khóa lịch.</p>
              </div>
            ) : (
              <div className="staff-table-card">
                <table className="staff-data-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Lý do bảo trì</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceList.map((m) => {
                      const startDt = new Date(m.startTime);
                      const endDt = new Date(m.endTime);

                      return (
                        <tr key={m.id}>
                          <td>#{m.id}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.reason}</td>
                          <td>
                            {startDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                            {startDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            {endDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                            {endDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <span className="staff-badge staff-badge-maintenance">{m.status || 'SCHEDULED'}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                className="staff-btn staff-btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => {
                                  setEditingMaint(m);
                                  setMaintMode('edit');
                                  setMaintModalOpen(true);
                                }}
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                className="staff-btn staff-btn-danger"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => {
                                  setDeletingMaint(m);
                                  setDeleteMaintConfirmOpen(true);
                                }}
                              >
                                🗑️ Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="filter-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                  Lọc theo hành động:
                </label>
                <select
                  className="filter-select-dropdown"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                >
                  <option value="">Tất cả hành động</option>
                  <option value="BOOKING_APPROVED">Duyệt đặt phòng (BOOKING_APPROVED)</option>
                  <option value="BOOKING_REJECTED">Từ chối đặt phòng (BOOKING_REJECTED)</option>
                  <option value="STAFF_CHECK_IN">Staff hỗ trợ Check-in</option>
                  <option value="MAINTENANCE_CREATED">Tạo bảo trì</option>
                  <option value="MAINTENANCE_UPDATED">Sửa bảo trì</option>
                  <option value="MAINTENANCE_DELETED">Hủy bảo trì</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-refresh-data"
                onClick={() => fetchAuditLogs(auditActionFilter)}
                disabled={loadingAudit}
              >
                🔄 Tải lại nhật ký
              </button>
            </div>

            <StaffAuditLogTableKT logs={auditLogs} isLoading={loadingAudit} />
          </div>
        )}
      </main>

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

      {/* Modals */}
      <ConfirmDialog
        isOpen={approveConfirmOpen}
        title={`Xác nhận duyệt yêu cầu đặt phòng #${approvingBooking?.id || ''}`}
        message={`Bạn có chắc chắn muốn duyệt yêu cầu đặt phòng "${approvingBooking?.spaceName}" của sinh viên ${approvingBooking?.studentName}? Trạng thái sẽ chuyển sang CONFIRMED.`}
        confirmText="✓ Xác nhận duyệt"
        cancelText="Hủy bỏ"
        isLoading={actionLoading}
        onConfirm={handleConfirmApprove}
        onCancel={() => {
          setApproveConfirmOpen(false);
          setApprovingBooking(null);
        }}
      />

      <RejectBookingModalKT
        isOpen={rejectModalOpen}
        booking={rejectingBooking}
        isLoading={actionLoading}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingBooking(null);
        }}
        onConfirm={handleConfirmReject}
      />

      <MaintenanceFormModalKT
        isOpen={maintModalOpen}
        mode={maintMode}
        maintenance={editingMaint}
        spaces={spaces}
        defaultSpaceId={selectedSpaceId}
        onClose={() => setMaintModalOpen(false)}
        onSubmit={handleSaveMaintenance}
      />

      <ConfirmDialog
        isOpen={deleteMaintConfirmOpen}
        title={`Hủy khoảng bảo trì #${deletingMaint?.id || ''}`}
        message={`Bạn có chắc chắn muốn hủy bảo trì cho "${deletingMaint?.spaceName}" (Lý do: "${deletingMaint?.reason}")? Không gian sẽ mở lại cho sinh viên đặt.`}
        confirmText="Xác nhận hủy"
        cancelText="Đóng"
        isLoading={actionLoading}
        onConfirm={handleDeleteMaintenance}
        onCancel={() => {
          setDeleteMaintConfirmOpen(false);
          setDeletingMaint(null);
        }}
      />
    </div>
  );
};
