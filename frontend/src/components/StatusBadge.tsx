import React from 'react';
import type { BookingStatus } from '../services/bookingService';

interface Props {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const configMap: Record<BookingStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
    PENDING_APPROVAL: {
      label: 'Chờ duyệt',
      bg: '#FFFBEB',
      text: '#B45309',
      border: '#FDE68A',
      icon: '⏳'
    },
    CONFIRMED: {
      label: 'Đã xác nhận',
      bg: '#ECFDF5',
      text: '#047857',
      border: '#A7F3D0',
      icon: '✓'
    },
    CHECKED_IN: {
      label: 'Đã check-in',
      bg: '#F0F9FF',
      text: '#0369A1',
      border: '#BAE6FD',
      icon: '🟢'
    },
    REJECTED: {
      label: 'Bị từ chối',
      bg: '#FFF1F2',
      text: '#BE123C',
      border: '#FECDD3',
      icon: '✕'
    },
    CANCELLED: {
      label: 'Đã hủy',
      bg: '#F8FAFC',
      text: '#475569',
      border: '#E2E8F0',
      icon: '⊘'
    },
    EXPIRED: {
      label: 'Hết hạn duyệt',
      bg: '#FAF5FF',
      text: '#7E22CE',
      border: '#E9D5FF',
      icon: '⌛'
    },
    NO_SHOW: {
      label: 'Vắng mặt',
      bg: '#FEF2F2',
      text: '#991B1B',
      border: '#FCA5A5',
      icon: '⚠'
    },
    COMPLETED: {
      label: 'Hoàn thành',
      bg: '#EEF2FF',
      text: '#4338CA',
      border: '#C7D2FE',
      icon: '🏁'
    }
  };

  const config = configMap[status] || {
    label: status,
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    icon: '•'
  };

  const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '4px 10px';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8125rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        transition: 'all 0.2s ease'
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
