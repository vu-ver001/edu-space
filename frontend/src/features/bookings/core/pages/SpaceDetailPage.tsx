// Trang chi tiết không gian học tập, trực quan hóa ảnh, lịch bảo trì và đặt chỗ (Module M03 & M04 - Khánh Vân).
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SeatSelectionModal } from '../components/SeatSelectionModal';
import { formatMaintenanceTime, TableMeetingIcon } from '../components/RoomCard';
import { DateInputVI, formatMessageDatesVI } from '../components/DateInputVI';
import { TimeInput24H } from '../components/TimeInput24H';
import { Armchair, Building2 } from 'lucide-react';
import type { Space, SpaceSeat, SpaceTable, MaintenanceSchedule } from '../services/spaceService';
import { spaceService } from '../services/spaceService';
import { bookingService } from '../services/bookingService';
import './SpaceDetailPage.css';
import '../components/SeatSelectionModal.css';
import '../components/MaintenanceModal.css';

// Danh sách ảnh dự phòng chất lượng cao cho không gian học tập.
const ROOM_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
  3: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
  4: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
  5: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  6: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';

// Component SpaceDetailPage quản lý chi tiết phòng, thư viện ảnh và quy trình đặt chỗ.
export const SpaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Đọc các thông tin ngày giờ tìm kiếm đã chọn trước đó từ URL.
  const [searchParams] = useSearchParams();
  const presetDate = searchParams.get('date') || '';
  const presetStartTime = searchParams.get('startTime')?.substring(0, 5) || '';
  const presetEndTime = searchParams.get('endTime')?.substring(0, 5) || '';
  const hasPresetDate = Boolean(presetDate);
  const hasPresetTime = Boolean(presetStartTime || presetEndTime);
  const hasAnyPresetSchedule = hasPresetDate || hasPresetTime;

  // Quản lý trạng thái thông tin phòng, danh sách ghế, bàn và trạng thái tải dữ liệu.
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [spaceSeats, setSpaceSeats] = useState<SpaceSeat[]>([]);
  const [spaceTables, setSpaceTables] = useState<SpaceTable[]>([]);

  // Chuẩn hóa chuỗi thời gian về định dạng HH:mm.
  const normalizeTime = (t: string | null, fallback: string) => {
    if (!t) return fallback;
    const parts = t.trim().split(':');
    return `${(parts[0] || '08').padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  };

  // Ghép ngày và giờ thành chuỗi thời gian chuẩn ISO 8601.
  const toIsoDateTime = (dateStr: string, timeStr: string) => {
    const parts = (timeStr || '').trim().split(':');
    const h = (parts[0] || '08').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return `${dateStr}T${h}:${m}:${s}`;
  };

  // Lấy ngày hiện tại làm mốc giới hạn chọn ngày đặt phòng.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Tự động tính toán khung giờ mặc định khả dụng gần nhất trong ngày để tránh chọn giờ trong quá khứ.
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

  // Khởi tạo các giá trị ban đầu cho form đặt chỗ.
  const { initStart, initEnd } = getSmartInitialTimes();
  const [date, setDate] = useState<string>(searchParams.get('date') || today);
  const [startTime, setStartTime] = useState<string>(
    searchParams.get('startTime') ? searchParams.get('startTime')!.substring(0, 5) : initStart
  );
  const [endTime, setEndTime] = useState<string>(
    searchParams.get('endTime') ? searchParams.get('endTime')!.substring(0, 5) : initEnd
  );
  const [participantCount, setParticipantCount] = useState<number | string>(
    Number(searchParams.get('participantCount')) || 4
  );
  const [purpose, setPurpose] = useState<string>('');

  // Tự động đồng bộ các tham số URL khi chuyển trang hoặc quay lại.
  useEffect(() => {
    const qDate = searchParams.get('date');
    const qStart = searchParams.get('startTime');
    const qEnd = searchParams.get('endTime');
    const qCount = searchParams.get('participantCount');
    if (qDate) setDate(qDate);
    if (qStart) setStartTime(qStart.substring(0, 5));
    if (qEnd) setEndTime(qEnd.substring(0, 5));
    if (qCount) setParticipantCount(Number(qCount));
  }, [searchParams]);

  // Quản lý trạng thái hộp thoại sơ đồ chỗ ngồi, thông báo toast và tiến trình gửi form.
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Định dạng giờ hiển thị theo kiểu HH:mm.
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

  // Đổi chuỗi giờ HH:mm sang tổng số phút.
  const toMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Lưu trữ chính sách giờ mở cửa và thời lượng đặt tối đa lấy từ CSDL.
  const [operatingHours, setOperatingHours] = useState<{
    openingHour: string;
    closingHour: string;
    maxDurationMinutes: number;
  }>({
    openingHour: '07:00',
    closingHour: '22:00',
    maxDurationMinutes: 180
  });

  // Xác định chế độ đặt phòng theo ghế (PER_SEAT), theo bàn (PER_TABLE) hoặc trọn phòng.
  const bookingMode = space?.bookingMode || space?.spaceType?.bookingMode || (
    space?.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space?.spaceTypeName?.toLowerCase().includes('ghế') || space?.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );

  const isPerSeat = bookingMode === 'PER_SEAT';
  const isPerTable = bookingMode === 'PER_TABLE';
  const isWholeSpace = !isPerSeat && !isPerTable;
  const isStudyBooth = `${space?.spaceTypeName || ''} ${space?.spaceType?.name || ''}`
    .toLowerCase()
    .includes('booth');

  // Lấy quy định phê duyệt đồng bộ từ cơ sở dữ liệu.
  const requiresApproval = space?.requiresApproval ?? (space?.spaceType?.requiresApproval ?? !isPerSeat);

  // Giới hạn số người tham gia khớp với sức chứa thực tế của không gian.
  useEffect(() => {
    if (isPerSeat) {
      setParticipantCount(1);
      return;
    }

    if (isWholeSpace && !searchParams.get('participantCount')) {
      setParticipantCount(1);
      return;
    }

    if (space?.capacity) {
      setParticipantCount((current) => {
        const count = Number(current);
        if (!Number.isFinite(count) || count < 1) return current;
        return Math.min(Math.trunc(count), space.capacity);
      });
    }
  }, [isPerSeat, isWholeSpace, searchParams, space?.capacity]);

  // Quản lý thư viện ảnh đại diện của không gian học tập và trình chiếu slider.
  const [spaceImages, setSpaceImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Quản lý modal xem ảnh kích thước lớn (Lightbox).
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // Danh sách các đợt bảo trì sắp tới của phòng học lấy từ cơ sở dữ liệu.
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<MaintenanceSchedule[]>([]);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);

  // Lắng nghe phím ESC và phím mũi tên để chuyển ảnh hoặc đóng lightbox.
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

  // Nạp dữ liệu chi tiết của phòng học, lịch bảo trì và danh mục bàn ghế từ máy chủ backend.
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    spaceService
      .getSpaceById(Number(id))
      .then(async (data) => {
        setSpace(data);

        // Nạp danh sách các đợt bảo trì trong tương lai.
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

        // Tải toàn bộ danh sách ảnh từ bảng space_images.
        try {
          const imgs = await spaceService.getImagesBySpace(Number(id));
          if (imgs && imgs.length > 0) {
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
        setError(formatMessageDatesVI(err?.response?.data?.message) || 'Không thể tải thông tin phòng học.');
      })
      .finally(() => setLoading(false));

    // Lấy thông tin giờ vận hành và sơ đồ ghế ngồi/bàn học.
    spaceService.getOperatingHours().then((res) => {
      if (res) {
        setOperatingHours({
          openingHour: formatTimeHHmm(res.openingHour, '07:00'),
          closingHour: formatTimeHHmm(res.closingHour, '22:00'),
          maxDurationMinutes: res.maxDurationMinutes || 180
        });
      }
    }).catch(() => {});
    spaceService.getSeatsBySpace(Number(id)).then((res) => setSpaceSeats(res || [])).catch(() => setSpaceSeats([]));
    spaceService.getTablesBySpace(Number(id)).then((res) => setSpaceTables(res || [])).catch(() => setSpaceTables([]));
  }, [id]);

  const hasMultipleImages = spaceImages.length > 1;

  // Tìm đợt bảo trì sắp diễn ra gần nhất với thời điểm hiện tại.
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

  // Tự động chuyển đổi ảnh sau mỗi 5 giây trừ khi người dùng di chuột lên ảnh.
  useEffect(() => {
    if (!hasMultipleImages || isHovered) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % spaceImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasMultipleImages, isHovered, spaceImages.length]);

  // Chuyển sang ảnh trước đó trong carousel.
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + spaceImages.length) % spaceImages.length);
  };

  // Chuyển sang ảnh tiếp theo trong carousel.
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % spaceImages.length);
  };

  // Xác thực biểu mẫu và gửi yêu cầu đặt trọn phòng lên máy chủ backend.
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    // Kiểm tra trạng thái hoạt động của phòng học.
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

    // Kiểm tra không được chọn ngày trong quá khứ.
    if (date < todayCheck) {
      setBookingError('Không thể đặt phòng vào ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai.');
      return;
    }

    // Kiểm tra giờ bắt đầu không được nhỏ hơn giờ hiện tại đối với ngày hôm nay.
    if (date === todayCheck) {
      const currentMinutes = nowCheck.getHours() * 60 + nowCheck.getMinutes();
      if (startMinutes < currentMinutes) {
        setBookingError('Thời gian bắt đầu phải bằng hoặc lớn hơn thời điểm hiện tại. Vui lòng chọn khung giờ từ thời điểm này trở đi.');
        return;
      }
    }

    // Kiểm tra xung đột với lịch bảo trì sắp tới của phòng.
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

    // Kiểm tra thời gian nằm trong khung giờ mở cửa của tòa nhà.
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      setBookingError(`Tòa nhà chỉ mở cửa phục vụ trong khung giờ từ ${operatingHours.openingHour} đến ${operatingHours.closingHour}. Vui lòng chọn lại.`);
      return;
    }

    // Kiểm tra thời lượng phiên đặt không vượt quá số phút tối đa cho phép.
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes > operatingHours.maxDurationMinutes) {
      const maxHours = Math.floor(operatingHours.maxDurationMinutes / 60);
      setBookingError(`Thời lượng đặt phòng tối đa là ${maxHours} giờ (${operatingHours.maxDurationMinutes} phút). Khung giờ bạn chọn (${durationMinutes} phút) vượt quá quy định.`);
      return;
    }

    // Bắt buộc nhập mục đích sử dụng nếu phòng yêu cầu Staff phê duyệt.
    if (requiresApproval && (!purpose || !purpose.trim())) {
      setBookingError('Vui lòng nhập mục đích sử dụng (bắt buộc đối với không gian cần nhân viên duyệt).');
      return;
    }

    // Kiểm tra số lượng người tham gia không vượt quá sức chứa.
    if (space?.capacity && Number(participantCount) > space.capacity) {
      setBookingError(`Số người tham gia (${participantCount}) vượt quá sức chứa tối đa (${space.capacity} người) của không gian này.`);
      return;
    }

    if (!space) return;
    setSubmitting(true);
    // Gửi yêu cầu đặt phòng trọn gói qua API bookingService.
    try {
      const startDateTime = toIsoDateTime(date, startTime);
      const endDateTime = toIsoDateTime(date, endTime);
      await bookingService.createBooking({
        spaceId: space.id,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount: Number(participantCount),
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
      setBookingError(
        formatMessageDatesVI(err?.response?.data?.message || err?.message) || 'Không thể hoàn tất đặt phòng.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý thông báo thành công sau khi hoàn tất chọn vị trí từ modal sơ đồ.
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

  // Hiển thị giao diện nạp dữ liệu.
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

  // Hiển thị thông báo khi xảy ra lỗi tải dữ liệu.
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

  // Định dạng chi tiết thời gian lịch bảo trì.
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
        return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}, ${day}/${month}/${year}`;
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
    // Khung chứa toàn bộ trang chi tiết không gian học tập
    <div className="space-detail-page">
      {/* Thông báo toast thông báo tác vụ nổi */}
      {toastMessage && (
        <div className="portal-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thanh điều hướng quay lại danh sách tìm kiếm */}
      <div className="back-navigation-bar">
        <button
          type="button"
          className="btn-back-link"
          onClick={() => {
            const preservedFilter = searchParams.toString();
            navigate(`/student/spaces${preservedFilter ? `?${preservedFilter}` : ''}`);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Quay lại tìm không gian
        </button>
      </div>

      {/* Bố cục 2 cột: Cột trái thông tin phòng, Cột phải biểu mẫu đặt chỗ */}
      <div className="space-detail-layout">
        {/* Cột trái: Thẻ hình ảnh đại diện, thông số kỹ thuật và danh sách tiện ích */}
        <div className="space-detail-left">
          <div className="space-hero-card">
            {/* Vùng hiển thị ảnh đại diện và thanh điều khiển carousel */}
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

              {/* Nhãn gợi ý bấm để phóng to ảnh */}
              <div className="carousel-zoom-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                Xem ảnh chi tiết
              </div>

              {/* Các nút bấm chuyển ảnh qua lại và dấu chấm chỉ báo */}
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

                  <div className="carousel-count-badge">
                    📸 {currentImageIndex + 1} / {spaceImages.length}
                  </div>
                </>
              )}

              {/* Huy hiệu trạng thái khả dụng của phòng */}
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

            {/* Thông tin mô tả chi tiết và các thông số phòng học */}
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

              {/* Lưới tóm tắt 4 thông số cốt lõi: Địa điểm, Sức chứa, Phê duyệt, Mô hình */}
              <div className="specs-compact-grid">
                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
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

                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <div>
                    <span className="spec-compact-label">Sức chứa</span>
                    <strong className="spec-compact-val">
                      {isPerSeat
                        ? (spaceSeats.length > 0 ? `${spaceSeats.length} ghế` : (space.activeSeatCount ? `${space.activeSeatCount} ghế` : `${space.capacity} ghế`))
                        : isPerTable
                        ? (spaceTables.length > 0
                            ? `${spaceTables.length} bàn (${spaceTables.reduce((s, t) => s + (t.capacity || 0), 0)} chỗ)`
                            : (space.activeTableCount ? `${space.activeTableCount} bàn (${space.capacity} chỗ)` : `${space.capacity} người`))
                        : `${space.capacity} người`}
                    </strong>
                  </div>
                </div>

                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
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

                <div className="spec-compact-item">
                  <span className="spec-compact-icon">
                    {isPerSeat ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
                        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z"/>
                        <line x1="5" y1="18" x2="5" y2="21"/>
                        <line x1="19" y1="18" x2="19" y2="21"/>
                      </svg>
                    ) : isPerTable ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="9" width="18" height="3" rx="1"/>
                        <line x1="7" y1="12" x2="7" y2="20"/>
                        <line x1="17" y1="12" x2="17" y2="20"/>
                      </svg>
                    ) : (
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

              {/* Danh sách các tiện ích có sẵn trong phòng */}
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

        {/* Cột phải: Khung biểu mẫu điền thông tin đặt phòng hoặc chọn vị trí trên sơ đồ */}
        <div className="space-detail-right">
          {isWholeSpace ? (
          <div className="booking-form-sticky-card">
            <div className="card-form-header">
              <h3 className="form-card-title">Đặt chỗ không gian này</h3>
              <p className="form-card-subtitle">
                {isPerSeat ? 'Xác nhận khung giờ và chọn vị trí ghế ngồi cá nhân' : isPerTable ? 'Xác nhận khung giờ và chọn bàn thảo luận nhóm' : 'Xác nhận khung giờ và đặt trọn gói nguyên phòng'}
              </p>
            </div>

            {/* Cảnh báo khi phòng đang bảo trì hoặc tạm ngưng */}
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

            {/* Form điền thông tin ngày giờ, số lượng người và mục đích sử dụng */}
            <form onSubmit={handleFormSubmit} className="detail-booking-form">
              <div className="form-field-group">
                <label className="form-label">Ngày sử dụng</label>
                <DateInputVI
                  className="form-control-input internal-date-input"
                  value={date}
                  min={today}
                  onChange={(val) => {
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

              {/* Dòng chọn giờ bắt đầu và giờ kết thúc */}
              <div className="form-time-row">
                <div className="form-field-group">
                  <label className="form-label">Giờ bắt đầu</label>
                  <TimeInput24H
                    min={
                      date === today
                        ? (toMinutes(`${now.getHours()}:${now.getMinutes()}`) > toMinutes(operatingHours.openingHour)
                            ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                            : operatingHours.openingHour)
                        : operatingHours.openingHour
                    }
                    max={operatingHours.closingHour}
                    value={startTime}
                    onChange={(val: string) => {
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
                  <TimeInput24H
                    min={operatingHours.openingHour}
                    max={operatingHours.closingHour}
                    value={endTime}
                    onChange={(val: string) => setEndTime(val)}
                    required
                  />
                </div>
              </div>

              {/* Nhãn gợi ý giờ mở cửa toàn tòa */}
              <div className="building-hours-hint">
                <span className="building-hours-icon">⏰</span>
                <span><strong>Giờ mở cửa toàn tòa:</strong> {operatingHours.openingHour} – {operatingHours.closingHour} (Tối đa {Math.floor(operatingHours.maxDurationMinutes / 60)} giờ/lượt đặt)</span>
              </div>

              {/* Trường nhập số lượng người tham gia */}
              <div className="form-field-group participant-count-field">
                <label className="form-label">Số người tham gia</label>
                <input
                  type="number"
                  className="form-control-input"
                  value={isPerSeat ? 1 : participantCount}
                  min={1}
                  max={isPerSeat ? 1 : space.capacity}
                  disabled={isPerSeat}
                  readOnly={isPerSeat}
                  style={isPerSeat ? { backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' } : {}}
                  onChange={(e) => {
                    if (isPerSeat) return;
                    const val = e.target.value;
                    if (val === '') {
                      setParticipantCount('');
                      return;
                    }

                    const parsedCount = Number.parseInt(val, 10);
                    if (!Number.isFinite(parsedCount)) return;

                    setParticipantCount(Math.min(Math.max(parsedCount, 1), space.capacity));
                    setBookingError(null);
                  }}
                  onBlur={() => {
                    if (isPerSeat) {
                      setParticipantCount(1);
                      return;
                    }
                    if (!participantCount || Number(participantCount) < 1) {
                      setParticipantCount(1);
                    } else if (Number(participantCount) > space.capacity) {
                      setParticipantCount(space.capacity);
                    }
                  }}
                  required
                />
                {isPerSeat ? (
                  <span className="participant-capacity-hint">
                    Khu tự học cá nhân: Cố định <strong>1 sinh viên / 1 chỗ ngồi</strong>
                  </span>
                ) : isStudyBooth ? (
                  <span className="participant-capacity-hint">
                    Study Booth: Từ <strong>1 người</strong> đến tối đa <strong>{space.capacity} người</strong>; một lượt đặt giữ trọn booth
                  </span>
                ) : isPerTable ? (
                  <span className="participant-capacity-hint">
                    Bàn thảo luận: Từ <strong>1 người</strong> đến tối đa <strong>{space.capacity} người</strong>; chọn bàn đủ chỗ
                  </span>
                ) : (
                  <span className="participant-capacity-hint">
                    Đặt trọn không gian: Từ <strong>1 người</strong> đến tối đa <strong>{space.capacity} người</strong>
                  </span>
                )}
              </div>

              {/* Trường nhập mục đích sử dụng */}
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

              {/* Nút gửi yêu cầu đặt chỗ */}
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
                  <>💡 Bấm <strong>Chọn chỗ ngồi & Đặt chỗ</strong> để mở sơ đồ chọn ghế cá nhân ({spaceSeats.length > 0 ? `${spaceSeats.length} ghế` : 'trực quan'}). Chế độ đặt theo chỗ ngồi được duyệt tự động ngay lập tức, không bắt buộc điền mục đích sử dụng.</>
                ) : isPerTable ? (
                  <>💡 Một sinh viên có thể đặt bàn cho từ 1 người đến sức chứa của bàn đã chọn. Bắt buộc điền mục đích sử dụng và chờ Staff xét duyệt.</>
                ) : isStudyBooth ? (
                  <>💡 Một sinh viên đại diện đặt <strong>toàn bộ Study Booth</strong> cho nhóm từ 1 đến {space?.capacity} người. Bắt buộc điền mục đích sử dụng và chờ Staff xét duyệt.</>
                ) : (
                  <>💡 Một sinh viên đại diện đặt <strong>toàn bộ {space?.name}</strong> cho từ 1 đến {space?.capacity} người. Bắt buộc điền mục đích sử dụng và chờ Staff xét duyệt.</>
                )}
              </p>
            </form>
          </div>
          ) : (
            // Giao diện thẻ hướng dẫn chọn vị trí sơ đồ cho chế độ đặt theo ghế hoặc theo bàn
            <div className="position-booking-card">
              <div className="position-card-glow" />
              <div className="position-card-badge">
                {isPerTable ? <TableMeetingIcon size={16} /> : <Armchair size={16} />}
                {isPerTable ? 'Đặt theo bàn' : 'Đặt theo ghế'}
              </div>

              <div className="position-card-icon">
                {isPerTable ? <TableMeetingIcon size={34} strokeWidth={1.9} /> : <Armchair size={34} strokeWidth={1.9} />}
              </div>
              <h2>Chọn vị trí yêu thích</h2>
              <p>
                {isPerTable
                  ? 'Xem sơ đồ bàn trực quan, chọn bàn phù hợp với nhóm rồi nhập thông tin đặt chỗ.'
                  : 'Xem sơ đồ chỗ ngồi, chọn đúng vị trí bạn muốn rồi hoàn tất thông tin đặt chỗ.'}
              </p>

              {/* Thanh hiển thị tiến trình 3 bước đặt chỗ trực quan */}
              <div className="position-flow-preview">
                <div className="position-flow-item active">
                  <span>1</span>
                  <div><strong>Chọn {isPerTable ? 'bàn' : 'ghế'}</strong><small>Trên sơ đồ không gian</small></div>
                </div>
                <div className="position-flow-connector" />
                <div className="position-flow-item">
                  <span>2</span>
                  <div><strong>Nhập thông tin</strong><small>Ngày, giờ và số người</small></div>
                </div>
                <div className="position-flow-connector" />
                <div className="position-flow-item">
                  <span>3</span>
                  <div><strong>Xác nhận</strong><small>Gửi yêu cầu đặt chỗ</small></div>
                </div>
              </div>

              {hasAnyPresetSchedule ? (
                <div className="position-card-meta">
                  <span>
                    Ngày dự kiến
                    <strong>{hasPresetDate ? presetDate.split('-').reverse().join('/') : 'Chưa chọn'}</strong>
                  </span>
                  <span>
                    Khung giờ
                    <strong>
                      {hasPresetTime
                        ? `${presetStartTime || 'Chưa chọn'} – ${presetEndTime || 'Chưa chọn'}`
                        : 'Chưa chọn'}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="position-card-schedule-prompt">
                  <span className="position-schedule-icon">○</span>
                  <div>
                    <strong>Chưa chọn ngày và khung giờ</strong>
                    <p>Bạn sẽ nhập thời gian sử dụng ở bước tiếp theo sau khi chọn vị trí.</p>
                  </div>
                </div>
              )}

              {/* Nút bấm mở sơ đồ chọn chỗ ngồi hoặc bàn học */}
              <button
                type="button"
                className="position-card-cta"
                disabled={space?.status != null && space.status !== 'AVAILABLE'}
                onClick={() => {
                  setBookingError(null);
                  setIsSeatModalOpen(true);
                }}
              >
                {isPerTable ? <TableMeetingIcon size={20} /> : <Armchair size={20} />}
                {space?.status === 'MAINTENANCE'
                  ? 'Không gian đang bảo trì'
                  : space?.status === 'INACTIVE'
                    ? 'Không gian tạm ngưng'
                    : `Chọn ${isPerTable ? 'bàn' : 'ghế'} để đặt chỗ`}
              </button>

              <div className="position-card-note">
                <span>✓</span>
                <p>
                  {isPerTable
                    ? 'Số người được kiểm tra theo sức chứa thực tế của bàn bạn chọn.'
                    : 'Mỗi sinh viên chọn một ghế cá nhân cho mỗi lượt đặt.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal sơ đồ tương tác chọn Ghế ngồi hoặc Bàn học */}
      {(isPerSeat || isPerTable) && isSeatModalOpen && (
          <SeatSelectionModal
            space={space}
            date={presetDate}
            startTime={presetStartTime}
            endTime={presetEndTime}
          participantCount={isPerSeat ? 1 : (Number(participantCount) || 1)}
          purpose={purpose}
          mode={isPerTable ? 'TABLE' : 'SEAT'}
          openingHour={operatingHours.openingHour}
          closingHour={operatingHours.closingHour}
          maxDurationMinutes={operatingHours.maxDurationMinutes}
          onClose={() => setIsSeatModalOpen(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Modal Lightbox xem thư viện ảnh kích thước lớn */}
      {isImageModalOpen && (
        <div
          className="image-lightbox-backdrop"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="image-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cột trái: Khung hiển thị ảnh lớn và nút chuyển ảnh */}
            <div className="image-lightbox-left">
              <div className="modal-main-image-wrap">
                <img
                  src={spaceImages[modalImageIndex] || space.primaryImageUrl || space.imageUrl || DEFAULT_IMAGE}
                  alt={`${space.name} - Ảnh ${modalImageIndex + 1}`}
                  className="modal-main-img"
                />

                <div className="modal-img-badge-counter">
                  {modalImageIndex + 1} / {spaceImages.length}
                </div>

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

                <div className="modal-img-caption-pill">
                  Phân loại: {modalImageIndex === 0 ? 'Ảnh chính diện không gian' : `Góc nhìn chi tiết #${modalImageIndex + 1}`}
                </div>
              </div>
            </div>

            {/* Cột phải: Thông số chi tiết phòng và lưới ảnh thu nhỏ thumbnails */}
            <div className="image-lightbox-right">
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

              <h2 className="modal-space-title">{space.name}</h2>

              <div className="modal-space-highlight">
                <span className="modal-highlight-val">
                  👥 {space.capacity} Chỗ ngồi
                </span>
                <span className="modal-highlight-sub">
                  • {requiresApproval ? 'Cần phê duyệt' : 'Duyệt tự động'}
                </span>
              </div>

              <div className="modal-divider-dashed" />

              <div className="modal-gallery-heading">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Tất Cả Hình Ảnh & Phân Loại ({spaceImages.length})
              </div>

              {/* Lưới các ảnh thu nhỏ thumbnails */}
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

              {/* Thông tin vị trí và giờ hoạt động ở chân modal */}
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

      {/* Modal hiển thị toàn bộ danh sách các đợt bảo trì sắp tới của phòng */}
      {isMaintenanceModalOpen && (
        <div
          className="maintenance-modal-backdrop"
          onClick={() => setIsMaintenanceModalOpen(false)}
        >
          <div
            className="maintenance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="maintenance-modal-body">
              <div className="maintenance-notice-box">
                <div className="notice-icon">ℹ️</div>
                <div className="notice-content">
                  <strong>Thông báo:</strong> Trong các khung giờ bảo trì bên dưới, không gian sẽ tạm ngưng tiếp nhận đặt chỗ mới hoặc phục vụ để bảo dưỡng hệ thống máy tính, máy chiếu, âm thanh và điều hòa.
                </div>
              </div>

              {/* Danh sách các mốc thời gian bảo trì */}
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
