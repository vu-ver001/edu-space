import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PortalLayout } from '../components/PortalLayout';
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

  // Form booking state initialized from URL params
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(searchParams.get('date') || today);
  const [startTime, setStartTime] = useState<string>(searchParams.get('startTime') || '08:00');
  const [endTime, setEndTime] = useState<string>(searchParams.get('endTime') || '10:00');
  const [participantCount, setParticipantCount] = useState<number>(
    Number(searchParams.get('participantCount')) || 4
  );
  const [purpose, setPurpose] = useState<string>('Học nhóm môn Phát triển phần mềm dịch vụ');

  // Modal chọn chỗ ngồi / chọn bàn
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Xác định chế độ đặt không gian theo đúng CSDL của Kim Tuyến (cột booking_mode)
  const bookingMode = space?.bookingMode || space?.spaceType?.bookingMode || (
    space?.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space?.spaceTypeName?.toLowerCase().includes('ghế') || space?.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );

  const isPerSeat = bookingMode === 'PER_SEAT'; // Khu tự học chung (Mở) -> Chọn theo ghế
  const isPerTable = bookingMode === 'PER_TABLE'; // Phòng thảo luận theo bàn -> Chọn theo bàn

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
    if (!date || !startTime || !endTime) {
      alert('Vui lòng điền đầy đủ ngày và khung giờ đặt phòng.');
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
      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;
      await bookingService.createBooking({
        spaceId: space.id,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount,
        purpose,
        selectedSeats: []
      });
      setToastMessage('✓ Đặt phòng thành công! Toàn bộ không gian đã được giữ chỗ cho nhóm của bạn. Đang chuyển hướng...');
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
    const label = isPerTable ? 'Bàn' : 'Ghế';
    setToastMessage(`✓ Đặt chỗ thành công! ${label} của bạn: ${selectedItems.join(', ')}. Đang chuyển hướng...`);
    setTimeout(() => {
      navigate('/my-bookings');
    }, 1500);
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Chi tiết phòng">
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>Đang tải thông tin chi tiết không gian...</p>
        </div>
      </PortalLayout>
    );
  }

  if (error || !space) {
    return (
      <PortalLayout pageTitle="Không tìm thấy phòng">
        <div className="portal-error-card">
          <span>⚠️</span>
          <h4>Lỗi tải dữ liệu</h4>
          <p>{error || 'Không tìm thấy thông tin không gian yêu cầu.'}</p>
          <button className="btn-portal-retry" onClick={() => navigate('/spaces')}>
            Quay lại tìm không gian
          </button>
        </div>
      </PortalLayout>
    );
  }

  const imageUrl = space.imageUrl || ROOM_IMAGES[space.id] || DEFAULT_IMAGE;

  return (
    <PortalLayout pageTitle={`Chi tiết ${space.name}`}>
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

      {/* Layout 2 cột theo Ảnh 2 */}
      <div className="space-detail-layout">
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT PHÒNG HỌC */}
        <div className="space-detail-left">
          {/* Card Hình ảnh lớn và Tiêu đề */}
          <div className="space-hero-card">
            <div className="space-hero-image-box">
              <img src={imageUrl} alt={space.name} className="space-hero-img" />
              <div className="hero-badge-pinned">
                {space.requiresApproval ? (
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
                <span className="type-badge-solid">{space.spaceTypeName}</span>
                <span className="meta-separator">•</span>
                <span className="location-highlight">
                  📍 {space.building} • {space.floor}
                </span>
              </div>

              {space.description && (
                <p className="space-description-paragraph">{space.description}</p>
              )}
            </div>
          </div>

          {/* Card Thông tin thông số kỹ thuật & sức chứa */}
          <div className="detail-section-card">
            <h3 className="section-card-title">Thông tin không gian</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <div className="spec-icon">👥</div>
                <div className="spec-data">
                  <span className="spec-label">Sức chứa tối đa</span>
                  <strong className="spec-value">{space.capacity} người</strong>
                </div>
              </div>

              <div className="spec-item">
                <div className="spec-icon">🛡️</div>
                <div className="spec-data">
                  <span className="spec-label">Hình thức phê duyệt</span>
                  <strong className="spec-value">
                    {space.requiresApproval ? 'Cần xét duyệt (Staff)' : 'Duyệt tự động (Tức thì)'}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <div className="spec-icon">{isPerSeat ? '🎧' : isPerTable ? '👥' : '🏢'}</div>
                <div className="spec-data">
                  <span className="spec-label">Mô hình đặt chỗ</span>
                  <strong className="spec-value">
                    {isPerSeat ? 'Chọn ghế ngồi (Cá nhân)' : isPerTable ? 'Chọn theo bàn (Thảo luận)' : 'Đặt trọn phòng (Theo nhóm)'}
                  </strong>
                </div>
              </div>

              <div className="spec-item">
                <div className="spec-icon">🕒</div>
                <div className="spec-data">
                  <span className="spec-label">Giờ phục vụ</span>
                  <strong className="spec-value">07:00 - 21:00 hàng ngày</strong>
                </div>
              </div>

              <div className="spec-item">
                <div className="spec-icon">📶</div>
                <div className="spec-data">
                  <span className="spec-label">Mạng kết nối</span>
                  <strong className="spec-value">Wifi EduSpace High-Speed</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card Tiện ích có sẵn */}
          <div className="detail-section-card">
            <h3 className="section-card-title">Tiện ích trang bị sẵn trong phòng</h3>
            <div className="facilities-grid">
              {space.facilities && space.facilities.length > 0 ? (
                space.facilities.map((f) => (
                  <div key={f.id} className="facility-badge-item">
                    <span className="check-icon">✓</span>
                    <span className="facility-text">{f.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted">Đầy đủ bàn ghế, ánh sáng tiêu chuẩn và ổ cắm điện.</p>
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

            <form onSubmit={handleFormSubmit} className="detail-booking-form">
              {/* Ngày */}
              <div className="form-field-group">
                <label className="form-label">Ngày sử dụng</label>
                <input
                  type="date"
                  className="form-control-input"
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
                  <select
                    className="form-control-select"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label">Giờ kết thúc</label>
                  <select
                    className="form-control-select"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
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
                  onChange={(e) => setParticipantCount(Math.min(space.capacity, Math.max(1, parseInt(e.target.value) || 1)))}
                  required
                />
              </div>

              {/* Mục đích sử dụng */}
              <div className="form-field-group">
                <label className="form-label">Mục đích sử dụng</label>
                <textarea
                  className="form-control-textarea"
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ví dụ: Học nhóm môn PTPMDV, chuẩn bị thuyết trình..."
                  required
                />
              </div>

              {/* Trạng thái khả dụng tóm tắt */}
              <div className="availability-highlight-box">
                <div className="avail-icon">🟢</div>
                <div className="avail-text">
                  <strong>Phòng sẵn sàng</strong>
                  <span>Khung giờ đã chọn khả dụng để đặt chỗ</span>
                </div>
              </div>

              {/* Nút Đặt chỗ */}
              <button 
                type="submit" 
                className="btn-detail-book-now"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="portal-spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
                    Đang xử lý đặt phòng...
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
                  <>💡 Bấm <strong>Chọn chỗ ngồi & Đặt chỗ</strong> để mở sơ đồ chọn vị trí ghế cá nhân (S01 - S10).</>
                ) : isPerTable ? (
                  <>💡 Bấm <strong>Chọn bàn thảo luận & Đặt bàn</strong> để mở sơ đồ chọn bàn học nhóm (T01 - T04).</>
                ) : (
                  <>💡 <strong>{space?.name}</strong> được đặt trọn gói toàn bộ không gian ({space?.capacity} chỗ), không áp dụng chọn ghế/bàn riêng lẻ.</>
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
          participantCount={participantCount}
          purpose={purpose}
          mode={isPerTable ? 'TABLE' : 'SEAT'}
          onClose={() => setIsSeatModalOpen(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </PortalLayout>
  );
};
