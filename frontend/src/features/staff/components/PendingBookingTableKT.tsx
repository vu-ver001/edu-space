import React from 'react';
import type { PendingBooking } from '../types/staff';
import { StatusBadge } from '../../../components/common/StatusBadge';

interface PendingBookingTableKTProps {
  bookings: PendingBooking[];
  isLoading?: boolean;
  onApprove: (booking: PendingBooking) => void;
  onReject: (booking: PendingBooking) => void;
}

export const PendingBookingTableKT: React.FC<PendingBookingTableKTProps> = ({
  bookings,
  isLoading = false,
  onApprove,
  onReject,
}) => {
  if (isLoading) {
    return (
      <div className="staff-loading-card">
        <div className="staff-spinner" />
        <p>Đang tải danh sách chờ duyệt...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="staff-empty-card">
        <span style={{ fontSize: '32px' }}>✨</span>
        <h4>Không có yêu cầu chờ duyệt</h4>
        <p>Hiện tại tất cả các yêu cầu đặt phòng đã được xử lý xong.</p>
      </div>
    );
  }

  return (
    <div className="staff-table-card">
      <table className="staff-data-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Phòng yêu cầu</th>
            <th>Sinh viên đặt</th>
            <th>Khung giờ</th>
            <th>Số người & Mục đích</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: 'right' }}>Quyết định</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const startDt = new Date(b.startTime);
            const endDt = new Date(b.endTime);

            return (
              <tr key={b.id}>
                <td>
                  <span className="booking-id-chip">#{b.id}</span>
                </td>
                <td>
                  <div className="room-name-cell">
                    <strong>{b.spaceName}</strong>
                    <small>{b.spaceTypeName || 'Chuyên dụng'} • {b.building || 'Tòa nhà'}</small>
                  </div>
                </td>
                <td>
                  <div className="student-cell">
                    <strong>{b.studentName}</strong>
                    <small>{b.studentEmail}</small>
                  </div>
                </td>
                <td>
                  <div className="time-range-cell">
                    <strong>{startDt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                    <small>
                      {startDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="purpose-cell">
                    <span>👥 {b.participantCount} người</span>
                    {b.purpose && <small title={b.purpose}>"{b.purpose}"</small>}
                  </div>
                </td>
                <td>
                  <StatusBadge status={b.status} size="sm" />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions-flex" style={{ justifyContent: 'flex-end', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-table-reject"
                      onClick={() => onReject(b)}
                    >
                      ✕ Từ chối
                    </button>
                    <button
                      type="button"
                      className="btn-table-approve"
                      onClick={() => onApprove(b)}
                    >
                      ✓ Duyệt ngay
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
