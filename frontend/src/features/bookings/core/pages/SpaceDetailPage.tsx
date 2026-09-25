import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SeatSelectionModal } from '../components/SeatSelectionModal';
import { formatMaintenanceTime, TableMeetingIcon } from '../components/RoomCard';
import { Armchair, Building2 } from 'lucide-react';
import type { Space, MaintenanceSchedule } from '../services/spaceService';
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
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Tính toán giờ khởi tạo thông minh để tránh rơi vào quá khứ khi mở trang
  const getSmartInitialTimes = () => {
    const paramStart = searchParams.get('startTime');
    const paramEnd = searchParams.get('endTime');
    const paramDate = searchParams.get('date');
    const targetDate = paramDate || today;

    if (paramStart && paramEnd) {
      return { initStart: normalizeTime(paramStart, '08:00'), initEnd: normalizeTime(paramEnd, '10:00') };
    }

    if (targetDate === today) {
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      let nextStartH = currentM > 0 ? currentH + 1 : currentH;
      if (nextStartH < 7) nextStartH = 7;
      if (nextStartH >= 22) nextStartH = 20;
      let nextEndH = Math.min(nextStartH + 2, 22);
      if (nextEndH <= nextStartH) nextEndH = Math.min(nextStartH + 1, 23);
      return {
        initStart: `${String(nextStartH).padStart(2, '0')}:00`,
        initEnd: `${String(nextEndH).padStart(2, '0')}:00`
      };
    }
    return { initStart: '08:00', initEnd: '10:00' };
  };

  const { initStart, initEnd } = getSmartInitialTimes();
  const [date, setDate] = useState<string>(searchParams.get('date') || today);
  const [startTime, setStartTime] = useState<string>(initStart);
  const [endTime, setEndTime] = useState<string>(initEnd);
  const [participantCount, setParticipantCount] = useState<number | string>(
    Number(searchParams.get('participantCount')) || 4
  );
  const [purpose, setPurpose] = useState<string>('');

  // Modal chọn chỗ ngồi / chọn bàn
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const formatTimeHHmm = (timeStr?: string, defaultVal: string = '07:00'): string => {
    if (!timeStr) return defaultVal;
    const trimmed = String(timeStr).trim();
    if (/^\d{1,2}$/.test(trimmed)) {
      const h = parseInt(trimmed, 10);
      return `${String(h).padStart(2, '0')}:00`;
    }
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
      const [h, m] = trimmed.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    return defaultVal;
  };

  const toMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const [operatingHours, setOperatingHours] = useState<{
    openingHour: string;
    closingHour: string;
    maxDurationMinutes: number;
  }>({
    openingHour: '07:00',
    closingHour: '22:00',
    maxDurationMinutes: 180
  });

  const bookingMode = space?.bookingMode || space?.spaceType?.bookingMode || (
    space?.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space?.spaceTypeName?.toLowerCase().includes('ghế') || space?.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );

  const isPerSeat = bookingMode === 'PER_SEAT'; // Khu tự học chung (Mở) -> Chọn theo ghế
  const isPerTable = bookingMode === 'PER_TABLE'; // Phòng thảo luận theo bàn -> Chọn theo bàn
  // LOGIC LIÊN KẾT CSDL: Lấy trực tiếp từ space.requiresApproval (cột space_types.requires_approval của Kim Tuyến)
  const requiresApproval = space?.requiresApproval ?? (space?.spaceType?.requiresApproval ?? !isPerSeat);

  // Quản lý danh sách hình ảnh (lấy từ bảng space_images) & Slider/Carousel
  const [spaceImages, setSpaceImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Modal phóng to chi tiết ảnh (Phong cách Ảnh 2)
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // Quản lý các lịch bảo trì sắp tới (thời gian hiện tại -> tương lai)
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<MaintenanceSchedule[]>([]);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);

  // Lắng nghe phím tắt bàn phím khi modal đang mở (ESC để đóng, phím mũi tên để chuyển ảnh)
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setModalImageIndex((prev) => (prev - 1 + spaceImages.length) % spaceImages.length);
      } else if (e.key === 'ArrowRight') {
        setModalImageIndex((prev) => (prev + 1) % spaceImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, spaceImages.length]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    spaceService
      .getSpaceById(Number(id))
      .then(async (data) => {
        setSpace(data);

        // Nạp danh sách các đợt bảo trì sắp tới (chỉ lấy thời gian hiện tại -> tương lai)
        try {
          const mList = await spaceService.getMaintenancesBySpace(Number(id));
          const nowMs = Date.now();
          const validFuture = (mList || [])
            .filter((m) => new Date(m.endTime).getTime() >= nowMs)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          setUpcomingMaintenances(validFuture);
        } catch {
          if (data.upcomingMaintenances && data.upcomingMaintenances.length > 0) {
            const nowMs = Date.now();
            const valid = data.upcomingMaintenances
              .filter((m) => new Date(m.endTime).getTime() >= nowMs)
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            setUpcomingMaintenances(valid);
          } else if (data.nextMaintenance && new Date(data.nextMaintenance.endTime).getTime() >= Date.now()) {
            setUpcomingMaintenances([data.nextMaintenance]);
          }
        }

        // Nạp thư viện ảnh trực tiếp từ bảng space_images
        try {
          const imgs = await spaceService.getImagesBySpace(Number(id));
          if (imgs && imgs.length > 0) {
            // Sắp xếp: ảnh isPrimary = true đứng đầu tiên, sau đó theo sortOrder tăng dần
            const sorted = [...imgs].sort((a, b) => {
              if (a.isPrimary) return -1;
              if (b.isPrimary) return 1;
              return (a.sortOrder || 0) - (b.sortOrder || 0);
            });
            setSpaceImages(sorted.map((item) => item.imageUrl));
          } else if (data.images && data.images.length > 0) {
            const sorted = [...data.images].sort((a, b) => {
              if (a.isPrimary) return -1;
              if (b.isPrimary) return 1;
              return (a.sortOrder || 0) - (b.sortOrder || 0);
            });
            setSpaceImages(sorted.map((item) => item.imageUrl));
          } else {
            const fallback = data.primaryImageUrl || data.imageUrl || ROOM_IMAGES[data.id] || DEFAULT_IMAGE;
            setSpaceImages([fallback]);
          }
        } catch {
          const fallback = data.primaryImageUrl || data.imageUrl || ROOM_IMAGES[data.id] || DEFAULT_IMAGE;
          setSpaceImages([fallback]);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Không thể tải thông tin phòng học.');
      })
      .finally(() => setLoading(false));

    spaceService.getOperatingHours().then((res) => {
      if (res) {
        setOperatingHours({
          openingHour: formatTimeHHmm(res.openingHour, '07:00'),
          closingHour: formatTimeHHmm(res.closingHour, '22:00'),
          maxDurationMinutes: res.maxDurationMinutes || 180
        });
      }
    }).catch(() => {});
  }, [id]);

  const hasMultipleImages = spaceImages.length > 1;

  // Lịch bảo trì sắp tới gần với hiện tại nhất (thời gian hiện tại -> tương lai)
  const nearestMaintenance = React.useMemo(() => {
    const nowMs = Date.now();
    if (upcomingMaintenances.length > 0) {
      const valid = upcomingMaintenances.filter((m) => new Date(m.endTime).getTime() >= nowMs);
      return valid[0] || null;
    }
    if (space?.nextMaintenance && new Date(space.nextMaintenance.endTime).getTime() >= nowMs) {
      return space.nextMaintenance;
    }
    if (space?.upcomingMaintenances && space.upcomingMaintenances.length > 0) {
      const valid = space.upcomingMaintenances
        .filter((m) => new Date(m.endTime).getTime() >= nowMs)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return valid[0] || null;
    }
    return null;
  }, [upcomingMaintenances, space?.nextMaintenance, space?.upcomingMaintenances]);

  // Tự động chuyển ảnh sau mỗi 5 giây (nếu có > 1 ảnh, tạm dừng khi người dùng hover chuột vào ảnh)
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % spaceImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasMultipleImages, isHovered, spaceImages.length]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + spaceImages.length) % spaceImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % spaceImages.length);
  };

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

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    const openMinutes = toMinutes(operatingHours.openingHour);
    const closeMinutes = toMinutes(operatingHours.closingHour);

    const nowCheck = new Date();
    const todayCheck = `${nowCheck.getFullYear()}-${String(nowCheck.getMonth() + 1).padStart(2, '0')}-${String(nowCheck.getDate()).padStart(2, '0')}`;

    if (date < todayCheck) {
      setBookingError('Không thể đặt phòng vào ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
      return;
    }

    if (date === todayCheck) {
      const currentMinutes = nowCheck.getHours() * 60 + nowCheck.getMinutes();
      if (startMinutes < currentMinutes) {
        setBookingError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại. Vui lòng chọn khung giờ từ thời điểm này trở đi.');
        return;
      }
    }

    // Kiểm tra không cho đặt trùng vào khung giờ bảo trì sắp tới
    const selectedStartMs = new Date(toIsoDateTime(date, startTime)).getTime();
    const selectedEndMs = new Date(toIsoDateTime(date, endTime)).getTime();
    const maintenanceConflict = upcomingMaintenances.find((m) => {
      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();
      return Math.max(selectedStartMs, mStart) < Math.min(selectedEndMs, mEnd);
    });

    if (maintenanceConflict) {
      setBookingError(
        `Phòng có lịch bảo trì: ${formatMaintenanceTime(maintenanceConflict.startTime, maintenanceConflict.endTime)}. Vui lòng chọn khung giờ khác tránh thời gian bảo trì.`
      );
      return;
    }

    if (startMinutes >= endMinutes) {
      setBookingError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      setBookingError(`Tòa nhà chỉ mở cửa phục vụ trong khung giờ từ ${operatingHours.openingHour} đến ${operatingHours.closingHour}. Vui lòng chọn lại.`);
      return;
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes > operatingHours.maxDurationMinutes) {
      const maxHours = Math.floor(operatingHours.maxDurationMinutes / 60);
      setBookingError(`Thời lượng đặt phòng tối đa là ${maxHours} giờ (${operatingHours.maxDurationMinutes} phút). Khung giờ bạn chọn (${durationMinutes} phút) vượt quá quy định.`);
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
        navigate('/student/my-bookings');
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
      navigate('/student/my-bookings');
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
          <button className="btn-portal-retry" onClick={() => navigate('/student/spaces')}>
            Quay lại tìm không gian
          </button>
        </div>
      </div>
    );
  }

  const formatDetailMaintenanceTime = (startStr: string, endStr: string): string => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      const startHours = pad(start.getHours());
      const startMinutes = pad(start.getMinutes());
      const endHours = pad(end.getHours());
      const endMinutes = pad(end.getMinutes());
      const day = pad(start.getDate());
      const month = pad(start.getMonth() + 1);
      const year = start.getFullYear();

      const isSameDay = start.toDateString() === end.toDateString();
      if (isSameDay) {
        return `${startHours}:${startMinutes}- ${endHours}:${endMinutes} ${day}/${month}/${year}`;
      } else {
        const endDay = pad(end.getDate());
        const endMonth = pad(end.getMonth() + 1);
        const endYear = end.getFullYear();
        return `${startHours}:${startMinutes} ${day}/${month}/${year} - ${endHours}:${endMinutes} ${endDay}/${endMonth}/${endYear}`;
      }
    } catch {
      return '';
    }
  };

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
          onClick={() => navigate('/student/spaces')}
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
            <div
              className="space-hero-image-box"
              onClick={() => {
                setModalImageIndex(currentImageIndex);
                setIsImageModalOpen(true);
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              title="Nhấp để xem ảnh chi tiết"
              style={{ cursor: 'pointer' }}
            >
              <img
                src={spaceImages[currentImageIndex] || space.primaryImageUrl || space.imageUrl || ROOM_IMAGES[space.id] || DEFAULT_IMAGE}
                alt={`${space.name} - Ảnh ${currentImageIndex + 1}`}
                className="space-hero-img"
              />

              {/* Hint badge nhấp xem ảnh chi tiết khi di chuột */}
              <div className="carousel-zoom-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                Xem ảnh chi tiết
              </div>

              {/* Nút điều hướng <> chỉ hiển thị khi phòng có nhiều hơn 1 ảnh, di chuột vào sẽ nổi bật */}
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className="carousel-nav-btn carousel-btn-prev"
                    onClick={handlePrevImage}
                    title="Ảnh trước đó (<)"
                    aria-label="Previous Image"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="carousel-nav-btn carousel-btn-next"
                    onClick={handleNextImage}
                    title="Ảnh tiếp theo (>)"
                    aria-label="Next Image"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Dãy chấm chọn nhanh ảnh (Dots Indicator) */}
                  <div className="carousel-dots-indicator">
                    {spaceImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`carousel-dot ${idx === currentImageIndex ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        title={`Xem ảnh ${idx + 1}`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Badge hiển thị chỉ số ảnh */}
                  <div className="carousel-count-badge">
                    📸 {currentImageIndex + 1} / {spaceImages.length}
                  </div>
                </>
              )}

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
              <div className="space-detail-title-row">
                <h1 className="space-detail-title">{space.name}</h1>
                {nearestMaintenance && (
                  <button
                    type="button"
                    className="space-detail-maintenance-tag"
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    title="Bấm vào để xem chi tiết tất cả lịch bảo trì sắp tới của phòng này"
                  >
                    {/* Icon danh sách đặt trước chữ lịch */}
                    <svg
                      className="maintenance-list-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                    </svg>

                    <span className="maintenance-prefix">Lịch bảo trì:</span>
                    <span className="maintenance-time-text">
                      {formatDetailMaintenanceTime(nearestMaintenance.startTime, nearestMaintenance.endTime)}
                    </span>

                    {upcomingMaintenances.length > 1 && (
                      <span className="maintenance-extra-indicator">
                        +{upcomingMaintenances.length - 1} lịch khác
                      </span>
                    )}

                    {/* Hint trực quan để người dùng nhận biết ngay là bấm vào xem chi tiết */}
                    <span className="maintenance-action-hint">
                      Chi tiết
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
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
                  <span className="spec-compact-icon">
                    {/* MapPin icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <div>
                    <span className="spec-compact-label">Địa điểm</span>
                    <strong className="spec-compact-val">
                      {space.building} • {space.floor ? (space.floor.toString().toLowerCase().includes('tầng') ? space.floor : `Tầng ${space.floor}`) : 'Đang cập nhật'}
                    </strong>
                  </div>
                </div>

                {/* Khung 2: Sức chứa */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
                    {/* Users icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <div>
                    <span className="spec-compact-label">Sức chứa</span>
                    <strong className="spec-compact-val">{space.capacity} người</strong>
                  </div>
                </div>

                {/* Khung 3: Phê duyệt */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
                    {/* Shield-check icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </span>
                  <div>
                    <span className="spec-compact-label">Phê duyệt</span>
                    <strong className="spec-compact-val">
                      {requiresApproval ? 'Cần xét duyệt (Staff)' : 'Duyệt tự động'}
                    </strong>
                  </div>
                </div>

                {/* Khung 4: Mô hình */}
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
                    {isPerSeat ? (
                      /* Armchair / Seat icon */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
                        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z"/>
                        <line x1="5" y1="18" x2="5" y2="21"/>
                        <line x1="19" y1="18" x2="19" y2="21"/>
                      </svg>
                    ) : isPerTable ? (
                      /* Table icon */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="9" width="18" height="3" rx="1"/>
                        <line x1="7" y1="12" x2="7" y2="20"/>
                        <line x1="17" y1="12" x2="17" y2="20"/>
                      </svg>
                    ) : (
                      /* Building / Door icon */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    )}
                  </span>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setDate(val);
                    if (val < today) {
                      setBookingError('Không thể đặt phòng vào ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
                    } else if (val === today) {
                      const curMinutes = now.getHours() * 60 + now.getMinutes();
                      if (toMinutes(startTime) < curMinutes) {
                        setBookingError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
                      } else {
                        setBookingError(null);
                      }
                    } else {
                      setBookingError(null);
                    }
                  }}
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
                    min={
                      date === today
                        ? (toMinutes(`${now.getHours()}:${now.getMinutes()}`) > toMinutes(operatingHours.openingHour)
                            ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                            : operatingHours.openingHour)
                        : operatingHours.openingHour
                    }
                    max={operatingHours.closingHour}
                    className="form-control-input internal-time-input"
                    value={startTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartTime(val);
                      if (date === today) {
                        const curMinutes = now.getHours() * 60 + now.getMinutes();
                        if (toMinutes(val) < curMinutes) {
                          setBookingError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại.');
                        } else {
                          setBookingError(null);
                        }
                      } else {
                        setBookingError(null);
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label">Giờ kết thúc</label>
                  <input
                    type="time"
                    step="60"
                    min={operatingHours.openingHour}
                    max={operatingHours.closingHour}
                    className="form-control-input internal-time-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Gợi ý giờ hoạt động cả tòa */}
              <div style={{ marginTop: '-4px', marginBottom: '14px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#2563EB' }}>⏰</span>
                <span><strong>Giờ mở cửa toàn tòa:</strong> {operatingHours.openingHour} – {operatingHours.closingHour} (Tối đa {Math.floor(operatingHours.maxDurationMinutes / 60)} giờ/lượt đặt)</span>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Armchair size={20} strokeWidth={2.2} />
                    <span>Chọn chỗ ngồi & Đặt chỗ</span>
                  </span>
                ) : isPerTable ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <TableMeetingIcon size={20} strokeWidth={2.2} />
                    <span>Chọn bàn thảo luận & Đặt bàn</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Building2 size={20} strokeWidth={2.2} />
                    <span>Xác nhận đặt toàn bộ không gian</span>
                  </span>
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

      {/* MODAL PHÓNG TO CHI TIẾT ẢNH (THIẾT KẾ CHUẨN THEO ẢNH 2) */}
      {isImageModalOpen && (
        <div
          className="image-lightbox-backdrop"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="image-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CỘT TRÁI: KHUNG XEM ẢNH LỚN BỐ CỤC ĐẸP MẮT */}
            <div className="image-lightbox-left">
              <div className="modal-main-image-wrap">
                <img
                  src={spaceImages[modalImageIndex] || space.primaryImageUrl || space.imageUrl || DEFAULT_IMAGE}
                  alt={`${space.name} - Ảnh ${modalImageIndex + 1}`}
                  className="modal-main-img"
                />

                {/* Badge số thứ tự ảnh góc trên trái (vd: 7/7) */}
                <div className="modal-img-badge-counter">
                  {modalImageIndex + 1} / {spaceImages.length}
                </div>

                {/* Nút điều hướng ảnh trước (<) */}
                {spaceImages.length > 1 && (
                  <button
                    type="button"
                    className="modal-nav-btn modal-nav-btn-prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev - 1 + spaceImages.length) % spaceImages.length);
                    }}
                    title="Ảnh trước (<)"
                    aria-label="Previous Image"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}

                {/* Nút điều hướng ảnh tiếp theo (>) */}
                {spaceImages.length > 1 && (
                  <button
                    type="button"
                    className="modal-nav-btn modal-nav-btn-next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev + 1) % spaceImages.length);
                    }}
                    title="Ảnh tiếp theo (>)"
                    aria-label="Next Image"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}

                {/* Badge phân loại / góc nhìn ở đáy ảnh chính giữa */}
                <div className="modal-img-caption-pill">
                  Phân loại: {modalImageIndex === 0 ? 'Ảnh chính diện không gian' : `Góc nhìn chi tiết #${modalImageIndex + 1}`}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: THÔNG TIN PHÒNG & DANH SÁCH TẤT CẢ ẢNH */}
            <div className="image-lightbox-right">
              {/* Header: Tag thương hiệu/loại không gian & Nút đóng tròn X */}
              <div className="modal-header-row">
                <span className="modal-category-tag">
                  🐾 {space.spaceTypeName || space.spaceType?.name || 'KHÔNG GIAN TIÊU CHUẨN'}
                </span>
                <button
                  type="button"
                  className="modal-close-round-btn"
                  onClick={() => setIsImageModalOpen(false)}
                  title="Đóng (ESC)"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Tên phòng lớn in đậm */}
              <h2 className="modal-space-title">{space.name}</h2>

              {/* Thông số nổi bật (Sức chứa & Trạng thái duyệt) */}
              <div className="modal-space-highlight">
                <span className="modal-highlight-val">
                  👥 {space.capacity} Chỗ ngồi
                </span>
                <span className="modal-highlight-sub">
                  • {requiresApproval ? 'Cần phê duyệt' : 'Duyệt tự động'}
                </span>
              </div>

              <div className="modal-divider-dashed" />

              {/* Tiêu đề mục tất cả hình ảnh */}
              <div className="modal-gallery-heading">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Tất Cả Hình Ảnh & Phân Loại ({spaceImages.length})
              </div>

              {/* Lưới Thumbnails 3 cột */}
              <div className="modal-thumbnails-grid">
                {spaceImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`modal-thumbnail-item ${idx === modalImageIndex ? 'active' : ''}`}
                    onClick={() => setModalImageIndex(idx)}
                    title={`Xem ảnh ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="modal-thumbnail-img"
                    />
                  </button>
                ))}
              </div>

              {/* Thông tin phòng chi tiết bên dưới */}
              <div className="modal-footer-specs">
                <div className="modal-spec-line">
                  📍 <strong>Địa điểm:</strong> {space.building} • {space.floor ? (space.floor.toString().toLowerCase().includes('tầng') ? space.floor : `Tầng ${space.floor}`) : 'Đang cập nhật'}
                </div>
                <div className="modal-spec-line">
                  ⏰ <strong>Giờ mở cửa:</strong> {operatingHours.openingHour} - {operatingHours.closingHour}
                </div>
                <div className="modal-spec-line">
                  📌 <strong>Mô hình:</strong> {isPerSeat ? 'Khu vực tự học chung (chọn ghế)' : isPerTable ? 'Phòng thảo luận nhóm (chọn bàn)' : 'Thuê trọn gói toàn bộ phòng'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT TẤT CẢ LỊCH BẢO TRÌ SẮP TỚI (SANG TRỌNG & HIỆN ĐẠI) */}
      {isMaintenanceModalOpen && (
        <div
          className="maintenance-modal-backdrop"
          onClick={() => setIsMaintenanceModalOpen(false)}
        >
          <div
            className="maintenance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="maintenance-modal-header">
              <div className="maintenance-modal-title-group">
                <div className="maintenance-modal-icon-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div>
                  <h3 className="maintenance-modal-title">Lịch bảo trì phòng {space.name}</h3>
                  <p className="maintenance-modal-subtitle">
                    Kế hoạch bảo trì thiết bị & kỹ thuật sắp tới (Chỉ hiển thị thời gian thực & tương lai)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-round-btn"
                onClick={() => setIsMaintenanceModalOpen(false)}
                title="Đóng (ESC)"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="maintenance-modal-body">
              {/* Banner Lưu ý sang trọng */}
              <div className="maintenance-notice-box">
                <div className="notice-icon">ℹ️</div>
                <div className="notice-content">
                  <strong>Thông báo:</strong> Trong các khung giờ bảo trì bên dưới, không gian sẽ tạm ngưng tiếp nhận đặt chỗ mới hoặc phục vụ để bảo dưỡng hệ thống máy tính, máy chiếu, âm thanh và điều hòa.
                </div>
              </div>

              {/* Danh sách đợt bảo trì */}
              <div className="maintenance-items-list">
                {upcomingMaintenances.filter((m) => new Date(m.endTime).getTime() >= Date.now()).length === 0 ? (
                  <div className="maintenance-empty-state">
                    <span style={{ fontSize: '32px' }}>✨</span>
                    <h4>Không có lịch bảo trì sắp tới</h4>
                    <p>Hiện không gian này không có kế hoạch bảo trì nào từ thời điểm này trở đi.</p>
                  </div>
                ) : (
                  upcomingMaintenances
                    .filter((m) => new Date(m.endTime).getTime() >= Date.now())
                    .map((m, index) => {
                      const start = new Date(m.startTime);
                      const end = new Date(m.endTime);
                      const nowMs = Date.now();
                      const isOngoing = nowMs >= start.getTime() && nowMs <= end.getTime();
                      const formattedTime = formatMaintenanceTime(m.startTime, m.endTime);

                      const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                      const durationStr =
                        diffMinutes >= 60
                          ? `${Math.floor(diffMinutes / 60)} giờ ${diffMinutes % 60 > 0 ? `${diffMinutes % 60} phút` : ''}`
                          : `${diffMinutes} phút`;

                      return (
                        <div
                          key={m.id || index}
                          className={`maintenance-card-item ${isOngoing ? 'is-ongoing' : ''}`}
                        >
                          <div className="m-card-timeline-node">
                            <span className={`m-node-dot ${isOngoing ? 'dot-ongoing' : ''}`} />
                            {index < upcomingMaintenances.length - 1 && <span className="m-node-line" />}
                          </div>

                          <div className="m-card-content">
                            <div className="m-card-header">
                              <div className="m-time-display">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <strong>{formattedTime}</strong>
                              </div>
                              {isOngoing ? (
                                <span className="m-badge-ongoing">
                                  <span className="pulse-dot" /> Đang bảo trì
                                </span>
                              ) : index === 0 ? (
                                <span className="m-badge-next">
                                  Gần nhất
                                </span>
                              ) : (
                                <span className="m-badge-upcoming">
                                  Sắp diễn ra
                                </span>
                              )}
                            </div>

                            <div className="m-card-details">
                              <div className="m-detail-row">
                                <span className="m-detail-label">Nội dung bảo trì:</span>
                                <span className="m-detail-val">
                                  {m.reason || 'Bảo dưỡng định kỳ hệ thống máy chiếu, điều hòa và đường truyền.'}
                                </span>
                              </div>
                              <div className="m-detail-row">
                                <span className="m-detail-label">Thời lượng dự kiến:</span>
                                <span className="m-detail-val">{durationStr}</span>
                              </div>
                              <div className="m-detail-row">
                                <span className="m-detail-label">Trạng thái:</span>
                                <span className="m-detail-val" style={{ color: '#DC2626', fontWeight: 600 }}>
                                  Tạm dừng nhận khách trong khung giờ này
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="maintenance-modal-footer">
              <span className="footer-count-text">
                Tổng cộng <strong>{upcomingMaintenances.filter((m) => new Date(m.endTime).getTime() >= Date.now()).length}</strong> đợt bảo trì sắp diễn ra
              </span>
              <button
                type="button"
                className="btn-maintenance-close"
                onClick={() => setIsMaintenanceModalOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
