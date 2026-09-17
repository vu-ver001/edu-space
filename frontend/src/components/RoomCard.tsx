import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export const RoomCard: React.FC<Props> = ({ space, searchParams }) => {
  const navigate = useNavigate();
  const isAvailable = space.isAvailable ?? (space.status === 'AVAILABLE');
  const imageUrl = space.imageUrl || ROOM_IMAGES[space.id] || DEFAULT_IMAGE;

  const handleViewAndBook = () => {
    const params = new URLSearchParams();
    if (searchParams?.date) params.set('date', searchParams.date);
    if (searchParams?.startTime) params.set('startTime', searchParams.startTime);
    if (searchParams?.endTime) params.set('endTime', searchParams.endTime);
    if (searchParams?.participantCount) params.set('participantCount', String(searchParams.participantCount));
    
    const queryString = params.toString();
    navigate(`/spaces/${space.id}${queryString ? `?${queryString}` : ''}`);
  };

  const bookingMode = space.bookingMode || space.spaceType?.bookingMode || (
    space.spaceTypeName?.toLowerCase().includes('bàn') ? 'PER_TABLE' :
    space.spaceTypeName?.toLowerCase().includes('ghế') || space.spaceTypeName?.toLowerCase().includes('mở') ? 'PER_SEAT' :
    'WHOLE_SPACE'
  );
  const isPerSeat = bookingMode === 'PER_SEAT';
  const isPerTable = bookingMode === 'PER_TABLE';

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

      {/* Card Content Body */}
      <div className="room-card-body">
        <div className="room-card-header">
          <h3 className="room-card-title">{space.name}</h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="room-card-type-label">{space.spaceTypeName}</span>
            {isPerSeat ? (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                💺 Chọn chỗ ngồi
              </span>
            ) : isPerTable ? (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                🪑 Chọn bàn nhóm
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                🏢 Đặt trọn phòng
              </span>
            )}
          </div>
        </div>

        <div className="room-card-location-meta">
          <span className="meta-item">
            <svg className="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {space.building} • {space.floor}
          </span>
          <span className="meta-item capacity">
            <svg className="meta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            Tối đa {space.capacity} người
          </span>
        </div>

        {/* Amenities Pills */}
        <div className="room-card-amenities">
          {space.facilities && space.facilities.slice(0, 3).map((f) => (
            <span key={f.id} className="amenity-chip">
              {f.name}
            </span>
          ))}
          {space.facilities && space.facilities.length > 3 && (
            <span className="amenity-chip more">
              +{space.facilities.length - 3}
            </span>
          )}
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
