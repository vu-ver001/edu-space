import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  DoorOpen,
  Armchair,
  Info,
  Sliders,
  BarChart3,
  Building2,
  CheckCircle2,
  Wrench,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import type { SpaceType, SpaceTypeUpdateRequest } from '../types/spaceType';
import type { Space } from '../types/space';
import { spaceTypeApi } from '../api/spaceTypeApi';
import { spaceApi } from '../api/spaceApi';
import { SpaceTypeFormModalKT } from '../components/SpaceTypeFormModalKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import './SpaceTypeDetailPageKT.css';

const DEFAULT_SPACE_IMAGES = [
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&auto=format&fit=crop&q=80',
];

export const SpaceTypeDetailPageKT: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [spaceType, setSpaceType] = useState<SpaceType | null>(null);
  const [associatedSpaces, setAssociatedSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expand spaces list
  const [showAllSpaces, setShowAllSpaces] = useState<boolean>(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const typeId = Number(id);

      // Call backend API for SpaceType and Spaces
      const [typeData, spacesData] = await Promise.all([
        spaceTypeApi.getById(typeId),
        spaceApi.getAllSpaces({ spaceTypeId: typeId }).catch(async () => {
          // Fallback if backend doesn't support query param on this endpoint
          const all = await spaceTypeApi.getAllSpaces().catch(() => []);
          return all.filter((s) => (s.spaceType?.id ?? s.spaceTypeId) === typeId);
        }),
      ]);

      setSpaceType(typeData);

      // Double-check filtering by spaceTypeId
      const matchedSpaces = (spacesData || []).filter(
        (s) => (s.spaceType?.id ?? s.spaceTypeId) === typeId
      );
      setAssociatedSpaces(matchedSpaces);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tìm thấy loại không gian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Dynamic statistics calculated from backend space list
  const stats = useMemo(() => {
    const total = associatedSpaces.length;
    const active = associatedSpaces.filter((s) => s.status === 'AVAILABLE').length;
    const maintenance = associatedSpaces.filter((s) => s.status === 'MAINTENANCE').length;
    const inactive = associatedSpaces.filter((s) => s.status === 'INACTIVE').length;

    return { total, active, maintenance, inactive };
  }, [associatedSpaces]);

  const handleUpdate = async (data: any) => {
    if (!spaceType) return;
    setIsSubmitting(true);
    try {
      const updated = await spaceTypeApi.update(spaceType.id, data as SpaceTypeUpdateRequest);
      setSpaceType(updated);
      setIsEditOpen(false);
      showToast(`Đã cập nhật loại không gian "${updated.name}"`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể lưu thông tin. Vui lòng thử lại.', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!spaceType) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await spaceTypeApi.delete(spaceType.id);
      showToast(`Đã xóa loại không gian "${spaceType.name}"`);
      setIsDeleteOpen(false);
      setDeleteError(null);
      setTimeout(() => {
        navigate('/admin/space-types');
      }, 700);
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      let msg = 'Không thể xóa loại không gian.';
      if (rawMsg.includes('Vẫn còn phòng') || rawMsg.includes('SPACE_TYPE_IN_USE')) {
        msg = 'Không thể xóa do vẫn còn phòng đang hoạt động.';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setDeleteError(msg);
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const formatLocation = (space: Space) => {
    const building = space.building
      ? space.building.toLowerCase().startsWith('tòa')
        ? space.building
        : `Tòa ${space.building}`
      : 'Tòa B';
    const floor = space.floor
      ? space.floor.toLowerCase().startsWith('tầng')
        ? space.floor
        : `Tầng ${space.floor}`
      : 'Tầng 2';
    return `${building} - ${floor}`;
  };

  const getSpaceImage = (space: Space, idx: number) => {
    if (space.primaryImageUrl) return space.primaryImageUrl;
    if (space.imageUrl) return space.imageUrl;
    return DEFAULT_SPACE_IMAGES[idx % DEFAULT_SPACE_IMAGES.length];
  };

  const getVietnameseModeName = (mode?: string) => {
    switch (mode) {
      case 'WHOLE_SPACE':
        return 'Đặt nguyên phòng';
      case 'PER_SEAT':
        return 'Đặt theo chỗ ngồi';
      case 'PER_TABLE':
        return 'Đặt theo bàn';
      default:
        return mode || 'Đặt chỗ';
    }
  };

  const renderModeIcon = (mode?: string) => {
    if (mode === 'PER_TABLE') {
      return (
        <div className="banner-icon-box banner-icon-purple">
          <Users size={28} strokeWidth={2.2} />
        </div>
      );
    }
    if (mode === 'WHOLE_SPACE') {
      return (
        <div className="banner-icon-box banner-icon-sky">
          <DoorOpen size={28} strokeWidth={2.2} />
        </div>
      );
    }
    return (
      <div className="banner-icon-box banner-icon-green">
        <Armchair size={28} strokeWidth={2.2} />
      </div>
    );
  };

  const renderRulesContent = (mode?: string) => {
    if (mode === 'PER_TABLE') {
      return (
        <>
          <p style={{ margin: 0 }}>
            Đối với loại không gian đặt theo bàn, người dùng sẽ đặt một hoặc nhiều bàn trong không gian.
          </p>
          <p style={{ margin: 0 }}>
            Xung đột đặt chỗ được kiểm tra theo bàn (table_id) nếu thời gian đặt chỗ trùng nhau.
          </p>
        </>
      );
    }
    if (mode === 'WHOLE_SPACE') {
      return (
        <>
          <p style={{ margin: 0 }}>
            Đối với loại không gian đặt nguyên phòng, người dùng sẽ đặt toàn bộ không gian cho một khung giờ.
          </p>
          <p style={{ margin: 0 }}>
            Xung đột đặt chỗ được kiểm tra trên toàn bộ phòng (space_id) nếu thời gian đặt chỗ trùng nhau.
          </p>
        </>
      );
    }
    return (
      <>
        <p style={{ margin: 0 }}>
          Đối với loại không gian đặt theo chỗ ngồi, người dùng sẽ đặt một hoặc nhiều ghế cụ thể trong không gian.
        </p>
        <p style={{ margin: 0 }}>
          Xung đột đặt chỗ được kiểm tra theo từng ghế (seat_id) nếu thời gian đặt chỗ trùng nhau.
        </p>
      </>
    );
  };

  if (loading) {
    return (
      <div className="space-type-detail-page">
        <main className="detail-main-content">
          <div className="detail-loading-wrapper">
            <p>Đang tải dữ liệu chi tiết loại không gian...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !spaceType) {
    return (
      <div className="space-type-detail-page">
        <main className="detail-main-content">
          <div className="detail-header-row">
            <div className="detail-header-left">
              <h1 className="detail-header-title">Chi tiết loại không gian</h1>
              <p className="detail-header-subtitle">Xem thông tin chi tiết về loại không gian trong hệ thống.</p>
            </div>
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/space-types')}
            >
              ← Quay lại
            </button>
          </div>
          <div className="detail-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: '#ef4444', fontSize: '15px', marginBottom: '16px' }}>
              {error || 'Không tìm thấy loại không gian yêu cầu.'}
            </p>
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/space-types')}
            >
              Trở về danh sách
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayedSpaces = showAllSpaces ? associatedSpaces : associatedSpaces.slice(0, 3);
  const remainingCount = Math.max(0, associatedSpaces.length - 3);

  // Formatted Code e.g. ST001
  const spaceTypeCode = `ST${String(spaceType.id).padStart(3, '0')}`;

  return (
    <div className="space-type-detail-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`astp-toast-float astp-alert ${toast.type === 'success' ? 'astp-alert-success' : 'astp-alert-error'}`}>
          <span>{toast.text}</span>
        </div>
      )}

      <main className="detail-main-content">
        {/* Top Header Row */}
        <div className="detail-header-row">
          <div className="detail-header-left">
            <h1 className="detail-header-title">Chi tiết loại không gian</h1>
            <p className="detail-header-subtitle">
              Xem thông tin chi tiết về loại không gian trong hệ thống.
            </p>
          </div>

          <div className="detail-header-actions">
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/space-types')}
              id="btn-back-to-list"
            >
              <ArrowLeft size={15} style={{ marginRight: '6px' }} />
              Quay lại
            </button>
            <button
              type="button"
              className="btn-header-edit"
              onClick={() => setIsEditOpen(true)}
              id="btn-detail-edit"
            >
              <Pencil size={15} style={{ marginRight: '6px' }} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="btn-header-back"
              style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fff' }}
              onClick={() => {
                setDeleteError(null);
                setIsDeleteOpen(true);
              }}
              id="btn-detail-delete"
            >
              <Trash2 size={15} style={{ marginRight: '6px' }} />
              Xóa
            </button>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="detail-2col-layout">
          {/* ================= LEFT COLUMN ================= */}
          <div className="detail-col-left">
            {/* Card 1: Summary Banner Card */}
            <div className="detail-card">
              <div className="banner-top-row">
                {renderModeIcon(spaceType.bookingMode)}
                <div className="banner-meta-group">
                  <span className="banner-label-sub">Loại không gian</span>
                  <h2 className="banner-title-main">{spaceType.name}</h2>
                  <div className="banner-badges-row">
                    <span className="pill-badge-mode">
                      {getVietnameseModeName(spaceType.bookingMode)}
                    </span>
                    <span className="pill-badge-active">
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>

              <div className="banner-desc-text">
                {spaceType.description || 'Chưa có thông tin mô tả chi tiết cho loại không gian này.'}
              </div>
            </div>

            {/* Card 2: Thông tin chung */}
            <div className="detail-card">
              <h3 className="card-header-with-icon">
                <Info size={18} strokeWidth={2.2} />
                Thông tin chung
              </h3>

              <div className="info-specs-list">
                {/* 1. Mã loại không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Mã loại không gian</span>
                  <div className="spec-value-box">{spaceTypeCode}</div>
                </div>

                {/* 2. Tên loại không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Tên loại không gian</span>
                  <div className="spec-value-box">{spaceType.name}</div>
                </div>

                {/* 3. Chế độ đặt chỗ */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Chế độ đặt chỗ</span>
                  <div>
                    <span className="badge-mode-full">
                      {getVietnameseModeName(spaceType.bookingMode)}
                    </span>
                  </div>
                </div>

                {/* 4. Cần duyệt */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Quy trình duyệt</span>
                  <div>
                    {spaceType.requiresApproval ? (
                      <span className="badge-approval-full-yes">Cần nhân viên xét duyệt</span>
                    ) : (
                      <span className="badge-approval-full-no">Xác nhận tự động (Không cần duyệt)</span>
                    )}
                  </div>
                </div>

                {/* 5. Mô tả */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Mô tả</span>
                  <div className="spec-value-box" style={{ fontWeight: 400 }}>
                    {spaceType.description || 'Chưa có thông tin mô tả chi tiết cho loại không gian này.'}
                  </div>
                </div>

                {/* 6. Ngày tạo */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Ngày tạo</span>
                  <div className="spec-value-box">{formatDateTime(spaceType.createdAt)}</div>
                </div>

                {/* 7. Ngày cập nhật */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Ngày cập nhật</span>
                  <div className="spec-value-box">
                    {formatDateTime(spaceType.updatedAt || spaceType.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Quy tắc đặt chỗ */}
            <div className="detail-card">
              <h3 className="card-header-with-icon">
                <Sliders size={18} strokeWidth={2.2} />
                Quy tắc đặt chỗ
              </h3>

              <div className="booking-rules-box">
                <div className="rules-icon-circle">i</div>
                <div className="rules-text-column">
                  {renderRulesContent(spaceType.bookingMode)}
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="detail-col-right">
            {/* Card 1: Thống kê 2x2 */}
            <div className="detail-card">
              <h3 className="card-header-with-icon" style={{ marginBottom: '14px' }}>
                <BarChart3 size={18} strokeWidth={2.2} />
                Thống kê
              </h3>

              <div className="stats-2x2-grid">
                {/* 1. Tổng số không gian (Sky Blue) */}
                <div className="stat-tile-box tile-sky">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Tổng số không gian</span>
                    <span className="stat-tile-number">{stats.total}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <Building2 size={20} strokeWidth={2} />
                  </div>
                </div>

                {/* 2. Đang hoạt động (Green) */}
                <div className="stat-tile-box tile-green">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Đang hoạt động</span>
                    <span className="stat-tile-number">{stats.active}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <CheckCircle2 size={20} strokeWidth={2.2} />
                  </div>
                </div>

                {/* 3. Đang bảo trì (Amber) */}
                <div className="stat-tile-box tile-amber">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Đang bảo trì</span>
                    <span className="stat-tile-number">{stats.maintenance}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <Wrench size={20} strokeWidth={2} />
                  </div>
                </div>

                {/* 4. Không hoạt động (Slate) */}
                <div className="stat-tile-box tile-slate">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Không hoạt động</span>
                    <span className="stat-tile-number">{stats.inactive}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <AlertOctagon size={20} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Các không gian thuộc loại này */}
            <div className="detail-card">
              <div className="associated-spaces-header">
                <h3 className="associated-spaces-title">
                  Các không gian thuộc loại này ({associatedSpaces.length})
                </h3>
                {associatedSpaces.length > 3 && (
                  <button
                    type="button"
                    className="btn-view-all-spaces"
                    onClick={() => setShowAllSpaces(!showAllSpaces)}
                  >
                    {showAllSpaces ? 'Thu gọn' : 'Xem tất cả'}
                  </button>
                )}
              </div>

              {associatedSpaces.length === 0 ? (
                <div className="detail-empty-state">
                  Chưa có không gian nào thuộc loại này.
                </div>
              ) : (
                <div className="spaces-items-list">
                  {displayedSpaces.map((space, idx) => (
                    <div
                      key={space.id}
                      className="space-card-item"
                      onClick={() => navigate(`/spaces/${space.id}`)}
                      title={`Bấm để xem chi tiết phòng ${space.name}`}
                    >
                      <div className="space-card-item-left">
                        <img
                          src={getSpaceImage(space, idx)}
                          alt={space.name}
                          className="space-card-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_SPACE_IMAGES[0];
                          }}
                        />
                        <div className="space-card-info">
                          <h4 className="space-card-name">{space.name}</h4>
                          <p className="space-card-location">{formatLocation(space)}</p>
                        </div>
                      </div>

                      <div className="space-card-arrow">
                        <ChevronRight size={18} strokeWidth={2.2} />
                      </div>
                    </div>
                  ))}

                  {/* Summary tile when more spaces exist */}
                  {!showAllSpaces && remainingCount > 0 && (
                    <div
                      className="space-card-more"
                      onClick={() => setShowAllSpaces(true)}
                      title="Bấm để xem tất cả không gian"
                    >
                      <div className="space-more-icon-box">•••</div>
                      <span className="space-more-text">và {remainingCount} không gian khác</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditOpen && (
        <SpaceTypeFormModalKT
          isOpen={isEditOpen}
          mode="edit"
          spaceType={spaceType}
          isLoading={isSubmitting}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && (() => {
        const linkedCount = associatedSpaces.length;
        const hasLinkedSpaces = linkedCount > 0;

        return (
          <ConfirmDialog
            isOpen={isDeleteOpen}
            title="Xác nhận xóa"
            message={`Bạn có chắc muốn xóa loại không gian "${spaceType.name}"?`}
            warningNote={
              hasLinkedSpaces
                ? `⚠️ Còn ${linkedCount} phòng thuộc loại này. Vui lòng chuyển hoặc xóa phòng trước.`
                : undefined
            }
            errorMessage={deleteError}
            isConfirmDisabled={hasLinkedSpaces}
            confirmText={hasLinkedSpaces ? 'Không thể xóa (còn phòng)' : 'Xóa'}
            cancelText={hasLinkedSpaces ? 'Đóng' : 'Hủy'}
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => {
              setIsDeleteOpen(false);
              setDeleteError(null);
            }}
          />
        );
      })()}
    </div>
  );
};

export default SpaceTypeDetailPageKT;
