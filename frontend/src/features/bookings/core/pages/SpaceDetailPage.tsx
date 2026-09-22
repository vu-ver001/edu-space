import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SeatSelectionModal } from '../components/SeatSelectionModal';
import type { Space } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import { bookingService } from '../services/bookingService';

// Default photos fallback
const ROOM_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
  3: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
  4: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
  5: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  6: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';

export const SpaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTime = (t: string | null, fallback: string) => {
    if (!t) return fallback;
    const parts = t.trim().split(':');
    return `${(parts[0] || '08').padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  };

  const toIsoDateTime = (dateStr: string, timeStr: string) => {
    const parts = (timeStr || '').trim().split(':');
    const h = (parts[0] || '08').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return `${dateStr}T${h}:${m}:${s}`;
  };

  // Form booking state initialized from URL params
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(searchParams.get('date') || today);
  const [startTime, setStartTime] = useState<string>(normalizeTime(searchParams.get('startTime'), '08:00'));
  const [endTime, setEndTime] = useState<string>(normalizeTime(searchParams.get('endTime'), '10:00'));
  const [participantCount, setParticipantCount] = useState<number | string>(
    Number(searchParams.get('participantCount')) || 4
  );
  const [purpose, setPurpose] = useState<string>('');

  // Modal chọn chỗ ngồi / chọn bàn
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookingMode = space?.bookingMode || space?.spaceType?.bookingMode || (
    space?.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space?.spaceTypeName?.toLowerCase().includes('ghế') || space?.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );

  const isPerSeat = bookingMode === 'PER_SEAT'; // Khu tự học chung (Mở) -> Chọn theo ghế
  const isPerTable = bookingMode === 'PER_TABLE'; // Phòng thảo luận theo bàn -> Chọn theo bàn
  // LOGIC LIÊN KẾT CSDL: Lấy trực tiếp từ space.requiresApproval (cột space_types.requires_approval của Kim Tuyến)
  const requiresApproval = space?.requiresApproval ?? (space?.spaceType?.requiresApproval ?? !isPerSeat);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    spaceService
      .getSpaceById(Number(id))
      .then((data) => {
        setSpace(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Không thể tải thông tin phòng học.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (space?.status && space.status !== 'AVAILABLE') {
      setBookingError(`Không gian này hiện đang ở trạng thái ${space.status === 'MAINTENANCE' ? 'Bảo trì' : 'Tạm khóa'}, tạm thời không nhận đặt chỗ.`);
      return;
    }

    if (!date || !startTime || !endTime) {
      setBookingError('Vui lòng điền đầy đủ ngày và khung giờ đặt phòng.');
      return;
    }

    if (startTime >= endTime) {
      setBookingError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    // Bắt buộc nhập lý do sử dụng nếu phòng cần duyệt trước theo CSDL
    if (requiresApproval && (!purpose || !purpose.trim())) {
      setBookingError('Vui lòng nhập mục đích sử dụng (bắt buộc đối với không gian cần nhân viên duyệt).');
      return;
    }

    // 1. Nếu là PER_SEAT hoặc PER_TABLE: Mở modal chọn chỗ ngồi hoặc chọn bàn
    if (isPerSeat || isPerTable) {
      setIsSeatModalOpen(true);
      return;
    }

    // 2. Nếu là WHOLE_SPACE (Study Booth, phòng nhóm, thuyết trình...): Đặt phòng như bình thường trực tiếp!
    if (!space) return;
    setSubmitting(true);
    try {
      const startDateTime = toIsoDateTime(date, startTime);
      const endDateTime = toIsoDateTime(date, endTime);
      await bookingService.createBooking({
        spaceId: space.id,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount: Number(participantCount) || 1,
        purpose: purpose.trim() || 'Học tập & Thảo luận nhóm',
        selectedSeats: []
      });
      if (requiresApproval) {
        setToastMessage('✓ Yêu cầu đặt phòng đã gửi thành công! Đang chờ Staff xét duyệt...');
      } else {
        setToastMessage('✓ Đặt phòng thành công! Toàn bộ không gian đã được giữ chỗ cho nhóm của bạn. Đang chuyển hướng...');
      }
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || err?.message || 'Không thể hoàn tất đặt phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSuccess = (_bookingId: number, selectedItems: string[]) => {
    setIsSeatModalOpen(false);
    if (isPerTable) {
      setToastMessage(`✓ Yêu cầu đặt bàn ${selectedItems.join(', ')} đã gửi thành công! Đang chờ Staff xét duyệt...`);
    } else {
      setToastMessage(`✓ Đặt chỗ thành công! Chỗ ngồi ${selectedItems.join(', ')} đã được xác nhận. Đang chuyển hướng...`);
    }
    setTimeout(() => {
      navigate('/my-bookings');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-detail-page">
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>Đang tải thông tin chi tiết không gian...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="space-detail-page">
        <div className="portal-error-card">
          <span>⚠️</span>
          <h4>Lỗi tải dữ liệu</h4>
          <p>{error || 'Không tìm thấy thông tin không gian yêu cầu.'}</p>
          <button className="btn-portal-retry" onClick={() => navigate('/spaces')}>
            Quay lại tìm không gian
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = space.imageUrl || ROOM_IMAGES[space.id] || DEFAULT_IMAGE;

  return (
    <div className="space-detail-page">
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Nút Quay lại theo Ảnh 2 */}
      <div className="back-navigation-bar">
        <button
          type="button"
          className="btn-back-link"
          onClick={() => navigate('/spaces')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Quay lại tìm không gian
        </button>
      </div>

      {/* Layout 2 cột theo yêu cầu: Cột trái hẹp lại, Cột phải form rộng dài hơn, hiển thị trọn trong 1 màn hình */}
      <div className="space-detail-layout">
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT PHÒNG HỌC (THU GỌN VỪA VẶN 1 TRANG) */}
        <div className="space-detail-left">
          {/* Card Hình ảnh và Tiêu đề tích hợp Thông số & Tiện ích */}
          <div className="space-hero-card">
            <div className="space-hero-image-box">
              <img src={imageUrl} alt={space.name} className="space-hero-img" />
              <div className="hero-badge-pinned">
                {space.status === 'MAINTENANCE' ? (
                  <span className="badge-status-pill" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECDD3' }}>
                    <span className="badge-dot" style={{ background: '#DC2626' }} /> Đang bảo trì
                  </span>
                ) : space.status === 'INACTIVE' ? (
                  <span className="badge-status-pill" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                    <span className="badge-dot" style={{ background: '#94A3B8' }} /> Tạm khóa
                  </span>
                ) : requiresApproval ? (
                  <span className="badge-status-pill badge-approval">
                    <span className="badge-dot dot-amber" /> Cần phê duyệt
                  </span>
                ) : (
                  <span className="badge-status-pill badge-available">
                    <span className="badge-dot dot-green" /> Có thể đặt
                  </span>
                )}
              </div>
            </div>

            <div className="space-hero-content">
              <h1 className="space-detail-title">{space.name}</h1>
              <div className="space-detail-subtitle">
                <span className="type-badge-solid">
                  {space.spaceTypeName || space.spaceType?.name || 'Không gian học tập'}
                </span>
              </div>

              {space.description && (
                <p className="space-description-paragraph">{space.description}</p>
              )}

              {/* Thông số kỹ thuật 100% liên kết CSDL (Địa điểm, Sức chứa, Phê duyệt, Mô hình) */}
              <div className="specs-compact-grid">
                {/* Khung 1: Địa điểm */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">📍</span>
                  <div>
                    <span className="spec-compact-label">Địa điểm</span>
                    <strong className="spec-compact-val">
                      {space.building} • {space.floor ? (space.floor.toString().toLowerCase().includes('tầng') ? space.floor : `Tầng ${space.floor}`) : 'Đang cập nhật'}
                    </strong>
                  </div>
                </div>

                {/* Khung 2: Sức chứa */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">👥</span>
                  <div>
                    <span className="spec-compact-label">Sức chứa</span>
                    <strong className="spec-compact-val">{space.capacity} người</strong>
                  </div>
                </div>

                {/* Khung 3: Phê duyệt */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">🛡️</span>
                  <div>
                    <span className="spec-compact-label">Phê duyệt</span>
                    <strong className="spec-compact-val">
                      {requiresApproval ? 'Cần xét duyệt (Staff)' : 'Duyệt tự động'}
                    </strong>
                  </div>
                </div>

                {/* Khung 4: Mô hình */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">{isPerSeat ? '🎧' : isPerTable ? '👥' : '🏢'}</span>
                  <div>
                    <span className="spec-compact-label">Mô hình</span>
                    <strong className="spec-compact-val">
                      {isPerSeat ? 'Chọn ghế ngồi' : isPerTable ? 'Chọn theo bàn' : 'Trọn phòng'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tiện ích có sẵn thu gọn dạng tag */}
              {space.facilities && space.facilities.length > 0 && (
                <div className="facilities-compact-box">
                  <span className="facilities-compact-label">Tiện ích:</span>
                  <div className="facilities-pills-row">
                    {space.facilities.map((f: any, idx: number) => {
                      const name = typeof f === 'string' ? f : f?.name;
                      const key = typeof f === 'object' && f?.id ? f.id : `${name}-${idx}`;
                      return (
                        <span key={key} className="facility-pill-tag">
                          ✓ {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CARD FORM ĐẶT CHỖ (ẢNH 2) */}
        <div className="space-detail-right">
          <div className="booking-form-sticky-card">
            <div className="card-form-header">
              <h3 className="form-card-title">Đặt chỗ không gian này</h3>
              <p className="form-card-subtitle">
                {isPerSeat ? 'Xác nhận khung giờ và chọn vị trí ghế ngồi cá nhân' : isPerTable ? 'Xác nhận khung giờ và chọn bàn thảo luận nhóm' : 'Xác nhận khung giờ và đặt trọn gói nguyên phòng'}
              </p>
            </div>

            {space.status === 'MAINTENANCE' && (
              <div style={{ margin: '14px 20px 0', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: '10px', color: '#DC2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔧</span>
                <span><strong>Không gian đang bảo trì:</strong> Tạm thời không thể tiếp nhận đặt chỗ mới.</span>
              </div>
            )}
            {space.status === 'INACTIVE' && (
              <div style={{ margin: '14px 20px 0', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span><strong>Không gian tạm ngưng:</strong> Hiện không khả dụng cho các phiên đặt phòng.</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="detail-booking-form">
              {/* Ngày */}
              <div className="form-field-group">
                <label className="form-label">Ngày sử dụng</label>
                <input
                  type="date"
                  className="form-control-input internal-date-input"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Khung giờ: Bắt đầu & Kết thúc */}
              <div className="form-time-row">
                <div className="form-field-group">
                  <label className="form-label">Giờ bắt đầu</label>
                  <input
                    type="time"
                    step="60"
                    className="form-control-input internal-time-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label">Giờ kết thúc</label>
                  <input
                    type="time"
                    step="60"
                    className="form-control-input internal-time-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Số người tham gia */}
              <div className="form-field-group">
                <label className="form-label">Số người tham gia (Tối đa {space.capacity})</label>
                <input
                  type="number"
                  className="form-control-input"
                  value={participantCount}
                  min={1}
                  max={space.capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setParticipantCount(val === '' ? '' : parseInt(val) || 1);
                  }}
                  onBlur={() => {
                    if (!participantCount || Number(participantCount) < 1) {
                      setParticipantCount(1);
                    } else if (Number(participantCount) > space.capacity) {
                      setParticipantCount(space.capacity);
                    }
                  }}
                  required
                />
              </div>

              {/* Mục đích sử dụng */}
              <div className="form-field-group">
                <label className="form-label">
                  Mục đích sử dụng {requiresApproval && <span style={{ color: '#EF4444', fontWeight: 700 }}>*</span>}
                </label>
                <textarea
                  className="form-control-textarea"
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={
                    requiresApproval
                      ? "Ví dụ: Thuyết trình đồ án, workshop câu lạc bộ, họp nhóm lớn..."
                      : "Tùy chọn: Tự học cá nhân, ôn thi... (Có thể để trống)"
                  }
                  required={requiresApproval}
                />
              </div>

              {/* Nút Đặt chỗ */}
              <button 
                type="submit" 
                className="btn-detail-book-now"
                disabled={submitting || (space?.status != null && space.status !== 'AVAILABLE')}
                style={{
                  opacity: (space?.status != null && space.status !== 'AVAILABLE') ? 0.6 : 1,
                  cursor: (space?.status != null && space.status !== 'AVAILABLE') ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <div className="portal-spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
                    Đang xử lý đặt phòng...
                  </>
                ) : space?.status === 'MAINTENANCE' ? (
                  <>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>🔧</span>
                    Không gian đang bảo trì (Tạm khóa)
                  </>
                ) : space?.status === 'INACTIVE' ? (
                  <>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>🔒</span>
                    Không gian tạm ngưng hoạt động
                  </>
                ) : isPerSeat ? (
                  <>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>💺</span>
                    Chọn chỗ ngồi & Đặt chỗ
                  </>
                ) : isPerTable ? (
                  <>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>🪑</span>
                    Chọn bàn thảo luận & Đặt bàn
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Xác nhận đặt toàn bộ không gian
                  </>
                )}
              </button>

              {bookingError && (
                <div className="form-error-notice" style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                  ⚠️ {bookingError}
                </div>
              )}

              <p className="form-step-hint">
                {isPerSeat ? (
                  <>💡 Bấm <strong>Chọn chỗ ngồi & Đặt chỗ</strong> để mở sơ đồ chọn ghế cá nhân (S01 - S10). Chế độ đặt theo chỗ ngồi được duyệt tự động ngay lập tức, không bắt buộc điền mục đích sử dụng.</>
                ) : isPerTable ? (
                  <>💡 Bấm <strong>Chọn bàn thảo luận & Đặt bàn</strong> để mở sơ đồ chọn bàn học nhóm (T01 - T04). Bắt buộc điền mục đích sử dụng và chờ Staff xét duyệt.</>
                ) : (
                  <>💡 <strong>{space?.name}</strong> được đặt trọn gói toàn bộ không gian ({space?.capacity} chỗ). Bắt buộc điền mục đích sử dụng và chờ Staff xét duyệt.</>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Modal sơ đồ chọn Chỗ ngồi (PER_SEAT) hoặc Bàn thảo luận (PER_TABLE) */}
      {(isPerSeat || isPerTable) && isSeatModalOpen && (
        <SeatSelectionModal
          space={space}
          date={date}
          startTime={startTime}
          endTime={endTime}
          participantCount={Number(participantCount) || 1}
          purpose={purpose}
          mode={isPerTable ? 'TABLE' : 'SEAT'}
          onClose={() => setIsSeatModalOpen(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
