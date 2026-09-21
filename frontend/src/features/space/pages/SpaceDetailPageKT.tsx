import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  DoorOpen,
  Armchair,
  Info,
  BarChart3,
  Building2,
  CheckCircle2,
  Wrench,
  AlertOctagon,
  ChevronRight,
  Sparkles,
  MapPin,
  Layers,
  X,
  ChevronLeft,
  Wifi,
  Tv,
  SquareCheck,
  ClipboardList,
  ShieldCheck,
  Clock,
  Snowflake,
  Plug,
  SquarePen,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import type { Space, SpaceSeat, SpaceTable, Facility, SpaceUpdateRequest, SpaceImage } from '../types/space';
import type { SpaceType } from '../types/spaceType';
import type { MaintenanceBlock } from '../../staff/types/staff';
import { spaceApi } from '../api/spaceApi';
import { spaceTypeApi } from '../api/spaceTypeApi';
import { spaceImageApi } from '../api/spaceImageApi';
import { maintenanceApi } from '../../staff/api/maintenanceApi';
import { SpaceFormModalKT } from '../components/SpaceFormModalKT';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { bookingService } from '../../../services/bookingService';
import { formatImageUrl } from '../../../utils/imageUrl';
import { staffApi } from '../../staff/api/staffApi';
import './SpaceDetailPageKT.css';

const PLACEHOLDER_SPACE_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80';

export const SpaceDetailPageKT: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-items for PER_SEAT and PER_TABLE
  const [seats, setSeats] = useState<SpaceSeat[]>([]);
  const [tables, setTables] = useState<SpaceTable[]>([]);

  // Metadata for edit modal
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Facilities expand/collapse state (trên 3 tiện ích là ấn xem thêm)
  const [showAllFacilities, setShowAllFacilities] = useState<boolean>(false);
  const FACILITY_SHOW_LIMIT = 3;

  // Table expand/collapse state (Tối đa 2 hàng ngang bàn, trên 2 hàng là phải ấn xem thêm)
  const [showAllTables, setShowAllTables] = useState<boolean>(false);
  const TABLE_SHOW_LIMIT = 2;

  // Seat expand/collapse state
  const [showAllSeats, setShowAllSeats] = useState<boolean>(false);
  const SEAT_SHOW_LIMIT = 12;

  // Active gallery image & lightbox
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // Space Images (dữ liệu trực tiếp từ bảng space_images)
  const [spaceImages, setSpaceImages] = useState<SpaceImage[]>([]);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirm Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Maintenance Schedule State (trên 3 lịch bảo trì là ấn xem thêm)
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceBlock[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState<boolean>(false);
  const [showAllMaintenance, setShowAllMaintenance] = useState<boolean>(false);
  const MAINT_SHOW_LIMIT = 3;

  // Toast notification
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Table Modal State (Thêm / Sửa bàn)
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [tableModalMode, setTableModalMode] = useState<'create' | 'edit'>('create');
  const [editingTable, setEditingTable] = useState<SpaceTable | null>(null);
  const [tableCodeInput, setTableCodeInput] = useState<string>('');
  const [tableCapacityInput, setTableCapacityInput] = useState<number>(4);
  const [tableStatusInput, setTableStatusInput] = useState<'AVAILABLE' | 'INACTIVE'>('AVAILABLE');
  const [tableDescInput, setTableDescInput] = useState<string>('');
  const [isTableSubmitting, setIsTableSubmitting] = useState<boolean>(false);

  // Table Delete State (Xóa bàn)
  const [deletingTable, setDeletingTable] = useState<SpaceTable | null>(null);
  const [isTableDeleting, setIsTableDeleting] = useState<boolean>(false);

  // Seat Modal State (Thêm 1 ghế hoặc nhiều ghế / Sửa ghế)
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [seatModalMode, setSeatModalMode] = useState<'create' | 'edit'>('create');
  const [seatCreateTab, setSeatCreateTab] = useState<'single' | 'bulk'>('single');
  const [editingSeat, setEditingSeat] = useState<SpaceSeat | null>(null);

  // Occupied / Booked seats & tables in this space (từ bookings thực tế)
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  const [occupiedTableIds, setOccupiedTableIds] = useState<Set<number>>(new Set());

  // Single seat state
  const [seatCodeInput, setSeatCodeInput] = useState<string>('');
  const [seatStatusInput, setSeatStatusInput] = useState<'AVAILABLE' | 'INACTIVE'>('AVAILABLE');
  const [seatDescInput, setSeatDescInput] = useState<string>('');
  const [isSeatSubmitting, setIsSeatSubmitting] = useState<boolean>(false);

  // Bulk seat state
  const [bulkMode, setBulkMode] = useState<'pattern' | 'custom'>('pattern');
  const [bulkPrefix, setBulkPrefix] = useState<string>('S');
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkStartNum, setBulkStartNum] = useState<number>(1);
  const [bulkCustomInput, setBulkCustomInput] = useState<string>('');

  // Seat Delete State (Xóa ghế)
  const [deletingSeat, setDeletingSeat] = useState<SpaceSeat | null>(null);
  const [isSeatDeleting, setIsSeatDeleting] = useState<boolean>(false);

  // Handlers for Table
  const handleOpenCreateTable = () => {
    setTableModalMode('create');
    setEditingTable(null);
    setTableCodeInput('');
    setTableCapacityInput(4);
    setTableStatusInput('AVAILABLE');
    setTableDescInput('');
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (tbl: SpaceTable) => {
    setTableModalMode('edit');
    setEditingTable(tbl);
    setTableCodeInput(tbl.tableCode);
    setTableCapacityInput(tbl.capacity);
    setTableStatusInput(tbl.status);
    setTableDescInput(tbl.description || '');
    setIsTableModalOpen(true);
  };

  const handleSubmitTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    setIsTableSubmitting(true);
    try {
      if (tableModalMode === 'create') {
        await spaceApi.createTable(space.id, {
          tableCode: tableCodeInput.trim(),
          capacity: tableCapacityInput || 0,
          status: tableStatusInput,
          description: tableDescInput.trim() || undefined,
        });
        showToast(`Đã thêm bàn ${tableCodeInput.trim()} thành công`);
      } else if (editingTable) {
        await spaceApi.updateTable(editingTable.id, {
          tableCode: tableCodeInput.trim(),
          capacity: tableCapacityInput || 0,
          status: tableStatusInput,
          description: tableDescInput.trim() || undefined,
        });
        showToast(`Đã cập nhật bàn ${tableCodeInput.trim()} thành công`);
      }
      setIsTableModalOpen(false);
      const [updatedTables, updatedSpace] = await Promise.all([
        spaceApi.getTablesBySpace(space.id),
        spaceApi.getSpaceById(space.id),
      ]);
      setTables(updatedTables || []);
      setSpace(updatedSpace);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin bàn. Vui lòng kiểm tra lại.';
      showToast(msg, 'error');
    } finally {
      setIsTableSubmitting(false);
    }
  };

  const handleConfirmDeleteTable = async () => {
    if (!deletingTable || !space) return;
    if (isTableBooked(deletingTable)) {
      showToast(`Không thể xóa bàn '${deletingTable.tableCode}' vì đang có người đặt bàn này trong hệ thống!`, 'error');
      setDeletingTable(null);
      return;
    }
    setIsTableDeleting(true);
    try {
      await spaceApi.deleteTable(deletingTable.id);
      showToast(`Đã xóa bàn ${deletingTable.tableCode}`);
      setDeletingTable(null);
      const [updatedTables, updatedSpace] = await Promise.all([
        spaceApi.getTablesBySpace(space.id),
        spaceApi.getSpaceById(space.id),
      ]);
      setTables(updatedTables || []);
      setSpace(updatedSpace);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xóa bàn. Vui lòng thử lại.';
      showToast(msg, 'error');
    } finally {
      setIsTableDeleting(false);
    }
  };

  // Handlers for Seat
  const handleOpenCreateSeat = () => {
    setSeatModalMode('create');
    setSeatCreateTab('single');
    setEditingSeat(null);
    setSeatCodeInput('');
    setSeatStatusInput('AVAILABLE');
    setSeatDescInput('');

    // Bulk config defaults
    setBulkMode('pattern');
    setBulkPrefix('S');
    const remaining = Math.max(1, (space?.capacity || 20) - (seats.length || 0));
    setBulkCount(Math.min(5, remaining));
    setBulkStartNum((seats.length || 0) + 1);
    setBulkCustomInput('');
    setIsSeatModalOpen(true);
  };

  const handleOpenEditSeat = (seat: SpaceSeat) => {
    setSeatModalMode('edit');
    setEditingSeat(seat);
    setSeatCodeInput(seat.seatCode);
    setSeatStatusInput(seat.status);
    setSeatDescInput(seat.description || '');
    setIsSeatModalOpen(true);
  };

  // Tập hợp các mã ghế hiện có trong không gian (in hoa để so sánh)
  const existingSeatCodesUpper = useMemo(() => {
    return new Set(seats.map((s) => s.seatCode.trim().toUpperCase()));
  }, [seats]);

  // Kiểm tra ghế đã có người đặt trong CSDL (từ bảng bookings)
  const isSeatBooked = (seat: SpaceSeat) => {
    const code = (seat.seatCode || '').trim().toUpperCase();
    return occupiedSeats.has(code);
  };

  // Kiểm tra bàn đã có người đặt trong CSDL (từ bảng bookings)
  const isTableBooked = (table: SpaceTable) => {
    return occupiedTableIds.has(table.id);
  };

  // Danh sách các mã ghế được tạo hàng loạt
  const bulkGeneratedCodes = useMemo(() => {
    if (bulkMode === 'pattern') {
      const prefix = bulkPrefix.trim() || 'S';
      const count = Math.min(Math.max(1, bulkCount || 1), 100);
      const start = Math.max(1, bulkStartNum || 1);
      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        const num = start + i;
        const padLen = num < 100 ? 2 : 3;
        list.push(`${prefix}${String(num).padStart(padLen, '0')}`);
      }
      return list;
    } else {
      return bulkCustomInput
        .split(/[\n,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }, [bulkMode, bulkPrefix, bulkCount, bulkStartNum, bulkCustomInput]);

  // Thông tin kiểm tra tính hợp lệ khi tạo hàng loạt
  const bulkValidation = useMemo(() => {
    const total = bulkGeneratedCodes.length;
    const existingConflicts = bulkGeneratedCodes.filter((c) =>
      existingSeatCodesUpper.has(c.toUpperCase())
    );
    const seen = new Set<string>();
    const selfDuplicates: string[] = [];
    for (const c of bulkGeneratedCodes) {
      const upper = c.toUpperCase();
      if (seen.has(upper)) {
        selfDuplicates.push(c);
      } else {
        seen.add(upper);
      }
    }
    const currentSeats = seats.length;
    const capacity = space?.capacity || 0;
    const remainingCapacity = Math.max(0, capacity - currentSeats);
    const exceedsCapacity = total > remainingCapacity;

    const isValid =
      total > 0 &&
      existingConflicts.length === 0 &&
      selfDuplicates.length === 0 &&
      !exceedsCapacity;

    return {
      total,
      existingConflicts,
      selfDuplicates,
      remainingCapacity,
      exceedsCapacity,
      isValid,
    };
  }, [bulkGeneratedCodes, existingSeatCodesUpper, seats.length, space?.capacity]);

  const handleSubmitSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    // Chế độ tạo nhiều ghế hàng loạt (Bulk Create)
    if (seatModalMode === 'create' && seatCreateTab === 'bulk') {
      if (bulkGeneratedCodes.length === 0) {
        showToast('Vui lòng nhập hoặc tạo ít nhất 1 mã chỗ ngồi', 'error');
        return;
      }
      if (!bulkValidation.isValid) {
        if (bulkValidation.exceedsCapacity) {
          showToast(
            `Số lượng ghế (${bulkValidation.total}) vượt quá sức chứa còn lại của phòng (${bulkValidation.remainingCapacity})`,
            'error'
          );
        } else if (bulkValidation.existingConflicts.length > 0) {
          showToast(
            `Các mã ghế sau đã tồn tại: ${bulkValidation.existingConflicts.join(', ')}`,
            'error'
          );
        } else if (bulkValidation.selfDuplicates.length > 0) {
          showToast(
            `Danh sách tạo có mã bị trùng lặp: ${bulkValidation.selfDuplicates.join(', ')}`,
            'error'
          );
        }
        return;
      }

      setIsSeatSubmitting(true);
      try {
        const createdSeats = await spaceApi.bulkCreateSeats(space.id, bulkGeneratedCodes);
        showToast(`Đã thêm thành công ${createdSeats.length} chỗ ngồi vào phòng!`);
        setIsSeatModalOpen(false);
        const [updatedSeats, updatedSpace] = await Promise.all([
          spaceApi.getSeatsBySpace(space.id),
          spaceApi.getSpaceById(space.id),
        ]);
        setSeats(updatedSeats || []);
        setSpace(updatedSpace);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          'Không thể tạo hàng loạt chỗ ngồi. Vui lòng kiểm tra lại.';
        showToast(msg, 'error');
      } finally {
        setIsSeatSubmitting(false);
      }
      return;
    }

    // Chế độ tạo 1 ghế hoặc sửa 1 ghế
    setIsSeatSubmitting(true);
    try {
      if (seatModalMode === 'create') {
        await spaceApi.createSeat(space.id, {
          seatCode: seatCodeInput.trim(),
          status: seatStatusInput,
          description: seatDescInput.trim() || undefined,
        });
        showToast(`Đã thêm chỗ ${seatCodeInput.trim()} thành công`);
      } else if (editingSeat) {
        await spaceApi.updateSeat(editingSeat.id, {
          seatCode: seatCodeInput.trim(),
          status: seatStatusInput,
          description: seatDescInput.trim() || undefined,
        });
        showToast(`Đã cập nhật chỗ ${seatCodeInput.trim()} thành công`);
      }
      setIsSeatModalOpen(false);
      const [updatedSeats, updatedSpace] = await Promise.all([
        spaceApi.getSeatsBySpace(space.id),
        spaceApi.getSpaceById(space.id),
      ]);
      setSeats(updatedSeats || []);
      setSpace(updatedSpace);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin chỗ. Vui lòng kiểm tra lại.';
      showToast(msg, 'error');
    } finally {
      setIsSeatSubmitting(false);
    }
  };

  const handleConfirmDeleteSeat = async () => {
    if (!deletingSeat || !space) return;
    if (isSeatBooked(deletingSeat)) {
      showToast(`Không thể xóa chỗ ngồi '${deletingSeat.seatCode}' vì đã có người đặt trước trong hệ thống!`, 'error');
      setDeletingSeat(null);
      return;
    }
    setIsSeatDeleting(true);
    try {
      await spaceApi.deleteSeat(deletingSeat.id);
      showToast(`Đã xóa chỗ ngồi ${deletingSeat.seatCode}`);
      setDeletingSeat(null);
      const [updatedSeats, updatedSpace] = await Promise.all([
        spaceApi.getSeatsBySpace(space.id),
        spaceApi.getSpaceById(space.id),
      ]);
      setSeats(updatedSeats || []);
      setSpace(updatedSpace);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xóa chỗ ngồi. Vui lòng thử lại.';
      showToast(msg, 'error');
    } finally {
      setIsSeatDeleting(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMaintenance = async (spaceId: number) => {
    setLoadingMaintenance(true);
    try {
      const data = await maintenanceApi.getMaintenanceBySpace(spaceId);
      setMaintenanceList(data || []);
    } catch {
      setMaintenanceList([]);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const spaceId = Number(id);
      const data = await spaceApi.getSpaceById(spaceId);
      setSpace(data);

      // Pre-fetch spaceTypes & facilities for editing modal
      Promise.all([
        spaceTypeApi.getAll().catch(() => []),
        spaceApi.getFacilities().catch(() => []),
      ]).then(([stList, facList]) => {
        setSpaceTypes(stList || []);
        setFacilities(facList || []);
      });

      // Fetch space images directly from space_images table
      spaceImageApi.getImagesBySpace(spaceId)
        .then((imgList) => {
          setSpaceImages(imgList || []);
        })
        .catch((imgErr) => {
          console.error('Lỗi khi tải ảnh từ bảng space_images:', imgErr);
          if (data.images && data.images.length > 0) {
            setSpaceImages(data.images);
          } else {
            setSpaceImages([]);
          }
        });

      // Fetch maintenance records
      fetchMaintenance(spaceId);

      // Fetch both seats & tables so data is always ready
      spaceApi.getSeatsBySpace(spaceId).then((res) => setSeats(res || [])).catch(() => setSeats([]));
      spaceApi.getTablesBySpace(spaceId).then((res) => setTables(res || [])).catch(() => setTables([]));

      // Fetch occupied seats & tables từ bookings thực tế trong hệ thống
      try {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const startIso = `${todayStr}T00:00:00`;
        const endIso = `${todayStr}T23:59:59`;

        // 1. Lấy danh sách ghế đang bận qua occupied-seats
        bookingService.getOccupiedSeats(spaceId, startIso, endIso)
          .then((codes) => {
            setOccupiedSeats((prev) => {
              const next = new Set(prev);
              (codes || []).forEach((c) => next.add(c.trim().toUpperCase()));
              return next;
            });
          })
          .catch(() => {});

        // 2. Lấy timeline sự kiện của không gian để nhận diện bàn & ghế có booking thực tế
        staffApi.getSpaceTimeline(spaceId, startIso, endIso)
          .then((timelineRes) => {
            const bookedTables = new Set<number>();
            const bookedSeats = new Set<string>();

            const events = timelineRes?.events || [];
            events.forEach((evt) => {
              if (evt.eventType === 'BOOKING') {
                const isOccupying = ['PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'].includes(evt.status);
                if (isOccupying) {
                  if (evt.tableId) {
                    bookedTables.add(evt.tableId);
                  }
                  if (evt.selectedSeats && Array.isArray(evt.selectedSeats)) {
                    evt.selectedSeats.forEach((code) => {
                      if (code) bookedSeats.add(code.trim().toUpperCase());
                    });
                  }
                }
              }
            });

            setOccupiedTableIds(bookedTables);
            if (bookedSeats.size > 0) {
              setOccupiedSeats((prev) => {
                const next = new Set(prev);
                bookedSeats.forEach((s) => next.add(s));
                return next;
              });
            }
          })
          .catch(() => {});
      } catch {
        setOccupiedSeats(new Set());
        setOccupiedTableIds(new Set());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tìm thấy thông tin không gian');
    } finally {
      setLoading(false);
    }
  };

  const formatMaintenanceDateTime = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { dateText: '—', timeText: '' };
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return { dateText: `${startStr} - ${endStr}`, timeText: '' };
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const sDay = pad(s.getDate());
      const sMonth = pad(s.getMonth() + 1);
      const sYear = s.getFullYear();
      const sHour = pad(s.getHours());
      const sMin = pad(s.getMinutes());

      const eDay = pad(e.getDate());
      const eMonth = pad(e.getMonth() + 1);
      const eYear = e.getFullYear();
      const eHour = pad(e.getHours());
      const eMin = pad(e.getMinutes());

      if (sDay === eDay && sMonth === eMonth && sYear === eYear) {
        return {
          dateText: `${sDay}/${sMonth}/${sYear}`,
          timeText: `${sHour}:${sMin} - ${eHour}:${eMin}`,
        };
      }
      return {
        dateText: `${sDay}/${sMonth}/${sYear} - ${eDay}/${eMonth}/${eYear}`,
        timeText: `${sHour}:${sMin} - ${eHour}:${eMin}`,
      };
    } catch {
      return { dateText: `${startStr} - ${endStr}`, timeText: '' };
    }
  };

  const getMaintenanceStatus = (m: MaintenanceBlock) => {
    const now = new Date().getTime();
    const start = new Date(m.startTime).getTime();
    const end = new Date(m.endTime).getTime();

    if (now >= start && now <= end) {
      return { label: 'Đang bảo trì', className: 'maint-pill-active' };
    }
    if (now < start) {
      return { label: 'Đã lên lịch', className: 'maint-pill-scheduled' };
    }
    return { label: 'Đã kết thúc', className: 'maint-pill-completed' };
  };

  // Đếm số lịch bảo trì sắp tới / chưa kết thúc
  const upcomingMaintenanceCount = useMemo(() => {
    const now = Date.now();
    return maintenanceList.filter((m) => new Date(m.endTime).getTime() >= now).length;
  }, [maintenanceList]);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Danh sách ảnh lấy chuẩn 100% từ bảng space_images
  const galleryImages = useMemo(() => {
    // 1. Ưu tiên danh sách ảnh lấy trực tiếp từ bảng space_images
    if (spaceImages && spaceImages.length > 0) {
      const sorted = [...spaceImages].sort((a, b) => {
        // Ảnh đại diện chính (isPrimary = true hoặc primary = true do Jackson serialize) luôn đứng đầu
        const isPrimaryA = Boolean(a.isPrimary || a.primary);
        const isPrimaryB = Boolean(b.isPrimary || b.primary);
        if (isPrimaryA && !isPrimaryB) return -1;
        if (!isPrimaryA && isPrimaryB) return 1;
        // Thứ tự sortOrder tăng dần
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        return (a.id ?? 0) - (b.id ?? 0);
      });

      const urls = sorted
        .map((img) => formatImageUrl(img.imageUrl?.trim()))
        .filter((url): url is string => Boolean(url));

      if (urls.length > 0) {
        return urls;
      }
    }

    // 2. Dự phòng phụ nếu space_images chưa kịp tải hoặc rỗng
    const list: string[] = [];
    if (space?.images && space.images.length > 0) {
      space.images.forEach((img) => {
        const formatted = formatImageUrl(img.imageUrl);
        if (formatted && !list.includes(formatted)) {
          list.push(formatted);
        }
      });
    }
    const formattedPrimary = formatImageUrl(space?.primaryImageUrl);
    if (formattedPrimary && !list.includes(formattedPrimary)) {
      list.unshift(formattedPrimary);
    }
    const formattedFallback = formatImageUrl(space?.imageUrl);
    if (formattedFallback && !list.includes(formattedFallback)) {
      list.push(formattedFallback);
    }
    return list;
  }, [spaceImages, space]);

  const activeImageUrl = galleryImages[activeImageIndex] || galleryImages[0] || PLACEHOLDER_SPACE_IMAGE;

  const bookingMode = space?.spaceType?.bookingMode || space?.bookingMode || 'WHOLE_SPACE';
  const isApprovalRequired = Boolean(space?.spaceType?.requiresApproval ?? space?.requiresApproval);

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

  const formatLocation = (sp: Space) => {
    let building = sp.building ? sp.building.trim() : 'Tòa A';
    if (!/^tòa\s+/i.test(building)) {
      building = `Tòa ${building}`;
    }
    let floor = sp.floor ? sp.floor.trim() : 'Tầng 1';
    if (!/^tầng\s+/i.test(floor)) {
      floor = `Tầng ${floor}`;
    }
    return `${building} - ${floor}`;
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

  const renderStatusBadge = (status?: string) => {
    if (status === 'AVAILABLE') {
      return (
        <span className="pill-badge-active">
          <CheckCircle2 size={13} style={{ marginRight: '5px' }} />
          Hoạt động
        </span>
      );
    }
    if (status === 'MAINTENANCE') {
      return (
        <span className="pill-badge-maintenance">
          <Wrench size={13} style={{ marginRight: '5px' }} />
          Bảo trì
        </span>
      );
    }
    return (
      <span className="pill-badge-inactive">
        <AlertOctagon size={13} style={{ marginRight: '5px' }} />
        Ngưng hoạt động
      </span>
    );
  };

  const renderFacilityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('wi-fi')) {
      return <Wifi size={17} strokeWidth={2.2} />;
    }
    if (lower.includes('chiếu') || lower.includes('màn hình') || lower.includes('tv')) {
      return <Tv size={17} strokeWidth={2.2} />;
    }
    if (lower.includes('điều hòa') || lower.includes('lạnh') || lower.includes('khí')) {
      return <Snowflake size={17} strokeWidth={2.2} />;
    }
    if (lower.includes('điện') || lower.includes('sạc') || lower.includes('cắm') || lower.includes('ổ')) {
      return <Plug size={17} strokeWidth={2.2} />;
    }
    if (lower.includes('bảng') || lower.includes('bút')) {
      return <SquarePen size={17} strokeWidth={2.2} />;
    }
    return <Sparkles size={17} strokeWidth={2.2} />;
  };

  const handleUpdate = async (data: SpaceUpdateRequest) => {
    if (!space) return;
    setIsSubmitting(true);
    try {
      const updated = await spaceApi.updateSpace(space.id, data);
      setSpace(updated);
      setIsEditOpen(false);
      showToast(`Đã cập nhật không gian "${updated.name}" thành công`);
      fetchDetail();
    } catch (err: any) {
      // Lỗi được modal (SpaceFormModalKT) hiển thị trực tiếp trên form, không cần hiện thêm toast ở góc
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!space) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await spaceApi.deleteSpace(space.id);
      showToast(`Đã xóa không gian "${space.name}"`);
      setIsDeleteOpen(false);
      setTimeout(() => {
        navigate('/admin/spaces');
      }, 700);
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Không thể xóa không gian.';
      setDeleteError(rawMsg);
      showToast(rawMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-type-detail-page">
        <main className="detail-main-content">
          <div className="detail-loading-wrapper">
            <div className="loading-spinner" />
            <p>Đang tải dữ liệu chi tiết không gian...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="space-type-detail-page">
        <main className="detail-main-content">
          <div className="detail-header-row">
            <div className="detail-header-left">
              <h1 className="detail-header-title">Chi tiết không gian</h1>
              <p className="detail-header-subtitle">Xem thông tin chi tiết về không gian trong hệ thống.</p>
            </div>
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/spaces')}
            >
              ← Quay lại danh sách
            </button>
          </div>
          <div className="detail-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <p style={{ color: '#ef4444', fontSize: '15px', marginBottom: '16px' }}>
              {error || 'Không tìm thấy không gian yêu cầu.'}
            </p>
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/spaces')}
            >
              Trở về danh sách không gian
            </button>
          </div>
        </main>
      </div>
    );
  }

  const spaceTypeName = space.spaceType?.name || space.spaceTypeName || 'Chưa phân loại';
  const spaceTypeId = space.spaceType?.id || space.spaceTypeId;

  return (
    <div className="space-type-detail-page space-detail-page-kt">
      {/* Floating Toast Notification */}
      {toast && (
        <div className={`astp-toast-float astp-alert ${toast.type === 'success' ? 'astp-alert-success' : 'astp-alert-error'}`}>
          <span>{toast.text}</span>
        </div>
      )}

      <main className="detail-main-content">
        {/* Sub Navigation Bar to toggle KT management pages */}
        <div className="kt-subnav-bar">
          <Link
            to="/admin/space-types"
            className={`kt-subnav-item ${location.pathname.includes('space-types') ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>Loại không gian</span>
          </Link>
          <Link
            to="/admin/spaces"
            className={`kt-subnav-item active`}
          >
            <Building2 size={16} />
            <span>Không gian</span>
          </Link>
          <Link
            to="/admin/facilities"
            className={`kt-subnav-item ${location.pathname.includes('facilities') ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            <span>Tiện ích</span>
          </Link>
          <Link
            to="/staff"
            className={`kt-subnav-item ${location.pathname.startsWith('/staff') ? 'active' : ''}`}
          >
            <ClipboardList size={16} />
            <span>Vận hành Staff</span>
          </Link>
        </div>

        {/* Top Header Row */}
        <div className="detail-header-row">
          <div className="detail-header-left">
            <h1 className="detail-header-title">Chi tiết không gian</h1>
            <p className="detail-header-subtitle">
              Xem cấu hình chi tiết, trang thiết bị tiện ích, hình ảnh và trạng thái vận hành của phòng.
            </p>
          </div>

          <div className="detail-header-actions">
            <button
              type="button"
              className="btn-header-back"
              onClick={() => navigate('/admin/spaces')}
              id="btn-back-to-spaces"
            >
              <ArrowLeft size={15} style={{ marginRight: '6px' }} />
              Quay lại
            </button>
            <button
              type="button"
              className="btn-header-edit"
              onClick={() => setIsEditOpen(true)}
              id="btn-space-edit"
            >
              <Pencil size={15} style={{ marginRight: '6px' }} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="btn-header-back btn-header-danger"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteOpen(true);
              }}
              id="btn-space-delete"
            >
              <Trash2 size={15} style={{ marginRight: '6px' }} />
              Xóa không gian
            </button>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="detail-2col-layout">
          {/* ================= LEFT COLUMN ================= */}
          <div className="detail-col-left">
            {/* Card 1: Summary Banner Card & Image Showcase */}
            <div className="detail-card">
              <div className="banner-top-row">
                <div
                  className={`banner-icon-box ${
                    bookingMode === 'PER_TABLE'
                      ? 'banner-icon-purple'
                      : bookingMode === 'WHOLE_SPACE'
                      ? 'banner-icon-sky'
                      : 'banner-icon-green'
                  }`}
                >
                  {bookingMode === 'PER_TABLE' ? (
                    <Users size={28} strokeWidth={2.2} />
                  ) : bookingMode === 'WHOLE_SPACE' ? (
                    <DoorOpen size={28} strokeWidth={2.2} />
                  ) : (
                    <Armchair size={28} strokeWidth={2.2} />
                  )}
                </div>

                <div className="banner-meta-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {space.spaceCode && <span className="space-code-badge">{space.spaceCode}</span>}
                    <h2 className="banner-title-main" style={{ margin: 0 }}>{space.name}</h2>
                  </div>
                  <div className="banner-badges-row">
                    {renderStatusBadge(space.status)}
                    <span className="pill-badge-mode">
                      {getVietnameseModeName(bookingMode)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo Showcase Gallery (Lấy dữ liệu từ bảng space_images) */}
              <div className="space-gallery-container">
                {galleryImages.length > 0 ? (
                  <>
                    <div
                      className="gallery-main-view"
                      onClick={() => {
                        setModalImageIndex(activeImageIndex);
                        setIsGalleryModalOpen(true);
                      }}
                      title="Bấm để phóng to xem tất cả ảnh (từ bảng space_images)"
                    >
                      <img
                        src={activeImageUrl}
                        alt={space.name}
                        className="gallery-main-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_SPACE_IMAGE;
                        }}
                      />
                    </div>

                    {galleryImages.length > 1 && (
                      <div className="gallery-4slots-grid">
                        {galleryImages.slice(0, galleryImages.length > 4 ? 3 : 4).map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`gallery-slot-tile ${idx === activeImageIndex ? 'active' : ''}`}
                            onClick={() => setActiveImageIndex(idx)}
                            title={`Xem ảnh ${idx + 1}`}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="gallery-slot-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_SPACE_IMAGE;
                              }}
                            />
                          </button>
                        ))}

                        {galleryImages.length > 4 && (
                          <button
                            type="button"
                            className="gallery-slot-tile gallery-slot-more"
                            onClick={() => {
                              setModalImageIndex(3);
                              setIsGalleryModalOpen(true);
                            }}
                            title={`Xem tất cả ${galleryImages.length} ảnh trong bảng space_images`}
                          >
                            <span className="gallery-more-number">+{galleryImages.length - 3}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="gallery-empty-state">
                    <Building2 size={36} color="#94a3b8" />
                    <span>Không gian chưa có ảnh trong bảng space_images</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Thông tin chi tiết không gian */}
            <div className="detail-card">
              <h3 className="card-header-with-icon">
                <Info size={18} strokeWidth={2.2} />
                Thông tin chung
              </h3>

              <div className="info-specs-list">
                {/* Mã không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Mã không gian</span>
                  <div className="spec-value-box monospace-code" style={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {space.spaceCode || '—'}
                  </div>
                </div>

                {/* ID định danh không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Mã định danh (ID)</span>
                  <div className="spec-value-box monospace-code">#{space.id}</div>
                </div>

                {/* Tên không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Tên phòng / Khu vực</span>
                  <div className="spec-value-box">{space.name}</div>
                </div>

                {/* Loại không gian */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Loại không gian</span>
                  <div>
                    {spaceTypeId ? (
                      <Link
                        to={`/admin/space-types/${spaceTypeId}`}
                        className="badge-link-type"
                        title="Bấm để xem chi tiết loại không gian"
                      >
                        <Layers size={14} />
                        <span>{spaceTypeName}</span>
                        <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <span className="spec-value-box">{spaceTypeName}</span>
                    )}
                  </div>
                </div>

                {/* Vị trí */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Vị trí</span>
                  <div className="spec-value-box">
                    <MapPin size={14} style={{ marginRight: '6px', color: '#2563eb' }} />
                    {formatLocation(space)}
                  </div>
                </div>

                {/* Sức chứa */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Sức chứa tối đa</span>
                  <div className="spec-value-box highlight-strong">
                    <Users size={14} style={{ marginRight: '6px', color: '#0284c7' }} />
                    {space.capacity} người
                  </div>
                </div>

                {/* Chế độ đặt chỗ */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Chế độ đặt chỗ</span>
                  <div>
                    <span className="badge-mode-full">
                      {getVietnameseModeName(bookingMode)}
                    </span>
                  </div>
                </div>

                {/* Quy trình duyệt */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Quy trình duyệt</span>
                  <div>
                    {space.spaceType?.requiresApproval ? (
                      <span className="badge-approval-full-yes">
                        <ShieldCheck size={14} style={{ marginRight: '5px' }} />
                        Cần nhân viên xét duyệt
                      </span>
                    ) : (
                      <span className="badge-approval-full-no">
                        <SquareCheck size={14} style={{ marginRight: '5px' }} />
                        Xác nhận tự động (Không cần duyệt)
                      </span>
                    )}
                  </div>
                </div>

                {/* Mô tả chi tiết */}
                <div className="info-spec-item info-spec-item-multiline">
                  <span className="spec-label-text">Mô tả</span>
                  <div
                    className="spec-value-box"
                    style={{
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: space.description ? '#334155' : '#94a3b8',
                    }}
                  >
                    {space.description || 'Chưa có thông tin mô tả cho không gian này.'}
                  </div>
                </div>

                {/* Ngày tạo */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Ngày tạo</span>
                  <div className="spec-value-box">{formatDateTime(space.createdAt)}</div>
                </div>

                {/* Ngày cập nhật */}
                <div className="info-spec-item">
                  <span className="spec-label-text">Ngày cập nhật</span>
                  <div className="spec-value-box">
                    {formatDateTime(space.updatedAt || space.createdAt)}
                  </div>
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
                Chỉ số tổng quan
              </h3>

              <div className="stats-2x2-grid">
                {/* 1. Sức chứa (Sky Blue) */}
                <div className="stat-tile-box tile-sky">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Sức chứa tối đa</span>
                    <span className="stat-tile-number">{space.capacity}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <Users size={20} strokeWidth={2} />
                  </div>
                </div>

                {/* 2. Tiện ích (Green) */}
                <div className="stat-tile-box tile-green">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Số tiện ích</span>
                    <span className="stat-tile-number">{space.facilities?.length || 0}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <Sparkles size={20} strokeWidth={2.2} />
                  </div>
                </div>

                {/* 3. Yêu cầu phê duyệt (Có / Không) */}
                <div
                  className={`stat-tile-box ${isApprovalRequired ? 'tile-amber' : 'tile-green'}`}
                  title={isApprovalRequired ? 'Không gian này cần nhân viên xét duyệt' : 'Xác nhận tự động (Không cần duyệt)'}
                >
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Yêu cầu phê duyệt</span>
                    <span className="stat-tile-number" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {isApprovalRequired ? 'Có' : 'Không'}
                    </span>
                  </div>
                  <div className="stat-tile-icon">
                    {isApprovalRequired ? (
                      <ShieldCheck size={20} strokeWidth={2} />
                    ) : (
                      <CheckCircle2 size={20} strokeWidth={2} />
                    )}
                  </div>
                </div>

                {/* 4. Bảo trì sắp tới (Purple Pastel) */}
                <div className="stat-tile-box tile-purple">
                  <div className="stat-tile-content">
                    <span className="stat-tile-label">Bảo trì sắp tới</span>
                    <span className="stat-tile-number">{upcomingMaintenanceCount}</span>
                  </div>
                  <div className="stat-tile-icon">
                    <Wrench size={20} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Tiện ích & Trang thiết bị đi kèm */}
            {(() => {
              const facilitiesList = space.facilities || [];
              const shouldLimitFacilities = facilitiesList.length > FACILITY_SHOW_LIMIT;
              const displayedFacilities = (showAllFacilities || !shouldLimitFacilities)
                ? facilitiesList
                : facilitiesList.slice(0, FACILITY_SHOW_LIMIT);
              const remainingFacilitiesCount = Math.max(0, facilitiesList.length - FACILITY_SHOW_LIMIT);

              return (
                <div className="detail-card">
                  <div className="facilities-card-header">
                    <h3 className="card-header-with-icon" style={{ margin: 0 }}>
                      <Sparkles size={18} strokeWidth={2.2} />
                      Tiện ích ({facilitiesList.length})
                    </h3>
                    {shouldLimitFacilities && (
                      <button
                        type="button"
                        className="btn-toggle-facilities"
                        onClick={() => setShowAllFacilities(!showAllFacilities)}
                      >
                        <span>{showAllFacilities ? 'Thu gọn' : `Xem thêm (${remainingFacilitiesCount})`}</span>
                        {showAllFacilities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {facilitiesList.length > 0 ? (
                    <div className="facilities-clean-list">
                      {displayedFacilities.map((fac) => (
                        <div key={fac.id} className="facility-clean-row">
                          <div className="facility-clean-icon-box">
                            {renderFacilityIcon(fac.name)}
                          </div>
                          <span className="facility-clean-name">{fac.name}</span>
                        </div>
                      ))}

                      {shouldLimitFacilities && (
                        <button
                          type="button"
                          className="btn-expand-facilities-bottom"
                          onClick={() => setShowAllFacilities(!showAllFacilities)}
                        >
                          <span>
                            {showAllFacilities
                              ? 'Thu gọn danh sách tiện ích'
                              : `Xem thêm ${remainingFacilitiesCount} tiện ích khác`}
                          </span>
                          {showAllFacilities ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="detail-empty-state">
                      Chưa có tiện ích nào được thiết lập cho không gian này.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Card 3: Danh sách Bàn hoặc Ghế (Đặt dưới Tiện ích) */}
            {(() => {
              const hasTables = tables.length > 0 || bookingMode === 'PER_TABLE';
              const hasSeats = seats.length > 0 || bookingMode === 'PER_SEAT';

              const totalTableCap = tables.reduce((acc, t) => acc + (t.capacity || 0), 0) || space.activeTableCapacity || space.capacity;

              const shouldLimitTables = tables.length > TABLE_SHOW_LIMIT;
              const displayedTables = (showAllTables || !shouldLimitTables)
                ? tables
                : tables.slice(0, TABLE_SHOW_LIMIT);
              const remainingTablesCount = Math.max(0, tables.length - TABLE_SHOW_LIMIT);

              const shouldLimitSeats = seats.length > SEAT_SHOW_LIMIT;
              const displayedSeats = (showAllSeats || !shouldLimitSeats)
                ? seats
                : seats.slice(0, SEAT_SHOW_LIMIT);
              const remainingSeatsCount = Math.max(0, seats.length - SEAT_SHOW_LIMIT);

              return (
                <div className="detail-card alloc-manage-card">
                  {hasTables ? (
                    <>
                      <div className="alloc-card-header">
                        <div className="alloc-header-title-group">
                          <Users size={18} strokeWidth={2.2} />
                          <h3 className="alloc-header-title">
                            Danh sách bàn ({tables.length || space.activeTableCount || 0})
                          </h3>
                        </div>
                        <div className="alloc-header-actions">
                          <button
                            type="button"
                            className="btn-alloc-add"
                            onClick={handleOpenCreateTable}
                            title="Thêm bàn mới cho phòng"
                          >
                            <Plus size={14} />
                            <span>Thêm bàn</span>
                          </button>
                          {shouldLimitTables && (
                            <button
                              type="button"
                              className="btn-toggle-facilities"
                              onClick={() => setShowAllTables(!showAllTables)}
                            >
                              <span>{showAllTables ? 'Thu gọn' : `Xem thêm (${remainingTablesCount})`}</span>
                              {showAllTables ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Thanh tóm tắt nhanh: Có bao nhiêu bàn */}
                      <div className="alloc-summary-bar">
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Số lượng bàn:</span>
                          <span className="alloc-summary-val highlight-sky">{tables.length || space.activeTableCount || 0} bàn</span>
                        </div>
                        <div className="alloc-summary-divider" />
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Tổng chỗ:</span>
                          <span className="alloc-summary-val highlight-purple">{totalTableCap} chỗ</span>
                        </div>
                      </div>

                      {/* Danh sách từng bàn hiển thị rõ ràng */}
                      {tables.length > 0 ? (
                        <div className="alloc-tables-list">
                          {displayedTables.map((tbl) => {
                            const tableBooked = isTableBooked(tbl);
                            const isAvail = !tableBooked && tbl.status === 'AVAILABLE';
                            const statusClass = tableBooked
                              ? 'status-booked'
                              : isAvail
                              ? 'status-avail'
                              : 'status-inact';

                            return (
                              <div
                                key={tbl.id}
                                className={`alloc-table-item-row ${statusClass}`}
                                title={
                                  tableBooked
                                    ? `Bàn ${tbl.tableCode} (${tbl.capacity} chỗ) - Đã có người đặt`
                                    : isAvail
                                    ? `Bàn ${tbl.tableCode} (${tbl.capacity} chỗ) - Sẵn sàng`
                                    : `Bàn ${tbl.tableCode} (${tbl.capacity} chỗ) - Tạm khóa`
                                }
                              >
                                <div className="alloc-table-main-col">
                                  <div className="table-code-badge">
                                    {tbl.tableCode}
                                  </div>
                                  <div className="table-detail-info">
                                    <div className="table-title-row">
                                      <span className="table-name-text">Bàn {tbl.tableCode}</span>
                                      <span className="table-cap-chip">
                                        <Users size={12} />
                                        <strong>{tbl.capacity}</strong> chỗ ngồi
                                      </span>
                                    </div>
                                    {tbl.description && (
                                      <span className="table-desc-note" title={tbl.description}>
                                        {tbl.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="alloc-table-right-col">
                                  <div className="item-action-btns">
                                    <button
                                      type="button"
                                      className="btn-action-icon btn-action-edit"
                                      onClick={() => handleOpenEditTable(tbl)}
                                      title={`Chỉnh sửa bàn ${tbl.tableCode}`}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn-action-icon btn-action-delete ${tableBooked ? 'disabled' : ''}`}
                                      onClick={() => {
                                        if (tableBooked) {
                                          showToast(`Bàn '${tbl.tableCode}' đã có người đặt trong hệ thống, không thể xóa!`, 'error');
                                          return;
                                        }
                                        setDeletingTable(tbl);
                                      }}
                                      title={tableBooked ? `Bàn ${tbl.tableCode} đã có người đặt, không thể xóa` : `Xóa bàn ${tbl.tableCode}`}
                                      disabled={tableBooked}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {shouldLimitTables && (
                            <button
                              type="button"
                              className="btn-expand-facilities-bottom"
                              onClick={() => setShowAllTables(!showAllTables)}
                            >
                              <span>
                                {showAllTables
                                  ? 'Thu gọn danh sách bàn'
                                  : `Xem thêm ${remainingTablesCount} bàn khác`}
                              </span>
                              {showAllTables ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="detail-empty-state">
                          Không gian có {space.activeTableCount || 0} bàn với tổng sức chứa {space.capacity} người.
                        </div>
                      )}
                    </>
                  ) : hasSeats ? (
                    <>
                      <div className="alloc-card-header">
                        <div className="alloc-header-title-group">
                          <Armchair size={18} strokeWidth={2.2} />
                          <h3 className="alloc-header-title">
                            Danh sách ghế ({seats.length || space.activeSeatCount || space.capacity})
                          </h3>
                        </div>
                        <div className="alloc-header-actions">
                          <button
                            type="button"
                            className="btn-alloc-add"
                            onClick={handleOpenCreateSeat}
                            title="Thêm ghế mới cho phòng"
                          >
                            <Plus size={14} />
                            <span>Thêm ghế</span>
                          </button>
                          {shouldLimitSeats && (
                            <button
                              type="button"
                              className="btn-toggle-facilities"
                              onClick={() => setShowAllSeats(!showAllSeats)}
                            >
                              <span>{showAllSeats ? 'Thu gọn' : `Xem thêm (${remainingSeatsCount})`}</span>
                              {showAllSeats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Thanh tóm tắt nhanh: Có bao nhiêu ghế */}
                      <div className="alloc-summary-bar">
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Hình thức:</span>
                          <span className="alloc-summary-val">Ghế ngồi cá nhân</span>
                        </div>
                        <div className="alloc-summary-divider" />
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Tổng số:</span>
                          <span className="alloc-summary-val highlight-sky">{seats.length || space.capacity} ghế</span>
                        </div>
                      </div>

                      {seats.length > 0 ? (
                        <>
                          <div className="seats-layout-grid" style={{ marginTop: '12px' }}>
                            {displayedSeats.map((seat) => {
                              const booked = isSeatBooked(seat);
                              const isAvail = !booked && seat.status === 'AVAILABLE';
                              const statusClass = booked
                                ? 'status-booked'
                                : isAvail
                                ? 'status-avail'
                                : 'status-inact';
                              const statusLabel = booked
                                ? 'Đã có người đặt'
                                : isAvail
                                ? 'Sẵn sàng'
                                : 'Tạm khóa';

                              return (
                                <div
                                  key={seat.id}
                                  className={`seat-item-card ${statusClass}`}
                                  onClick={() => handleOpenEditSeat(seat)}
                                  title={booked ? `Ghế ${seat.seatCode} (Đã có người đặt) - Bấm để xem chi tiết` : `Ghế ${seat.seatCode} (${statusLabel}) - Bấm để sửa`}
                                >
                                  <Armchair size={15} />
                                  <span className="seat-code">{seat.seatCode}</span>
                                </div>
                              );
                            })}
                          </div>

                          {shouldLimitSeats && (
                            <button
                              type="button"
                              className="btn-expand-facilities-bottom"
                              style={{ marginTop: '12px' }}
                              onClick={() => setShowAllSeats(!showAllSeats)}
                            >
                              <span>
                                {showAllSeats
                                  ? 'Thu gọn danh sách ghế'
                                  : `Xem thêm ${remainingSeatsCount} ghế khác`}
                              </span>
                              {showAllSeats ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="detail-empty-state">
                          Hệ thống tự động đồng bộ {space.capacity} vị trí ghế ngồi theo sức chứa phòng.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="alloc-card-header">
                        <div className="alloc-header-title-group">
                          <DoorOpen size={18} strokeWidth={2.2} />
                          <h3 className="alloc-header-title">Cấu hình đặt chỗ</h3>
                        </div>
                        <span className="alloc-header-badge badge-sky">
                          Nguyên phòng
                        </span>
                      </div>

                      <div className="alloc-summary-bar">
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Hình thức:</span>
                          <span className="alloc-summary-val">Đặt trọn gói nguyên phòng</span>
                        </div>
                        <div className="alloc-summary-divider" />
                        <div className="alloc-summary-item">
                          <span className="alloc-summary-label">Sức chứa tối đa:</span>
                          <span className="alloc-summary-val highlight-green">{space.capacity} người</span>
                        </div>
                      </div>

                      <div className="alloc-whole-desc-box">
                        <DoorOpen size={20} className="alloc-whole-icon" />
                        <p className="alloc-whole-text">
                          Người dùng đặt trước toàn bộ không gian cho khung giờ cụ thể. Hệ thống tự động khóa lịch và ngăn chặn đặt chỗ trùng trên toàn bộ phòng.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Card 4: Lịch bảo trì */}
            {(() => {
              const shouldLimitMaint = maintenanceList.length > MAINT_SHOW_LIMIT;
              const displayedMaint = (showAllMaintenance || !shouldLimitMaint)
                ? maintenanceList
                : maintenanceList.slice(0, MAINT_SHOW_LIMIT);

              return (
                <div className="detail-card maint-table-card">
                  <div className="maint-card-header">
                    <div className="maint-card-title-group">
                      <Clock size={19} strokeWidth={2.2} />
                      <h3 className="maint-header-title">Lịch bảo trì</h3>
                    </div>

                    {shouldLimitMaint && (
                      <button
                        type="button"
                        className="btn-maint-view-all"
                        onClick={() => setShowAllMaintenance(!showAllMaintenance)}
                      >
                        {showAllMaintenance ? 'Thu gọn' : 'Xem tất cả'}
                      </button>
                    )}
                  </div>

                  {loadingMaintenance ? (
                    <div className="maint-table-loading">Đang tải lịch bảo trì...</div>
                  ) : maintenanceList.length > 0 ? (
                    <div className="maint-table-container">
                      <table className="maint-mini-table">
                        <thead>
                          <tr>
                            <th className="col-maint-th-index">#</th>
                            <th className="col-maint-th-time">Thời gian</th>
                            <th className="col-maint-th-reason">Lý do</th>
                            <th className="col-maint-th-status">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedMaint.map((m, idx) => {
                            const statusInfo = getMaintenanceStatus(m);
                            const timeObj = formatMaintenanceDateTime(m.startTime, m.endTime);
                            return (
                              <tr key={m.id}>
                                <td className="col-maint-td-index">{idx + 1}</td>
                                <td className="col-maint-td-time">
                                  <div
                                    className="maint-time-group"
                                    title={`${timeObj.dateText} ${timeObj.timeText}`}
                                  >
                                    <span className="maint-time-date">{timeObj.dateText}</span>
                                    {timeObj.timeText && (
                                      <span className="maint-time-hours">
                                        {timeObj.timeText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="col-maint-td-reason" title={m.reason}>
                                  <div className="maint-reason-wrapper">
                                    <span className="maint-reason-text">
                                      {m.reason}
                                    </span>
                                    <div className="maint-reason-popover" role="tooltip">
                                      {m.reason}
                                    </div>
                                  </div>
                                </td>
                                <td className="col-maint-td-status">
                                  <span className={`maint-table-pill ${statusInfo.className}`}>
                                    {statusInfo.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="maint-table-empty">
                      Chưa có lịch bảo trì nào cho không gian này.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>

      {/* Edit Space Modal */}
      {isEditOpen && (
        <SpaceFormModalKT
          isOpen={isEditOpen}
          mode="edit"
          space={space}
          spaceTypes={spaceTypes}
          facilities={facilities}
          isLoading={isSubmitting}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete / Hide Space Confirmation */}
      {isDeleteOpen && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Xác nhận xóa không gian"
          message={`Bạn có chắc muốn xóa không gian "${space.name}" khỏi hệ thống?`}
          warningNote="Không gian và toàn bộ chỗ ngồi/bàn thuộc không gian này sẽ bị xóa khỏi hệ thống."
          errorMessage={deleteError}
          confirmText="Xác nhận xóa"
          cancelText="Hủy bỏ"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => {
            setIsDeleteOpen(false);
            setDeleteError(null);
          }}
        />
      )}

      {/* Table Modal (Thêm / Sửa bàn) */}
      {isTableModalOpen && (
        <div className="modal-backdrop-blur" onClick={() => !isTableSubmitting && setIsTableModalOpen(false)}>
          <div className="modal-dialog-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3 style={{ color: '#0f172a' }}>
                {tableModalMode === 'create' ? 'Thêm bàn mới' : `Chỉnh sửa bàn ${editingTable?.tableCode}`}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsTableModalOpen(false)}
                disabled={isTableSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTable} noValidate>
              <div className="item-modal-form">
                {tableModalMode === 'edit' && editingTable && isTableBooked(editingTable) && (
                  <div className="seat-capacity-hint error" style={{ marginBottom: '14px', background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                    <div>
                      <strong>Bàn này hiện đã có người đặt trong cơ sở dữ liệu (Booking)</strong>
                      <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#991b1b' }}>
                        Trạng thái đặt chỗ được đồng bộ tự động từ cơ sở dữ liệu. Bàn đang có đơn đặt hợp lệ sẽ không thể xóa.
                      </div>
                    </div>
                  </div>
                )}
                <div className="item-form-group">
                  <label className="item-form-label">Mã bàn <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="item-form-input"
                    value={tableCodeInput}
                    onChange={(e) => setTableCodeInput(e.target.value)}
                    placeholder="VD: T01, T02, Table-A..."
                    disabled={isTableSubmitting}
                  />
                </div>
                <div className="item-form-group">
                  <label className="item-form-label">Sức chứa (người) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    className="item-form-input"
                    min={1}
                    max={space?.capacity || 50}
                    value={tableCapacityInput}
                    onChange={(e) => setTableCapacityInput(Number(e.target.value))}
                    disabled={isTableSubmitting}
                  />
                </div>
                <div className="item-form-group">
                  <label className="item-form-label">Trạng thái cấu hình</label>
                  <select
                    className="item-form-select"
                    value={tableStatusInput}
                    onChange={(e) => setTableStatusInput(e.target.value as 'AVAILABLE' | 'INACTIVE')}
                    disabled={isTableSubmitting}
                  >
                    <option value="AVAILABLE">Hoạt động (AVAILABLE)</option>
                    <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
                  </select>
                </div>
                <div className="item-form-group">
                  <label className="item-form-label">Ghi chú / Mô tả</label>
                  <textarea
                    className="item-form-textarea"
                    rows={2}
                    value={tableDescInput}
                    onChange={(e) => setTableDescInput(e.target.value)}
                    placeholder="Vị trí cạnh cửa sổ, gần ổ cắm..."
                    disabled={isTableSubmitting}
                  />
                </div>
              </div>
              <div className="item-modal-footer">
                {tableModalMode === 'edit' && editingTable ? (
                  <button
                    type="button"
                    className={`btn-item-delete-link ${isTableBooked(editingTable) ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isTableBooked(editingTable)) {
                        showToast(`Không thể xóa bàn '${editingTable.tableCode}' vì đang có người đặt trong hệ thống!`, 'error');
                        return;
                      }
                      setIsTableModalOpen(false);
                      setDeletingTable(editingTable);
                    }}
                    disabled={isTableSubmitting}
                  >
                    <Trash2 size={15} />
                    <span>Xóa bàn này</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="item-modal-footer-right">
                  <button
                    type="button"
                    className="btn-item-cancel"
                    onClick={() => setIsTableModalOpen(false)}
                    disabled={isTableSubmitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-item-save"
                    disabled={isTableSubmitting}
                  >
                    {isTableSubmitting ? 'Đang lưu...' : (tableModalMode === 'create' ? 'Thêm bàn' : 'Cập nhật')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Modal (Thêm 1 ghế hoặc nhiều ghế / Sửa ghế) */}
      {isSeatModalOpen && (
        <div className="modal-backdrop-blur" onClick={() => !isSeatSubmitting && setIsSeatModalOpen(false)}>
          <div
            className="modal-dialog-box"
            style={{ maxWidth: seatModalMode === 'create' && seatCreateTab === 'bulk' ? '500px' : '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog-header">
              <h3 style={{ color: '#0f172a' }}>
                {seatModalMode === 'create'
                  ? seatCreateTab === 'bulk'
                    ? 'Thêm chỗ ngồi hàng loạt'
                    : 'Thêm chỗ ngồi mới'
                  : `Chỉnh sửa chỗ ngồi ${editingSeat?.seatCode}`}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsSeatModalOpen(false)}
                disabled={isSeatSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitSeat} noValidate>
              <div className="item-modal-form">
                {/* Switcher: Thêm 1 ghế vs Thêm nhiều ghế (chỉ hiện khi mode === 'create') */}
                {seatModalMode === 'create' && (
                  <div className="item-modal-tabs">
                    <button
                      type="button"
                      className={`item-modal-tab-btn ${seatCreateTab === 'single' ? 'active' : ''}`}
                      onClick={() => setSeatCreateTab('single')}
                    >
                      <Armchair size={15} />
                      <span>Thêm 1 ghế</span>
                    </button>
                    <button
                      type="button"
                      className={`item-modal-tab-btn ${seatCreateTab === 'bulk' ? 'active' : ''}`}
                      onClick={() => setSeatCreateTab('bulk')}
                    >
                      <Users size={15} />
                      <span>Thêm nhiều ghế</span>
                    </button>
                  </div>
                )}

                {/* THÊM 1 GHẾ (hoặc SỬA GHẾ) */}
                {(seatModalMode === 'edit' || seatCreateTab === 'single') && (
                  <>
                    {editingSeat && isSeatBooked(editingSeat) && (
                      <div className="seat-capacity-hint error" style={{ marginBottom: '14px', background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                        <div>
                          <strong>Chỗ này hiện đã có người đặt trong cơ sở dữ liệu (Booking)</strong>
                          <div style={{ fontSize: '11.5px', marginTop: '2px', color: '#991b1b' }}>
                            Trạng thái đặt chỗ được đồng bộ tự động từ cơ sở dữ liệu. Chỗ ngồi đang có người đặt sẽ không thể xóa.
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="item-form-group">
                      <label className="item-form-label">Mã chỗ ngồi <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className="item-form-input"
                        value={seatCodeInput}
                        onChange={(e) => setSeatCodeInput(e.target.value)}
                        placeholder="VD: S01, S02, A-01..."
                        disabled={isSeatSubmitting}
                      />
                    </div>
                    <div className="item-form-group">
                      <label className="item-form-label">Trạng thái cấu hình</label>
                      <select
                        className="item-form-select"
                        value={seatStatusInput}
                        onChange={(e) => setSeatStatusInput(e.target.value as 'AVAILABLE' | 'INACTIVE')}
                        disabled={isSeatSubmitting}
                      >
                        <option value="AVAILABLE">Hoạt động / Sẵn sàng (AVAILABLE)</option>
                        <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
                      </select>
                    </div>
                    <div className="item-form-group">
                      <label className="item-form-label">Ghi chú / Mô tả</label>
                      <textarea
                        className="item-form-textarea"
                        rows={2}
                        value={seatDescInput}
                        onChange={(e) => setSeatDescInput(e.target.value)}
                        placeholder="Chỗ gần cửa ra vào, có ổ sạc..."
                        disabled={isSeatSubmitting}
                      />
                    </div>
                  </>
                )}

                {/* THÊM NHIỀU GHẾ CÙNG LÚC (BULK) */}
                {seatModalMode === 'create' && seatCreateTab === 'bulk' && (
                  <>
                    {/* Capacity Info Banner */}
                    <div
                      className={`seat-capacity-hint ${
                        bulkValidation.exceedsCapacity ? 'error' : bulkValidation.remainingCapacity <= 2 ? 'warning' : ''
                      }`}
                    >
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div>
                          <strong>Sức chứa phòng:</strong> {space?.capacity || 0} chỗ •{' '}
                          <strong>Đang có:</strong> {seats.length} ghế •{' '}
                          <strong>Còn trống:</strong> {bulkValidation.remainingCapacity} chỗ
                        </div>
                        {bulkValidation.exceedsCapacity && (
                          <div style={{ color: '#b91c1c', marginTop: '2px', fontWeight: 600 }}>
                            Số lượng ghế định thêm ({bulkValidation.total}) vượt quá sức chứa còn lại!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submode Selection */}
                    <div className="item-form-group">
                      <label className="item-form-label">Phương thức tạo mã ghế</label>
                      <div className="seat-bulk-submode">
                        <label className="seat-bulk-submode-label">
                          <input
                            type="radio"
                            name="bulkMode"
                            checked={bulkMode === 'pattern'}
                            onChange={() => setBulkMode('pattern')}
                          />
                          <span>Tự động sinh theo thứ tự</span>
                        </label>
                        <label className="seat-bulk-submode-label">
                          <input
                            type="radio"
                            name="bulkMode"
                            checked={bulkMode === 'custom'}
                            onChange={() => setBulkMode('custom')}
                          />
                          <span>Tự nhập danh sách</span>
                        </label>
                      </div>
                    </div>

                    {bulkMode === 'pattern' ? (
                      <div className="item-form-row">
                        <div className="item-form-group">
                          <label className="item-form-label">Tiền tố mã</label>
                          <input
                            type="text"
                            className="item-form-input"
                            value={bulkPrefix}
                            onChange={(e) => setBulkPrefix(e.target.value.trim().toUpperCase())}
                            placeholder="VD: S"
                            maxLength={8}
                            disabled={isSeatSubmitting}
                          />
                        </div>
                        <div className="item-form-group">
                          <label className="item-form-label">Số bắt đầu</label>
                          <input
                            type="number"
                            min={1}
                            max={999}
                            className="item-form-input"
                            value={bulkStartNum}
                            onChange={(e) => setBulkStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={isSeatSubmitting}
                          />
                        </div>
                        <div className="item-form-group">
                          <label className="item-form-label">Số lượng tạo</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, bulkValidation.remainingCapacity || 100)}
                            className="item-form-input"
                            value={bulkCount}
                            onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={isSeatSubmitting}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="item-form-group">
                        <label className="item-form-label">
                          Danh sách mã chỗ <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                          className="item-form-textarea"
                          rows={3}
                          value={bulkCustomInput}
                          onChange={(e) => setBulkCustomInput(e.target.value)}
                          placeholder="Nhập mã ghế cách nhau bằng dấu phẩy, khoảng trắng hoặc xuống dòng. VD: S01, S02, S03..."
                          disabled={isSeatSubmitting}
                        />
                        <span className="seat-bulk-help">
                          Có thể dán trực tiếp danh sách mã ghế từ Excel hoặc văn bản.
                        </span>
                      </div>
                    )}

                    {/* Preview Box */}
                    <div className="seat-bulk-preview-wrap">
                      <div className="seat-bulk-preview-header">
                        <span>Danh sách mã sẽ thêm ({bulkValidation.total} chỗ)</span>
                        {bulkValidation.existingConflicts.length > 0 && (
                          <span style={{ color: '#ef4444', fontSize: '11.5px', fontWeight: 600 }}>
                            Có {bulkValidation.existingConflicts.length} mã đã tồn tại
                          </span>
                        )}
                        {bulkValidation.selfDuplicates.length > 0 && (
                          <span style={{ color: '#f59e0b', fontSize: '11.5px', fontWeight: 600 }}>
                            Có {bulkValidation.selfDuplicates.length} mã trùng nhau
                          </span>
                        )}
                      </div>

                      {bulkGeneratedCodes.length > 0 ? (
                        <div className="seat-bulk-chips">
                          {bulkGeneratedCodes.map((code, idx) => {
                            const isExisting = existingSeatCodesUpper.has(code.toUpperCase());
                            return (
                              <span
                                key={idx}
                                className={`seat-bulk-chip ${isExisting ? 'existing' : ''}`}
                                title={isExisting ? 'Mã này đã có trong phòng, không thể tạo' : 'Hợp lệ'}
                              >
                                {code}
                                {isExisting && ' (đã có)'}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                          Chưa có mã ghế nào được nhập hoặc sinh ra.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="item-modal-footer">
                {seatModalMode === 'edit' && editingSeat ? (
                  <button
                    type="button"
                    className={`btn-item-delete-link ${isSeatBooked(editingSeat) ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isSeatBooked(editingSeat)) {
                        showToast(`Không thể xóa chỗ ngồi '${editingSeat.seatCode}' vì đã có người đặt trong hệ thống!`, 'error');
                        return;
                      }
                      setIsSeatModalOpen(false);
                      setDeletingSeat(editingSeat);
                    }}
                    disabled={isSeatSubmitting || isSeatBooked(editingSeat)}
                    title={isSeatBooked(editingSeat) ? 'Chỗ ngồi này đã có người đặt trong hệ thống, không thể xóa' : 'Xóa ghế này'}
                  >
                    <Trash2 size={15} />
                    <span>Xóa ghế này</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="item-modal-footer-right">
                  <button
                    type="button"
                    className="btn-item-cancel"
                    onClick={() => setIsSeatModalOpen(false)}
                    disabled={isSeatSubmitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-item-save"
                    disabled={
                      isSeatSubmitting ||
                      (seatModalMode === 'create' && seatCreateTab === 'bulk' && !bulkValidation.isValid)
                    }
                  >
                    {isSeatSubmitting
                      ? 'Đang lưu...'
                      : seatModalMode === 'create'
                      ? seatCreateTab === 'bulk'
                        ? `Thêm ${bulkValidation.total} ghế`
                        : 'Thêm ghế'
                      : 'Cập nhật'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Table Confirmation */}
      {deletingTable && (
        <ConfirmDialog
          isOpen={Boolean(deletingTable)}
          title="Xác nhận xóa bàn"
          message={`Bạn có chắc chắn muốn xóa bàn "${deletingTable.tableCode}" (${deletingTable.capacity} chỗ)?`}
          warningNote="Bàn bị xóa sẽ không còn hiển thị cho sinh viên chọn đặt theo bàn."
          confirmText="Xóa bàn"
          cancelText="Hủy bỏ"
          isLoading={isTableDeleting}
          onConfirm={handleConfirmDeleteTable}
          onCancel={() => setDeletingTable(null)}
        />
      )}

      {/* Delete Seat Confirmation */}
      {deletingSeat && (
        <ConfirmDialog
          isOpen={Boolean(deletingSeat)}
          title="Xác nhận xóa chỗ ngồi"
          message={`Bạn có chắc chắn muốn xóa chỗ ngồi "${deletingSeat.seatCode}"?`}
          warningNote="Chỗ ngồi bị xóa sẽ không còn hiển thị cho sinh viên chọn khi đặt chỗ cá nhân."
          confirmText="Xóa ghế"
          cancelText="Hủy bỏ"
          isLoading={isSeatDeleting}
          onConfirm={handleConfirmDeleteSeat}
          onCancel={() => setDeletingSeat(null)}
        />
      )}

      {/* Lightbox / Gallery Full View Modal */}
      {isGalleryModalOpen && (
        <div
          className="gallery-modal-backdrop"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="gallery-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gallery-modal-header">
              <div className="gallery-modal-title">
                <span>Hình ảnh không gian ({galleryImages.length})</span>
                <span className="gallery-modal-subtitle">• {space?.name}</span>
              </div>
              <button
                type="button"
                className="btn-gallery-modal-close"
                onClick={() => setIsGalleryModalOpen(false)}
                title="Đóng (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            <div className="gallery-modal-stage">
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className="btn-gallery-nav btn-gallery-prev"
                  onClick={() =>
                    setModalImageIndex((prev) =>
                      prev === 0 ? galleryImages.length - 1 : prev - 1
                    )
                  }
                  title="Ảnh trước"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              <div className="gallery-modal-image-wrapper">
                <img
                  src={galleryImages[modalImageIndex] || activeImageUrl}
                  alt={`${space?.name} - Ảnh ${modalImageIndex + 1}`}
                  className="gallery-modal-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_SPACE_IMAGE;
                  }}
                />
                <div className="gallery-modal-counter">
                  {modalImageIndex + 1} / {galleryImages.length}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className="btn-gallery-nav btn-gallery-next"
                  onClick={() =>
                    setModalImageIndex((prev) =>
                      prev === galleryImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  title="Ảnh kế tiếp"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="gallery-modal-thumbnails-strip">
                {galleryImages.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`gallery-strip-thumb ${idx === modalImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setModalImageIndex(idx);
                      setActiveImageIndex(idx);
                    }}
                  >
                    <img
                      src={url}
                      alt={`Thumb ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_SPACE_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
