import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Armchair, Building2 } from 'lucide-react';
import type { Space } from '../services/spaceService';

interface Props {
  space: Space;
  searchParams?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    participantCount?: number;
  };
  onBook?: (space: Space) => void;
}

// Fallback high-res photos for university study & meeting spaces
const ROOM_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  3: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
  4: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
  5: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  6: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';

export const formatMaintenanceTime = (startStr: string, endStr: string): string => {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const startHours = pad(start.getHours());
    const startMinutes = pad(start.getMinutes());
    const endHours = pad(end.getHours());
    const endMinutes = pad(end.getMinutes());
    const day = pad(start.getDate());
    const month = pad(start.getMonth() + 1);

    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      return `${startHours}:${startMinutes}-${endHours}:${endMinutes} ${day}/${month}`;
    } else {
      const endDay = pad(end.getDate());
      const endMonth = pad(end.getMonth() + 1);
      return `${startHours}:${startMinutes} ${day}/${month} - ${endHours}:${endMinutes} ${endDay}/${endMonth}`;
    }
  } catch {
    return '';
  }
};

const formatDisplayName = (f: any): string => {
  const rawName = typeof f === 'string' ? f : f?.name || '';
  if (rawName.toLowerCase().includes('bảng trắng')) return 'Bảng trắng';
  if (rawName.toLowerCase().includes('máy chiếu')) return 'Máy chiếu';
  if (rawName.toLowerCase().includes('điều hòa')) return 'Điều hòa';
  if (rawName.toLowerCase().includes('ổ cắm')) return 'Ổ cắm điện';
  if (rawName.toLowerCase().includes('tv') || rawName.toLowerCase().includes('màn hình')) return 'Màn hình TV';
  if (rawName.toLowerCase().includes('âm thanh') || rawName.toLowerCase().includes('micro')) return 'Âm thanh';
  if (rawName.toLowerCase().includes('wifi')) return 'Wifi';
  if (rawName.toLowerCase().includes('đèn')) return 'Đèn học';
  if (rawName.toLowerCase().includes('lọc không khí')) return 'Lọc không khí';
  if (rawName.toLowerCase().includes('công thái học')) return 'Ghế ergonomic';
  return rawName;
};

// Icon bàn thảo luận nhóm sang trọng thay thế emoji 🪑
export const TableMeetingIcon = ({ size = 14, strokeWidth = 2.2, style }: { size?: number; strokeWidth?: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <rect x="3" y="9" width="18" height="3" rx="1" />
    <path d="M6 12v7" />
    <path d="M18 12v7" />
    <path d="M8 5h2a1 1 0 0 1 1 1v3H7V6a1 1 0 0 1 1-1z" />
    <path d="M14 5h2a1 1 0 0 1 1 1v3h-4V6a1 1 0 0 1 1-1z" />
  </svg>
);

export const RoomCard: React.FC<Props> = ({ space, searchParams }) => {
  const navigate = useNavigate();
  const isAvailable = space.isAvailable ?? (space.status === 'AVAILABLE');
  // Ưu tiên ảnh có is_primary = true từ bảng space_images
  const imageUrl = space.primaryImageUrl || space.imageUrl || ROOM_IMAGES[space.id] || DEFAULT_IMAGE;

  // Đo đạc để tiện ích luôn hiển thị đúng 1 dòng, nếu không đủ chỗ thì +N ở cuối dòng
  const amenitiesContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const facilitiesList = space.facilities || [];
  const [visibleCount, setVisibleCount] = useState<number>(facilitiesList.length);

  const updateVisibleChips = useCallback(() => {
    if (!amenitiesContainerRef.current || !measureContainerRef.current || facilitiesList.length === 0) {
      setVisibleCount(facilitiesList.length);
      return;
    }

    const containerWidth = amenitiesContainerRef.current.clientWidth;
    if (containerWidth <= 0) return;

    const measureEl = measureContainerRef.current;
    const chips = Array.from(measureEl.querySelectorAll<HTMLElement>('.amenity-chip-measure'));
    const moreEl = measureEl.querySelector<HTMLElement>('.amenity-chip-more-measure');
    const moreWidth = moreEl ? moreEl.offsetWidth : 36;
    const gap = 6;

    // Kiểm tra nếu tất cả chip vừa trên 1 dòng
    let totalAllWidth = 0;
    for (let i = 0; i < chips.length; i++) {
      totalAllWidth += chips[i].offsetWidth + (i > 0 ? gap : 0);
    }

    if (totalAllWidth <= containerWidth) {
      setVisibleCount(chips.length);
      return;
    }

    // Nếu không vừa toàn bộ, tính số chip tối đa để vừa cả badge +N ở cuối dòng
    let currentWidth = 0;
    let fitCount = 0;
    for (let i = 0; i < chips.length; i++) {
      const chipWidth = chips[i].offsetWidth;
      const nextWidth = currentWidth + (i > 0 ? gap : 0) + chipWidth;
      if (nextWidth + gap + moreWidth <= containerWidth) {
        currentWidth = nextWidth;
        fitCount = i + 1;
      } else {
        break;
      }
    }

    setVisibleCount(Math.max(1, fitCount));
  }, [facilitiesList]);

  useEffect(() => {
    updateVisibleChips();

    const container = amenitiesContainerRef.current;
    if (!container) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateVisibleChips());
      ro.observe(container);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [updateVisibleChips]);

  const handleViewAndBook = () => {
    const params = new URLSearchParams();
    if (searchParams?.date) params.set('date', searchParams.date);
    if (searchParams?.startTime) params.set('startTime', searchParams.startTime);
    if (searchParams?.endTime) params.set('endTime', searchParams.endTime);
    if (searchParams?.participantCount) params.set('participantCount', String(searchParams.participantCount));
    
    const queryString = params.toString();
    navigate(`/student/spaces/${space.id}${queryString ? `?${queryString}` : ''}`);
  };

  const bookingMode = space.bookingMode || space.spaceType?.bookingMode || (
    space.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space.spaceTypeName?.toLowerCase().includes('ghế') || space.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );
  const isPerSeat = bookingMode === 'PER_SEAT';
  const isPerTable = bookingMode === 'PER_TABLE';
  // LOGIC LIÊN KẾT CSDL: Lấy trực tiếp từ space.requiresApproval (hoặc space.spaceType.requiresApproval từ Kim Tuyến)
  const requiresApproval = space.requiresApproval ?? space.spaceType?.requiresApproval ?? !isPerSeat;

  return (
    <div className={`room-card-v1 ${!isAvailable ? 'card-disabled' : ''}`}>
      {/* Top Image Container with Badge */}
      <div className="room-card-image-wrapper">
        <img 
          src={imageUrl} 
          alt={space.name} 
          className="room-card-img" 
          loading="lazy" 
        />
        <div className="room-card-badge-pinned">
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

      {/* Card Content Body */}
      <div className="room-card-body">
        <div className="room-card-header">
          <h3 className="room-card-title">{space.name}</h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="room-card-type-label">{space.spaceTypeName}</span>
            {isPerSeat ? (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Armchair size={13} strokeWidth={2.2} />
                <span>Chọn chỗ ngồi</span>
              </span>
            ) : isPerTable ? (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <TableMeetingIcon size={13} strokeWidth={2.2} />
                <span>Chọn bàn nhóm</span>
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={13} strokeWidth={2.2} />
                <span>Đặt trọn phòng</span>
              </span>
            )}
          </div>
        </div>

        <div className="room-card-location-meta">
          <span className="meta-item">
            <svg className="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {space.building}, {space.floor ? (space.floor.toString().toLowerCase().includes('tầng') ? space.floor.toLowerCase() : `tầng ${space.floor}`) : ''}
          </span>
          <span className="meta-item capacity">
            <svg className="meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            {space.capacity} chỗ ngồi
          </span>
        </div>

        {/* Amenities Pills - Đúng 1 dòng duy nhất, nếu không đủ chỗ thì +N ở cuối dòng */}
        <div ref={amenitiesContainerRef} className="room-card-amenities">
          {facilitiesList.slice(0, visibleCount).map((f: any, idx: number) => {
            const rawName = typeof f === 'string' ? f : f?.name || '';
            const displayName = formatDisplayName(f);

            return (
              <span key={f?.id || `${rawName}-${idx}`} className="amenity-chip" title={rawName}>
                {displayName}
              </span>
            );
          })}
          {facilitiesList.length > visibleCount && (
            <span
              className="amenity-chip more"
              title={`Còn ${facilitiesList.length - visibleCount} tiện ích: ${facilitiesList
                .slice(visibleCount)
                .map((f: any) => (typeof f === 'string' ? f : f?.name || ''))
                .join(', ')}`}
            >
              +{facilitiesList.length - visibleCount}
            </span>
          )}
        </div>

        {/* Invisible measuring clone container để đo chính xác theo pixel */}
        <div
          ref={measureContainerRef}
          style={{
            position: 'absolute',
            top: -9999,
            left: -9999,
            visibility: 'hidden',
            pointerEvents: 'none',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
          aria-hidden="true"
        >
          {facilitiesList.map((f: any, idx: number) => {
            const displayName = formatDisplayName(f);
            return (
              <span key={`measure-${idx}`} className="amenity-chip amenity-chip-measure">
                {displayName}
              </span>
            );
          })}
          <span className="amenity-chip more amenity-chip-more-measure">
            +99
          </span>
        </div>

        {/* Action Button full-width */}
        <div className="room-card-action">
          <button
            type="button"
            className="btn-card-view-book"
            onClick={handleViewAndBook}
          >
            Xem và đặt chỗ
          </button>
        </div>
      </div>
    </div>
  );
};

