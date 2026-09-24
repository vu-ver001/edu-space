import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import {
  Armchair,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  DoorOpen,
  FileText,
  RefreshCw,
  Search,
  Target,
  TriangleAlert,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { getMockTimeline, hasTimelineConflict, timelineSpaces } from '../mockOperations';
import type { OperationsSpace, OperationsTimelineEvent, TimelineEventType, TimelineQuery } from '../types';
import '../operations.css';

type ViewMode = 'day' | 'week' | 'list';
type LoadMode = 'loading' | 'refreshing';

const sampleDate = '2026-09-19';
const sampleFrom = '2026-09-19';
const sampleTo = '2026-09-25';
const timelineStartHour = 6;
const timelineEndHour = 24;
const timelineDurationMinutes = (timelineEndHour - timelineStartHour) * 60;
const weekStartHour = 8;
const weekEndHour = 24;
const weekDurationMinutes = (weekEndHour - weekStartHour) * 60;
const weekDayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const eventTypeLabels: Record<TimelineEventType, string> = {
  BOOKING: 'Booking',
  MAINTENANCE: 'Bảo trì',
};

const statusLabels: Record<string, string> = {
  CONFIRMED: 'CONFIRMED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
};

const detailStatusLabels: Record<string, string> = {
  CONFIRMED: 'Đã xác nhận',
  PENDING_APPROVAL: 'Chờ duyệt',
  CHECKED_IN: 'Đã check-in',
  IN_PROGRESS: 'Đang thực hiện',
  SCHEDULED: 'Đã lên lịch',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  COMPLETED: 'Đã hoàn thành',
};

const statusOptions = [
  { value: 'CONFIRMED', label: 'CONFIRMED' },
  { value: 'PENDING_APPROVAL', label: 'PENDING_APPROVAL' },
  { value: 'CHECKED_IN', label: 'CHECKED_IN' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'EXPIRED', label: 'EXPIRED' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CONFLICT', label: 'Có khả năng xung đột' },
];

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string) => new Date(`${value}T00:00:00`);

const addDays = (value: string, amount: number) => {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + amount);
  return toDateInput(date);
};

const startOfMonth = (value: string) => {
  const date = parseDateInput(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const startOfWeek = (value: string) => {
  const date = parseDateInput(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return toDateInput(date);
};

const formatMonth = (date: Date) => new Intl.DateTimeFormat('vi-VN', {
  month: 'long', year: 'numeric',
}).format(date);

const formatDateHeading = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(parseDateInput(value));

const formatDateOnly = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));

const eventDate = (event: OperationsTimelineEvent) => event.startTime.slice(0, 10);

const eventMinutes = (value: string) => {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};

const eventMinutesForDate = (value: string, date: string) => {
  const valueDate = value.slice(0, 10);
  if (valueDate < date) return 0;
  if (valueDate > date) return 24 * 60;
  return eventMinutes(value);
};

const overlaps = (first: OperationsTimelineEvent, second: OperationsTimelineEvent) => (
  first.spaceId === second.spaceId
  && (first.eventId !== second.eventId || first.eventType !== second.eventType)
  && new Date(first.startTime).getTime() < new Date(second.endTime).getTime()
  && new Date(second.startTime).getTime() < new Date(first.endTime).getTime()
);

const getStatusClass = (status?: string) => status ? `timeline-status-${status.toLowerCase()}` : '';

interface EventCardProps {
  event: OperationsTimelineEvent;
  conflict: boolean;
  compact?: boolean;
  style?: CSSProperties;
  onSelect: (event: OperationsTimelineEvent) => void;
}

const TimelineEventCard = ({ event, conflict, compact = false, style, onSelect }: EventCardProps) => {
  const handleKeyDown = (keyboardEvent: KeyboardEvent<HTMLElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      onSelect(event);
    }
  };

  return (
    <article
      className={`timeline-event-card timeline-event-${event.eventType.toLowerCase()} ${compact ? 'is-compact' : ''} ${conflict ? 'has-conflict' : ''}`}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event)}
      onKeyDown={handleKeyDown}
      aria-label={`${event.title}, ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
    >
      <div className="timeline-event-copy">
        <strong>{event.title}</strong>
        <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
      </div>
      <small className="timeline-event-code">{event.displayCode}</small>
      <span className={`timeline-event-status ${getStatusClass(event.status)}`}>{statusLabels[event.status] ?? event.status}</span>
      {event.participantCount !== undefined && <span className="timeline-event-people"><UsersRound size={12} /> {event.participantCount} người</span>}
      {conflict && (
        <span
          className="timeline-conflict-badge"
          role="button"
          tabIndex={0}
          onClick={(clickEvent) => { clickEvent.stopPropagation(); onSelect(event); }}
          onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') { keyboardEvent.stopPropagation(); onSelect(event); } }}
        >
          <TriangleAlert size={12} />
          <span>Có khả năng xung đột</span>
        </span>
      )}
    </article>
  );
};

interface DayViewProps {
  events: OperationsTimelineEvent[];
  allEvents: OperationsTimelineEvent[];
  onSelect: (event: OperationsTimelineEvent) => void;
}

const DayTimeline = ({ events, allEvents, onSelect }: DayViewProps) => {
  const labels = Array.from({ length: (timelineEndHour - timelineStartHour) / 2 + 1 }, (_, index) => timelineStartHour + index * 2);
  const axisLabels = labels.slice(1, -1);
  const visibleEvents = events.filter((event) => eventMinutes(event.endTime) > timelineStartHour * 60 && eventMinutes(event.startTime) < timelineEndHour * 60);

  return (
    <div className="timeline-day-view">
      <div className="timeline-day-time-column" aria-hidden="true">
        {axisLabels.map((hour) => <span key={hour} style={{ top: `${((hour - timelineStartHour) / (timelineEndHour - timelineStartHour)) * 100}%` }}>{`${`${hour}`.padStart(2, '0')}:00`}</span>)}
      </div>
      <div className="timeline-day-canvas">
        {labels.map((hour) => <div key={hour} className="timeline-day-grid-line" style={{ top: `${((hour - timelineStartHour) / (timelineEndHour - timelineStartHour)) * 100}%` }} />)}
        {visibleEvents.length === 0 && <div className="timeline-empty-state"><CalendarDays size={28} /><strong>Không có sự kiện</strong><span>Không có lịch phù hợp trong ngày này.</span></div>}
        {visibleEvents.map((event) => {
          const start = Math.max(eventMinutes(event.startTime), timelineStartHour * 60);
          const end = Math.min(eventMinutes(event.endTime), timelineEndHour * 60);
          const duration = Math.max(end - start, 30);
          return (
            <TimelineEventCard
              key={`${event.eventType}-${event.eventId}`}
              event={event}
              conflict={hasTimelineConflict(event, allEvents)}
              style={{ top: `${((start - timelineStartHour * 60) / timelineDurationMinutes) * 100}%`, height: `${(duration / timelineDurationMinutes) * 100}%` }}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

interface WeekViewProps {
  dates: string[];
  events: OperationsTimelineEvent[];
  selectedDate: string;
  onSelect: (event: OperationsTimelineEvent) => void;
  onDateSelect: (date: string) => void;
}

interface WeekLayoutEvent {
  event: OperationsTimelineEvent;
  start: number;
  end: number;
  lane: number;
  laneCount: number;
}

const layoutWeekDayEvents = (dayEvents: OperationsTimelineEvent[], date: string): WeekLayoutEvent[] => {
  const visibleStart = weekStartHour * 60;
  const visibleEnd = weekEndHour * 60;
  const sorted = dayEvents
    .map((event) => ({
      event,
      start: Math.max(eventMinutesForDate(event.startTime, date), visibleStart),
      end: Math.min(eventMinutesForDate(event.endTime, date), visibleEnd),
    }))
    .filter(({ start, end }) => end > visibleStart && start < visibleEnd && end > start)
    .sort((first, second) => first.start - second.start || first.end - second.end);

  const result: WeekLayoutEvent[] = [];
  let group: typeof sorted = [];
  let groupEnd = -1;

  const flushGroup = () => {
    if (group.length === 0) return;
    const laneEnds: number[] = [];
    const assignments = group.map((item) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.end);
      } else {
        laneEnds[lane] = item.end;
      }
      return { ...item, lane };
    });
    const laneCount = Math.max(1, laneEnds.length);
    assignments.forEach((item) => result.push({ ...item, laneCount }));
  };

  sorted.forEach((item) => {
    if (group.length > 0 && item.start >= groupEnd) {
      flushGroup();
      group = [];
      groupEnd = -1;
    }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  });
  flushGroup();
  return result;
};

const WeekTimeline = ({ dates, events, selectedDate, onSelect, onDateSelect }: WeekViewProps) => {
  const hours = Array.from({ length: weekEndHour - weekStartHour + 1 }, (_, index) => weekStartHour + index);
  const timeLabels = hours.filter((hour) => hour % 2 === 0);
  const today = toDateInput(new Date());

  return (
    <div className="weekly-scheduler-scroll">
      <div className="weekly-scheduler-frame">
        <div className="weekly-scheduler-header">
          <div className="weekly-timezone">GMT+7</div>
          {dates.map((date, index) => {
            const eventCount = events.filter((event) => eventDate(event) === date).length;
            return (
              <button
                type="button"
                key={date}
                className={`weekly-day-header ${date === selectedDate ? 'is-selected' : ''} ${date === today ? 'is-today' : ''}`}
                onClick={() => onDateSelect(date)}
                aria-label={`Mở lịch ngày ${formatDateOnly(`${date}T00:00:00`)}`}
              >
                <span>{weekDayLabels[index]}</span>
                <strong>{parseDateInput(date).getDate()}</strong>
                <small>{eventCount > 0 ? `${eventCount} sự kiện` : 'Không có lịch'}</small>
              </button>
            );
          })}
        </div>

        <div className="weekly-scheduler-body">
          <div className="weekly-time-axis" aria-hidden="true">
            {timeLabels.map((hour) => (
              <span key={hour} style={{ top: `${((hour - weekStartHour) / (weekEndHour - weekStartHour)) * 100}%` }}>{`${`${hour}`.padStart(2, '0')}:00`}</span>
            ))}
          </div>
          <div className="weekly-scheduler-grid">
            {hours.map((hour) => (
              <div key={hour} className={`weekly-hour-line ${hour % 2 === 0 ? 'is-major' : ''}`} style={{ top: `${((hour - weekStartHour) / (weekEndHour - weekStartHour)) * 100}%` }} />
            ))}
            {dates.map((date) => {
              const dayEvents = events.filter((event) => eventDate(event) === date);
              const layoutEvents = layoutWeekDayEvents(dayEvents, date);
              return (
                <div className={`weekly-day-column ${date === today ? 'is-today' : ''}`} key={date}>
                  {layoutEvents.map(({ event, start, end, lane, laneCount }) => {
                    const conflict = hasTimelineConflict(event, events);
                    const top = ((start - weekStartHour * 60) / weekDurationMinutes) * 100;
                    const height = ((end - start) / weekDurationMinutes) * 100;
                    const laneWidth = 100 / laneCount;
                    return (
                      <button
                        type="button"
                        key={`${event.eventType}-${event.eventId}`}
                        className={`weekly-scheduler-event weekly-event-${event.eventType.toLowerCase()} ${conflict ? 'has-conflict' : ''}`}
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          left: `calc(${lane * laneWidth}% + 3px)`,
                          width: `calc(${laneWidth}% - 6px)`,
                        }}
                        onClick={() => onSelect(event)}
                        aria-label={`${event.title}, ${formatTime(event.startTime)} - ${formatTime(event.endTime)}${conflict ? ', có khả năng xung đột' : ''}`}
                      >
                        <span className="weekly-event-time">{formatTime(event.startTime)}–{formatTime(event.endTime)}</span>
                        <strong>{event.title}</strong>
                        <span className="weekly-event-status">{detailStatusLabels[event.status] ?? event.status}</span>
                        {conflict && <span className="weekly-event-conflict" title="Có khả năng xung đột"><TriangleAlert size={11} /><span>Xung đột</span></span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ListViewProps {
  events: OperationsTimelineEvent[];
  onSelect: (event: OperationsTimelineEvent) => void;
}

const ListTimeline = ({ events, onSelect }: ListViewProps) => {
  const groups = Array.from(events.reduce((map, event) => {
    const date = eventDate(event);
    const current = map.get(date) ?? [];
    current.push(event);
    map.set(date, current);
    return map;
  }, new Map<string, OperationsTimelineEvent[]>()));

  return (
    <div className="timeline-list-view">
      {groups.length === 0 ? <div className="timeline-empty-state"><CalendarDays size={28} /><strong>Không có sự kiện</strong><span>Không có lịch phù hợp với bộ lọc hiện tại.</span></div> : groups.map(([date, dayEvents]) => (
        <section className="timeline-list-group" key={date}>
          <header><h3>{formatDateHeading(date)}</h3><span>{dayEvents.length} sự kiện</span></header>
          <div>{dayEvents.map((event) => <TimelineEventCard key={`${event.eventType}-${event.eventId}`} event={event} conflict={hasTimelineConflict(event, events)} compact onSelect={onSelect} />)}</div>
        </section>
      ))}
    </div>
  );
};

interface EventModalProps {
  event: OperationsTimelineEvent;
  conflicts: OperationsTimelineEvent[];
  onClose: () => void;
}

interface BookingDetailItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
}

const BookingDetailItem = ({ icon, label, value, secondary }: BookingDetailItemProps) => (
  <div className="booking-detail-item">
    <span className="booking-detail-item-icon" aria-hidden="true">{icon}</span>
    <div>
      <span className="booking-detail-label">{label}</span>
      <strong>{value}</strong>
      {secondary && <small>{secondary}</small>}
    </div>
  </div>
);

const TimelineEventModal = ({ event, conflicts, onClose }: EventModalProps) => {
  const isBooking = event.eventType === 'BOOKING';
  const selectedSpace = timelineSpaces.find((space) => space.id === event.spaceId);
  const detailStatus = detailStatusLabels[event.status] ?? event.status;
  const statusIcon = event.status === 'CONFIRMED'
    ? <CheckCircle2 size={17} />
    : event.status === 'PENDING_APPROVAL'
      ? <Clock3 size={17} />
      : <TriangleAlert size={17} />;

  return (
    <div className="operation-modal-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
      <section className={`operation-detail-modal timeline-event-modal ${isBooking ? 'booking-detail-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="timeline-event-detail-title">
        {isBooking ? (
          <>
            <header className="booking-detail-header">
              <div>
                <span className="operation-modal-eyebrow">CHI TIẾT BOOKING</span>
                <div className="booking-detail-title-row">
                  <h2 id="timeline-event-detail-title">{event.title}</h2>
                  <span className={`booking-status-pill booking-status-${event.status.toLowerCase()}`}>{statusIcon}{detailStatus}</span>
                </div>
                <small>Booking #{event.displayCode}</small>
              </div>
              <button type="button" className="operation-icon-button booking-detail-close" onClick={onClose} aria-label="Đóng"><X size={21} /></button>
            </header>
            <div className="booking-detail-separator" />
            <div className="booking-detail-grid">
              <BookingDetailItem icon={<DoorOpen size={21} />} label="Không gian" value={event.spaceName} secondary={selectedSpace?.location} />
              <BookingDetailItem icon={<CalendarDays size={21} />} label="Ngày sử dụng" value={formatDateOnly(event.startTime)} />
              <BookingDetailItem icon={<Clock3 size={21} />} label="Thời gian" value={`${formatTime(event.startTime)} – ${formatTime(event.endTime)}`} />
              <BookingDetailItem icon={<UserRound size={21} />} label="Người đặt" value={event.participantName ?? '—'} />
              <BookingDetailItem icon={<UsersRound size={21} />} label="Số người" value={event.participantCount !== undefined ? `${event.participantCount} người` : '—'} />
              <BookingDetailItem icon={<Target size={21} />} label="Mục đích" value={event.purpose} />
              <BookingDetailItem icon={<Armchair size={21} />} label="Bàn / ghế" value={event.tableLabel ?? '—'} />
            </div>
            <div className="booking-detail-separator" />
            <section className="booking-system-info" aria-label="Thông tin hệ thống">
              <div className="booking-system-heading"><FileText size={18} /><span>THÔNG TIN HỆ THỐNG</span></div>
              <div className="booking-system-grid">
                <div className="booking-system-item"><span className="booking-system-item-icon" aria-hidden="true"><Clock3 size={15} /></span><div><span>Tạo lúc:</span><strong>{formatDateTime(event.createdAt)}</strong></div></div>
                <div className="booking-system-item"><span className="booking-system-item-icon" aria-hidden="true"><FileText size={15} /></span><div><span>Mã booking:</span><strong>{event.displayCode}</strong></div></div>
              </div>
            </section>
            {conflicts.length > 0 && <div className="operation-detail-note timeline-conflict-note"><TriangleAlert size={17} /><span>Đang xung đột với: {conflicts.map((item) => `${item.displayCode} (${formatTime(item.startTime)}–${formatTime(item.endTime)})`).join(', ')}</span></div>}
          </>
        ) : (
          <>
            <header>
              <div>
                <span className="operation-modal-eyebrow">CHI TIẾT BẢO TRÌ</span>
                <h2 id="timeline-event-detail-title">{event.title}</h2>
                <small>{event.displayCode} · {eventTypeLabels[event.eventType]}</small>
              </div>
              <button type="button" className="operation-icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button>
            </header>
            <div className="operation-detail-grid">
              <div><span>Phòng</span><strong>{event.spaceName}</strong></div>
              <div><span>Thời gian</span><strong>{formatDateTime(event.startTime)} – {formatTime(event.endTime)}</strong></div>
              <div><span>Status</span><strong>{statusLabels[event.status] ?? event.status}</strong></div>
              <div><span>Lý do</span><strong>{event.reason ?? event.purpose}</strong></div>
              <div><span>Người tạo</span><strong>{event.createdBy}</strong></div>
              <div><span>Created at</span><strong>{formatDateTime(event.createdAt)}</strong></div>
            </div>
            {conflicts.length > 0 && <div className="operation-detail-note timeline-conflict-note"><TriangleAlert size={17} /><span>Đang xung đột với: {conflicts.map((item) => `${item.displayCode} (${formatTime(item.startTime)}–${formatTime(item.endTime)})`).join(', ')}</span></div>}
            <footer><button type="button" className="operation-secondary-button" onClick={onClose}>Đóng</button></footer>
          </>
        )}
      </section>
    </div>
  );
};

export const TimelinePage = () => {
  const defaultSpaceId = timelineSpaces[1]?.id ?? timelineSpaces[0]?.id ?? 1;
  const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpaceId);
  const [selectedDate, setSelectedDate] = useState(sampleDate);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(sampleDate));
  const [fromDate, setFromDate] = useState(sampleFrom);
  const [toDate, setToDate] = useState(sampleTo);
  const [eventType, setEventType] = useState<TimelineEventType | ''>('');
  const [status, setStatus] = useState('');
  const [spaceSearch, setSpaceSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [appliedQuery, setAppliedQuery] = useState<TimelineQuery>({ spaceId: defaultSpaceId, from: sampleFrom, to: sampleTo });
  const [events, setEvents] = useState<OperationsTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<OperationsTimelineEvent | null>(null);

  const loadTimeline = useCallback(async (query: TimelineQuery, mode: LoadMode = 'loading') => {
    if (mode === 'refreshing') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setEvents(await getMockTimeline(query));
    } catch {
      setError('Không thể tải timeline. Vui lòng thử lại.');
    } finally {
      if (mode === 'refreshing') setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimeline(appliedQuery);
  }, [appliedQuery, loadTimeline]);

  const selectedSpace = timelineSpaces.find((space) => space.id === selectedSpaceId) ?? timelineSpaces[0];
  const visibleSpaces = useMemo(() => {
    const keyword = spaceSearch.trim().toLocaleLowerCase('vi-VN');
    return keyword
      ? timelineSpaces.filter((space) => `${space.name} ${space.location ?? ''}`.toLocaleLowerCase('vi-VN').includes(keyword))
      : timelineSpaces;
  }, [spaceSearch]);

  const monthCells = useMemo(() => {
    const leadingDays = (calendarMonth.getDay() + 6) % 7;
    const totalDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells: Array<string | null> = Array.from({ length: leadingDays }, () => null);
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      cells.push(toDateInput(date));
    }
    return cells;
  }, [calendarMonth]);

  const weekDates = useMemo(() => {
    const monday = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [selectedDate]);

  const dayEvents = useMemo(() => events.filter((event) => eventDate(event) === selectedDate), [events, selectedDate]);

  const conflictEvents = useMemo(() => selectedEvent ? events.filter((event) => overlaps(selectedEvent, event)) : [], [events, selectedEvent]);

  const selectSpace = (spaceId: number) => {
    setSelectedSpaceId(spaceId);
    const nextQuery = { ...appliedQuery, spaceId };
    setAppliedQuery(nextQuery);
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setCalendarMonth(startOfMonth(date));
  };

  const openDay = (date: string) => {
    selectDate(date);
    setViewMode('day');
  };

  const moveMonth = (amount: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const applyFilters = () => {
    if (fromDate > toDate) {
      setValidationError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
      return;
    }
    setValidationError('');
    const query: TimelineQuery = { spaceId: selectedSpaceId, from: fromDate, to: toDate, eventType, status };
    setAppliedQuery(query);
    if (selectedDate < fromDate || selectedDate > toDate) selectDate(fromDate);
  };

  const resetFilters = () => {
    const today = toDateInput(new Date());
    const nextWeek = addDays(today, 6);
    const firstSpaceId = timelineSpaces[0]?.id ?? 1;
    const query: TimelineQuery = { spaceId: firstSpaceId, from: today, to: nextWeek };
    setSelectedSpaceId(firstSpaceId);
    setFromDate(today);
    setToDate(nextWeek);
    setEventType('');
    setStatus('');
    setSelectedDate(today);
    setCalendarMonth(startOfMonth(today));
    setViewMode('day');
    setValidationError('');
    setAppliedQuery(query);
  };

  const reload = () => {
    if (!loading && !refreshing) void loadTimeline(appliedQuery, 'refreshing');
  };

  return (
    <main className="calendar-timeline-page">
      <header className="calendar-page-header">
        <div>
          <h1>Timeline hoạt động</h1>
          <p>Theo dõi lịch đặt chỗ và bảo trì của từng không gian.</p>
        </div>
        <button type="button" className="calendar-reload-button" onClick={reload} disabled={loading || refreshing}>
          <RefreshCw size={15} className={loading || refreshing ? 'operation-spin' : ''} />
          {refreshing ? 'Đang tải...' : 'Tải lại'}
        </button>
      </header>

      <section className="calendar-filter-panel" aria-label="Bộ lọc timeline">
        <label className="calendar-filter-field calendar-space-filter">
          <span>Không gian</span>
          <select value={selectedSpaceId} onChange={(event) => selectSpace(Number(event.target.value))} disabled={loading || refreshing}>
            {timelineSpaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
          </select>
        </label>
        <label className="calendar-filter-field">
          <span>Từ ngày</span>
          <div className="calendar-date-field"><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><CalendarDays size={14} /></div>
        </label>
        <label className="calendar-filter-field">
          <span>Đến ngày</span>
          <div className="calendar-date-field"><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /><CalendarDays size={14} /></div>
        </label>
        <label className="calendar-filter-field">
          <span>Loại sự kiện</span>
          <select value={eventType} onChange={(event) => setEventType(event.target.value as TimelineEventType | '')}>
            <option value="">Tất cả</option><option value="BOOKING">Booking</option><option value="MAINTENANCE">Bảo trì</option>
          </select>
        </label>
        <label className="calendar-filter-field">
          <span>Trạng thái</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả</option>
            {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="calendar-filter-actions">
          <button type="button" className="calendar-apply-button" onClick={applyFilters} disabled={loading || refreshing}>Áp dụng</button>
          <button type="button" className="calendar-reset-button" onClick={resetFilters} disabled={loading || refreshing}>Đặt lại</button>
        </div>
      </section>
      {validationError && <div className="calendar-filter-error" role="alert">{validationError}</div>}

      <div className="calendar-workspace">
        <aside className="calendar-sidebar-card">
          <section className="mini-calendar">
            <div className="mini-calendar-header">
              <strong>{formatMonth(calendarMonth)}</strong>
              <div><button type="button" aria-label="Tháng trước" onClick={() => moveMonth(-1)}><ChevronLeft size={15} /></button><button type="button" aria-label="Tháng sau" onClick={() => moveMonth(1)}><ChevronRight size={15} /></button></div>
            </div>
            <div className="mini-calendar-grid mini-calendar-weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
            <div className="mini-calendar-grid mini-calendar-days">
              {monthCells.map((date, index) => date ? <button type="button" key={date} className={selectedDate === date ? 'is-selected' : ''} onClick={() => selectDate(date)}>{parseDateInput(date).getDate()}</button> : <span key={`empty-${index}`} />)}
            </div>
          </section>

          <section className="space-picker">
            <h2>Danh sách không gian</h2>
            <label className="space-search-field"><Search size={15} /><input value={spaceSearch} onChange={(event) => setSpaceSearch(event.target.value)} placeholder="Tìm kiếm không gian..." /></label>
            <div className="space-list">
              {visibleSpaces.map((space: OperationsSpace) => <button type="button" key={space.id} className={`space-list-item ${space.id === selectedSpaceId ? 'is-active' : ''}`} onClick={() => selectSpace(space.id)}>
                <span className={`space-thumbnail ${space.tone ?? ''}`}><Building2 size={18} /></span>
                <span><strong>{space.name}</strong><small>{space.location}</small></span>
              </button>)}
            </div>
          </section>
        </aside>

        <section className="schedule-card">
          <header className="schedule-card-header">
            <div><h2>{viewMode === 'week' ? `Tuần ${formatDateOnly(`${weekDates[0]}T00:00:00`)} – ${formatDateOnly(`${weekDates[6]}T00:00:00`)}` : formatDateHeading(selectedDate)}</h2><span>{selectedSpace?.name}</span></div>
            <div className="schedule-view-switcher" role="group" aria-label="Chế độ xem">
              {([['day', 'Ngày'], ['week', 'Tuần'], ['list', 'Danh sách']] as const).map(([value, label]) => <button type="button" key={value} className={viewMode === value ? 'is-active' : ''} onClick={() => setViewMode(value)}>{label}</button>)}
            </div>
          </header>

          {loading ? <div className="timeline-state-card"><div className="operation-spinner" /><strong>Đang tải timeline...</strong></div> : error ? <div className="timeline-state-card timeline-state-error"><strong>{error}</strong><button type="button" onClick={() => void loadTimeline(appliedQuery)}>Thử lại</button></div> : (
            <div className="timeline-view-content">
              {viewMode === 'day' && <DayTimeline events={dayEvents} allEvents={events} onSelect={setSelectedEvent} />}
              {viewMode === 'week' && <WeekTimeline dates={weekDates} events={events} selectedDate={selectedDate} onSelect={setSelectedEvent} onDateSelect={openDay} />}
              {viewMode === 'list' && <ListTimeline events={events} onSelect={setSelectedEvent} />}
            </div>
          )}
        </section>
      </div>

      {selectedEvent && <TimelineEventModal event={selectedEvent} conflicts={conflictEvents} onClose={() => setSelectedEvent(null)} />}
    </main>
  );
};
