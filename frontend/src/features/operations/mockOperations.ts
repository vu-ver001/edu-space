import type {
  AuditAction,
  AuditPage,
  AuditQuery,
  OperationsAuditLog,
  OperationsSpace,
  OperationsTimelineEvent,
  TimelineQuery,
} from './types';

export const operationSpaces: OperationsSpace[] = [
  { id: 1, name: 'Phòng học nhóm A101', location: 'Tòa A · Tầng 1', tone: 'amber' },
  { id: 2, name: 'Phòng thuyết trình B201', location: 'Tòa B · Tầng 2', tone: 'blue' },
  { id: 3, name: 'Phòng máy tính C' },
];

export const timelineSpaces: OperationsSpace[] = [
  { id: 1, name: 'Phòng học nhóm A101', location: 'Tòa A · Tầng 1', tone: 'amber' },
  { id: 2, name: 'Phòng thuyết trình B201', location: 'Tòa B · Tầng 2', tone: 'blue' },
  { id: 3, name: 'Phòng học nhóm A102', location: 'Tòa A · Tầng 1', tone: 'slate' },
  { id: 4, name: 'Phòng tự học C301', location: 'Tòa C · Tầng 3', tone: 'green' },
];

const timelineEvents: OperationsTimelineEvent[] = [
  {
    eventType: 'MAINTENANCE', eventId: 86, displayCode: 'MT-20260919-001', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-19T08:00:00', endTime: '2026-09-19T10:00:00',
    status: 'IN_PROGRESS', title: 'Bảo trì hệ thống chiếu sáng', purpose: 'Kiểm tra hệ thống chiếu sáng',
    reason: 'Thay bóng đèn và kiểm tra đường điện', createdBy: 'Nguyễn Văn Hùng', createdAt: '2026-09-18T16:20:00',
  },
  {
    eventType: 'BOOKING', eventId: 1030, displayCode: 'BK-20260919-030', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-19T10:30:00', endTime: '2026-09-19T12:00:00',
    status: 'CONFIRMED', title: 'Hội thảo sinh viên', purpose: 'Hội thảo kỹ năng học tập', participantName: 'Trần Thị Mai',
    participantCount: 40, tableLabel: 'Không có bàn', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-17T09:10:00',
  },
  {
    eventType: 'BOOKING', eventId: 1031, displayCode: 'BK-20260919-031', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-19T14:00:00', endTime: '2026-09-19T16:00:00',
    status: 'CHECKED_IN', title: 'Học nhóm môn AI', purpose: 'Thực hành mô hình học máy', participantName: 'Nguyễn Thảo Vy',
    participantCount: 8, tableLabel: 'Bàn 1, 2', createdBy: 'Lê Thị Mai', createdAt: '2026-09-18T20:05:00',
  },
  {
    eventType: 'BOOKING', eventId: 1032, displayCode: 'BK-20260919-032', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-19T20:00:00', endTime: '2026-09-19T22:00:00',
    status: 'PENDING_APPROVAL', title: 'Sinh hoạt câu lạc bộ', purpose: 'Sinh hoạt câu lạc bộ học thuật', participantName: 'Đỗ Khánh Linh',
    participantCount: 15, tableLabel: 'Không có bàn', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-18T21:20:00',
  },
  {
    eventType: 'MAINTENANCE', eventId: 87, displayCode: 'MT-20260919-087', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-19T21:00:00', endTime: '2026-09-19T22:00:00',
    status: 'SCHEDULED', title: 'Bảo trì điều hòa', purpose: 'Bảo trì hệ thống điều hòa', reason: 'Bảo trì định kỳ cuối ngày',
    createdBy: 'Nguyễn Văn Hùng', createdAt: '2026-09-18T10:30:00',
  },
  {
    eventType: 'BOOKING', eventId: 1040, displayCode: 'BK-20260920-040', spaceId: 1,
    spaceName: 'Phòng học nhóm A101', startTime: '2026-09-20T09:00:00', endTime: '2026-09-20T11:00:00',
    status: 'CONFIRMED', title: 'Ôn tập giữa kỳ', purpose: 'Ôn tập môn Cơ sở dữ liệu', participantName: 'Phạm Gia Bảo',
    participantCount: 6, tableLabel: 'Bàn 2', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-19T15:45:00',
  },
  {
    eventType: 'MAINTENANCE', eventId: 88, displayCode: 'MT-20260920-088', spaceId: 1,
    spaceName: 'Phòng học nhóm A101', startTime: '2026-09-20T10:00:00', endTime: '2026-09-20T12:00:00',
    status: 'SCHEDULED', title: 'Bảo trì máy chiếu', purpose: 'Kiểm tra máy chiếu và âm thanh', reason: 'Thiết bị cần kiểm tra trước tuần học mới',
    createdBy: 'Trần Văn Minh', createdAt: '2026-09-19T11:20:00',
  },
  {
    eventType: 'BOOKING', eventId: 1041, displayCode: 'BK-20260920-041', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-20T13:00:00', endTime: '2026-09-20T15:00:00',
    status: 'CONFIRMED', title: 'Thực hành thuyết trình', purpose: 'Chuẩn bị báo cáo đồ án', participantName: 'Lê Minh Quân',
    participantCount: 12, tableLabel: 'Bàn 1, 2, 3', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-19T08:10:00',
  },
  {
    eventType: 'BOOKING', eventId: 1050, displayCode: 'BK-20260921-050', spaceId: 3,
    spaceName: 'Phòng học nhóm A102', startTime: '2026-09-21T08:00:00', endTime: '2026-09-21T10:00:00',
    status: 'CHECKED_IN', title: 'Học nhóm môn Luật', purpose: 'Làm bài tập nhóm', participantName: 'Nguyễn Thảo Vy',
    participantCount: 5, tableLabel: 'Bàn 1', createdBy: 'Lê Thị Mai', createdAt: '2026-09-20T18:15:00',
  },
  {
    eventType: 'MAINTENANCE', eventId: 89, displayCode: 'MT-20260922-089', spaceId: 4,
    spaceName: 'Phòng tự học C301', startTime: '2026-09-22T09:00:00', endTime: '2026-09-22T11:00:00',
    status: 'COMPLETED', title: 'Bảo trì bàn ghế', purpose: 'Kiểm tra và thay thế bàn ghế', reason: 'Bảo trì cơ sở vật chất định kỳ',
    createdBy: 'Nguyễn Văn Hùng', createdAt: '2026-09-21T09:30:00',
  },
  {
    eventType: 'BOOKING', eventId: 1051, displayCode: 'BK-20260922-051', spaceId: 4,
    spaceName: 'Phòng tự học C301', startTime: '2026-09-22T12:00:00', endTime: '2026-09-22T14:00:00',
    status: 'REJECTED', title: 'Sinh hoạt nhóm', purpose: 'Thảo luận đề tài nghiên cứu', participantName: 'Hoàng Đức Duy',
    participantCount: 10, tableLabel: 'Bàn 3', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-21T20:10:00',
  },
  {
    eventType: 'BOOKING', eventId: 1060, displayCode: 'BK-20260923-060', spaceId: 2,
    spaceName: 'Phòng thuyết trình B201', startTime: '2026-09-23T09:00:00', endTime: '2026-09-23T12:00:00',
    status: 'CONFIRMED', title: 'Báo cáo đồ án nhóm', purpose: 'Báo cáo đồ án cuối kỳ', participantName: 'Hoàng Đức Duy',
    participantCount: 20, tableLabel: 'Không có bàn', createdBy: 'Admin', createdAt: '2026-09-22T14:30:00',
  },
  {
    eventType: 'BOOKING', eventId: 1070, displayCode: 'BK-20260924-070', spaceId: 1,
    spaceName: 'Phòng học nhóm A101', startTime: '2026-09-24T15:00:00', endTime: '2026-09-24T17:00:00',
    status: 'EXPIRED', title: 'Học nhóm môn AI', purpose: 'Ôn tập trước kỳ thi', participantName: 'Đỗ Khánh Linh',
    participantCount: 3, tableLabel: 'Bàn 3', createdBy: 'Nguyễn Văn An', createdAt: '2026-09-22T20:10:00',
  },
  {
    eventType: 'MAINTENANCE', eventId: 90, displayCode: 'MT-20260925-090', spaceId: 4,
    spaceName: 'Phòng tự học C301', startTime: '2026-09-25T16:00:00', endTime: '2026-09-25T18:00:00',
    status: 'CANCELLED', title: 'Bảo trì hệ thống mạng', purpose: 'Kiểm tra hệ thống mạng', reason: 'Đã hủy do nhà cung cấp thay đổi lịch',
    createdBy: 'Admin', createdAt: '2026-09-24T09:03:00',
  },
];

const auditActors = {
  an: { actorUserId: 11, actorName: 'Nguyễn Văn An', actorEmail: 'an.nguyen@eduspace.edu.vn', actorRole: 'STAFF' as const },
  mai: { actorUserId: 12, actorName: 'Lê Thị Mai', actorEmail: 'mai.le@eduspace.edu.vn', actorRole: 'STAFF' as const },
  admin: { actorUserId: 1, actorName: 'Admin', actorEmail: 'admin@eduspace.edu.vn', actorRole: 'ADMIN' as const },
};

const auditLogs: OperationsAuditLog[] = [
  { id: 1, ...auditActors.an, action: 'BOOKING_APPROVED', targetType: 'BOOKING', targetId: 1024, targetLabel: 'Booking #1024', spaceName: 'Phòng học nhóm A', details: 'Duyệt đặt phòng cho sinh viên Nguyễn Thị Mai (5 người)', createdAt: '2025-04-15T09:12:00' },
  { id: 2, ...auditActors.mai, action: 'BOOKING_REJECTED', targetType: 'BOOKING', targetId: 1025, targetLabel: 'Booking #1025', spaceName: 'Phòng thuyết trình B201', details: 'Từ chối do trùng lịch với sự kiện đã được duyệt', createdAt: '2025-04-15T10:28:00' },
  { id: 3, ...auditActors.admin, action: 'STAFF_CHECKED_IN_BOOKING', targetType: 'STUDENT', targetId: 20211234, targetLabel: 'Nguyễn Văn Hoàng (MSSV: 20211234)', spaceName: 'Phòng học nhóm A', details: 'Hỗ trợ check-in thủ công cho sinh viên do quên thẻ', createdAt: '2025-04-15T13:45:00' },
  { id: 4, ...auditActors.an, action: 'MAINTENANCE_CREATED', targetType: 'MAINTENANCE', targetId: 85, targetLabel: 'Bảo trì #85', spaceName: 'Phòng thuyết trình B201', details: 'Tạo lịch bảo trì định kỳ cho hệ thống máy chiếu', createdAt: '2025-04-16T08:20:00' },
  { id: 5, ...auditActors.mai, action: 'MAINTENANCE_UPDATED', targetType: 'MAINTENANCE', targetId: 85, targetLabel: 'Bảo trì #85', spaceName: 'Phòng thuyết trình B201', details: 'Cập nhật trạng thái: Đang thực hiện → Hoàn thành', createdAt: '2025-04-16T14:17:00' },
  { id: 6, ...auditActors.admin, action: 'MAINTENANCE_CANCELLED', targetType: 'MAINTENANCE', targetId: 87, targetLabel: 'Bảo trì #87', spaceName: 'Phòng máy tính C', details: 'Hủy lịch do thay đổi kế hoạch bảo trì từ nhà cung cấp', createdAt: '2025-04-17T09:03:00' },
  { id: 7, ...auditActors.an, action: 'BOOKING_APPROVED', targetType: 'BOOKING', targetId: 1026, targetLabel: 'Booking #1026', spaceName: 'Phòng học nhóm B', details: 'Duyệt đặt phòng cho lớp CTK45 (12 người)', createdAt: '2025-04-17T11:26:00' },
  { id: 8, ...auditActors.mai, action: 'STAFF_CHECKED_IN_BOOKING', targetType: 'STUDENT', targetId: 20219876, targetLabel: 'Trần Văn Minh (MSSV: 20219876)', spaceName: 'Phòng học nhóm B', details: 'Hỗ trợ check-in thủ công do lỗi QR code', createdAt: '2025-04-17T15:10:00' },
  { id: 9, ...auditActors.admin, action: 'MAINTENANCE_UPDATED', targetType: 'MAINTENANCE', targetId: 86, targetLabel: 'Bảo trì #86', spaceName: 'Phòng học nhóm A', details: 'Thay đổi thời gian bảo trì từ 18/04 sang 19/04', createdAt: '2025-04-17T16:02:00' },
  { id: 10, ...auditActors.an, action: 'BOOKING_REJECTED', targetType: 'BOOKING', targetId: 1027, targetLabel: 'Booking #1027', spaceName: 'Phòng máy tính C', details: 'Từ chối do không phù hợp mục đích sử dụng', createdAt: '2025-04-17T16:35:00' },
  { id: 11, ...auditActors.admin, action: 'BOOKING_APPROVED', targetType: 'BOOKING', targetId: 1028, targetLabel: 'Booking #1028', spaceName: 'Phòng học nhóm A', details: 'Duyệt yêu cầu sau khi kiểm tra lịch phòng', createdAt: '2025-04-18T08:45:00' },
  { id: 12, ...auditActors.mai, action: 'MAINTENANCE_CREATED', targetType: 'MAINTENANCE', targetId: 88, targetLabel: 'Bảo trì #88', spaceName: 'Phòng máy tính C', details: 'Tạo lịch kiểm tra thiết bị đầu tuần', createdAt: '2025-04-18T10:12:00' },
];

const wait = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export const hasTimelineConflict = (
  event: OperationsTimelineEvent,
  allEvents: OperationsTimelineEvent[] = timelineEvents,
) => allEvents.some((other) => (
  other.spaceId === event.spaceId
  && (other.eventType !== event.eventType || other.eventId !== event.eventId)
  && new Date(event.startTime).getTime() < new Date(other.endTime).getTime()
  && new Date(other.startTime).getTime() < new Date(event.endTime).getTime()
));

export async function getMockTimeline(query: TimelineQuery): Promise<OperationsTimelineEvent[]> {
  await wait(320);
  const filtered = timelineEvents
    .filter((event) => !query.spaceId || event.spaceId === query.spaceId)
    .filter((event) => !query.eventType || event.eventType === query.eventType)
    .filter((event) => event.startTime.slice(0, 10) >= query.from && event.startTime.slice(0, 10) <= query.to);

  return filtered
    .filter((event) => !query.status
      || (query.status === 'CONFLICT' ? hasTimelineConflict(event, filtered) : event.status === query.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function getMockAuditLogs(query: AuditQuery, page: number, size: number): Promise<AuditPage> {
  await wait(320);
  const filtered = auditLogs
    .filter((log) => !query.action || log.action === query.action)
    .filter((log) => !query.spaceName || log.spaceName === query.spaceName)
    .filter((log) => !query.targetType || log.targetType === query.targetType)
    .filter((log) => !query.actorUserId || log.actorUserId === query.actorUserId)
    .filter((log) => !query.from || log.createdAt.slice(0, 10) >= query.from)
    .filter((log) => !query.to || log.createdAt.slice(0, 10) <= query.to)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
  };
}

export const allAuditActions: AuditAction[] = [
  'BOOKING_APPROVED', 'BOOKING_REJECTED', 'STAFF_CHECKED_IN_BOOKING',
  'MAINTENANCE_CREATED', 'MAINTENANCE_UPDATED', 'MAINTENANCE_CANCELLED',
];
