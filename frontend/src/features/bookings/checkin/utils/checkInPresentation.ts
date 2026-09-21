import type { CheckInActor, CheckInBooking } from '../types/checkIn';

export type CheckInPresentation = {
  label: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  description: string;
  canSubmit: boolean;
};

const formatTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : 'thời gian máy chủ xác định';

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export function getCheckInPresentation(
  booking: CheckInBooking,
  actor: CheckInActor,
): CheckInPresentation {
  if (booking.status === 'CHECKED_IN') {
    const performedBy = booking.checkedInBy ?? (booking.checkedInById ? 'tài khoản đã xác nhận' : 'người dùng');
    return {
      label: 'Đã check-in',
      tone: 'success',
      description: `Thực hiện lúc ${formatTime(booking.checkedInAt ?? booking.startTime)} bởi ${performedBy}.`,
      canSubmit: false,
    };
  }

  if (booking.status !== 'CONFIRMED') {
    const labels: Record<string, string> = {
      PENDING_APPROVAL: 'Đang chờ duyệt',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Đã từ chối',
      EXPIRED: 'Đã hết hạn',
      NO_SHOW: 'Không đến',
      COMPLETED: 'Đã hoàn thành',
    };
    return {
      label: labels[booking.status] ?? booking.status,
      tone: 'neutral',
      description: 'Booking này không còn đủ điều kiện check-in.',
      canSubmit: false,
    };
  }

  if (booking.canCheckIn === false) {
    return {
      label: 'Chưa thể check-in',
      tone: 'info',
      description: 'Booking hiện chưa nằm trong cửa sổ check-in.',
      canSubmit: false,
    };
  }

  if (actor.role === 'STUDENT' && booking.studentId !== actor.id) {
    return {
      label: 'Không có quyền',
      tone: 'danger',
      description: 'Bạn chỉ được check-in booking của mình.',
      canSubmit: false,
    };
  }

  if (booking.demoState === 'TOO_EARLY') {
    return {
      label: 'Chưa đến giờ',
      tone: 'info',
      description: `Có thể check-in từ ${formatTime(booking.checkInOpenAt)}.`,
      canSubmit: false,
    };
  }

  if (booking.demoState === 'CLOSED') {
    return {
      label: 'Đã hết hạn',
      tone: 'warning',
      description: `Hạn cuối là ${formatTime(booking.checkInDeadline)}.`,
      canSubmit: false,
    };
  }

  return {
    label: actor.role === 'STUDENT' ? 'Có thể check-in' : 'Có thể hỗ trợ',
    tone: 'success',
    description: `Cửa sổ check-in kết thúc lúc ${formatTime(booking.checkInDeadline)}.`,
    canSubmit: true,
  };
}
