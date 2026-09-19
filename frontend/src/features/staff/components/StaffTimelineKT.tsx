import React from 'react';
import type { StaffTimelineEvent } from '../types/staff';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface StaffTimelineKTProps {
  events: StaffTimelineEvent[];
  isLoading?: boolean;
  onCheckIn?: (eventId: number) => void;
  checkInLoadingId?: number | null;
}

export const StaffTimelineKT: React.FC<StaffTimelineKTProps> = ({
  events,
  isLoading = false,
  onCheckIn,
  checkInLoadingId,
}) => {
  if (isLoading) {
    return (
      <div className="staff-loading-card">
        <div className="staff-spinner" />
        <p>Đang tải dòng thời gian vận hành...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="staff-empty-card">
        <span style={{ fontSize: '32px' }}>📅</span>
        <h4>Không có sự kiện nào trong khoảng thời gian này</h4>
        <p>Không gian đang trống, chưa có lịch đặt hoặc lịch bảo trì được xếp.</p>
      </div>
    );
  }

  return (
    <div className="staff-timeline-stream">
      {events.map((evt, idx) => {
        const startDt = new Date(evt.startTime);
        const endDt = new Date(evt.endTime);
        const isMaintenance = evt.eventType === 'MAINTENANCE';

        return (
          <div
            key={`${evt.eventType}-${evt.eventId}-${idx}`}
            className={`staff-timeline-card ${isMaintenance ? 'timeline-maintenance' : 'timeline-booking'}`}
          >
            <div className="timeline-card-indicator">
              <span className="indicator-icon">{isMaintenance ? '🛠️' : '📋'}</span>
            </div>

            <div className="timeline-card-content">
              <div className="timeline-card-header">
                <div className="timeline-type-row">
                  <span
                    className={`staff-badge ${
                      isMaintenance ? 'staff-badge-maintenance' : 'staff-badge-booking'
                    }`}
                  >
                    {isMaintenance ? 'BẢO TRÌ ĐỊNH KỲ' : 'ĐẶT CHỖ'}
                  </span>
                  <span className="timeline-event-id">#{evt.eventId}</span>
                  <StatusBadge status={evt.status as any} size="sm" />
                </div>

                <div className="timeline-time-chip">
                  🕒 {startDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} •{' '}
                  <strong>{startDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong> -{' '}
                  <strong>{endDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>

              <div className="timeline-card-body">
                <h4 className="timeline-title">{evt.title || (isMaintenance ? evt.reason : 'Sự kiện')}</h4>

                {isMaintenance ? (
                  <div className="timeline-meta-grid">
                    <div>
                      <span className="meta-lbl">Lý do bảo trì:</span> {evt.reason || 'Bảo trì kỹ thuật'}
                    </div>
                    {evt.creatorEmail && (
                      <div>
                        <span className="meta-lbl">Người lập lịch:</span> {evt.creatorEmail}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="timeline-meta-grid">
                    <div>
                      <span className="meta-lbl">Sinh viên:</span>{' '}
                      <strong>{evt.studentName || 'Sinh viên'}</strong> ({evt.studentEmail})
                    </div>
                    <div>
                      <span className="meta-lbl">Chế độ:</span> <code>{evt.bookingMode || 'WHOLE_SPACE'}</code>
                    </div>
                    {evt.participantCount && (
                      <div>
                        <span className="meta-lbl">Số người:</span> {evt.participantCount} bạn
                      </div>
                    )}
                    {evt.purpose && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span className="meta-lbl">Mục đích:</span> "{evt.purpose}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons (e.g. Check-in at desk for confirmed bookings) */}
              {!isMaintenance && evt.status === 'CONFIRMED' && onCheckIn && (
                <div className="timeline-card-footer">
                  <button
                    type="button"
                    className="staff-btn staff-btn-primary"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => onCheckIn(evt.eventId)}
                    disabled={checkInLoadingId === evt.eventId}
                  >
                    {checkInLoadingId === evt.eventId ? 'Đang check-in...' : '🛎️ Staff hỗ trợ Check-in'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
