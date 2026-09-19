import React, { useEffect, useState } from 'react';
import type { Booking, BookingAuditLog } from '../services/bookingService';
import { bookingService } from '../services/bookingService';

interface Props {
  booking: Booking;
  onClose: () => void;
}

export const AuditLogModal: React.FC<Props> = ({ booking, onClose }) => {
  const [logs, setLogs] = useState<BookingAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    bookingService
      .getAuditLogs(booking.id)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [booking.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📜</span>
            <div>
              <h3 className="modal-title">Nhật Ký Thao Tác (Audit Log)</h3>
              <p className="modal-subtitle">
                Booking #{booking.id} • {booking.spaceName} • {booking.studentName}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="audit-modal-body">
          {loading ? (
            <div className="state-loading-box">
              <span className="spinner" />
              <p>Đang tải nhật ký kiểm toán...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="state-empty-box">
              <span>📭</span>
              <p>Chưa có thao tác nào được ghi nhận cho booking này.</p>
            </div>
          ) : (
            <div className="audit-timeline">
              {logs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <strong className="timeline-action">{log.actionDescription || log.action}</strong>
                      <span className="timeline-time">
                        {new Date(log.performedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="timeline-actor">
                      👤 Người thực hiện: <strong>{log.performedByName}</strong> ({log.performedByEmail})
                    </div>
                    {log.reason && (
                      <div className="timeline-reason">
                        📌 <em>Lý do:</em> {log.reason}
                      </div>
                    )}
                    {log.note && (
                      <div className="timeline-note">
                        💬 <em>Ghi chú:</em> {log.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel-modal" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
