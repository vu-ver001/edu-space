import type { ReactNode } from 'react';
import {
  Home,
  Users,
  LayoutGrid,
  Armchair,
  Tag,
  CalendarDays,
  ShieldCheck,
  Sliders,
  FileText,
  CheckSquare,
  UserCheck,
  Wrench,
  Search,
} from 'lucide-react';

export type AppRole = 'ADMIN' | 'STAFF' | 'STUDENT';

export const ADMIN_BASE = import.meta.env.VITE_ROUTE_ADMIN || '/admin';
export const STAFF_BASE = import.meta.env.VITE_ROUTE_STAFF || '/staff';
export const STUDENT_SPACES_PATH = '/student/spaces';
export const STUDENT_BOOKINGS_PATH = '/student/my-bookings';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Prefix routes that keep this item active (e.g. detail pages). */
  activeMatch?: string[];
  /** Roles allowed to see/use this item (mirrors App.tsx ProtectedRoute). */
  allowedRoles: AppRole[];
  /** Chỉ khớp chính xác, không active khi vào trang con (dùng cho route gốc). */
  exact?: boolean;
}

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.to;
  if (pathname === item.to) return true;
  return (item.activeMatch ?? []).some((prefix) => pathname.startsWith(prefix));
}

export function getNavItemsForRole(role: AppRole): NavItem[] {
  return ROLE_NAV_ITEMS[role].filter((item) => item.allowedRoles.includes(role));
}

export const ROLE_NAV_ITEMS: Record<AppRole, NavItem[]> = {
  ADMIN: [
    { to: `${ADMIN_BASE}/stats`, label: 'Trang chủ', icon: <Home size={19} />, allowedRoles: ['ADMIN'], exact: true },
    { to: `${ADMIN_BASE}/users`, label: 'Quản lý người dùng', icon: <Users size={19} />, allowedRoles: ['ADMIN'] },
    {
      to: `${ADMIN_BASE}/spaces`,
      label: 'Quản lý không gian',
      icon: <LayoutGrid size={19} />,
      activeMatch: [`${ADMIN_BASE}/spaces/`],
      allowedRoles: ['ADMIN'],
    },
    { to: `${ADMIN_BASE}/facilities`, label: 'Quản lý tiện ích', icon: <Armchair size={19} />, allowedRoles: ['ADMIN'] },
    {
      to: `${ADMIN_BASE}/space-types`,
      label: 'Loại không gian',
      icon: <Tag size={19} />,
      activeMatch: [`${ADMIN_BASE}/space-types/`],
      allowedRoles: ['ADMIN'],
    },
    { to: `${STAFF_BASE}/timeline`, label: 'Timeline hoạt động', icon: <CalendarDays size={19} />, allowedRoles: ['ADMIN', 'STAFF'] },
    { to: `${STAFF_BASE}/audit-logs`, label: 'Nhật ký kiểm toán', icon: <FileText size={19} />, allowedRoles: ['ADMIN', 'STAFF'] },
    // Lịch sử chính sách (/admin/policy/history) mở từ trang Cấu hình, không chiếm mục sidebar riêng.
    {
      to: `${ADMIN_BASE}/policy`,
      label: 'Cấu hình chính sách',
      icon: <ShieldCheck size={19} />,
      activeMatch: [`${ADMIN_BASE}/policy/`],
      allowedRoles: ['ADMIN'],
    },
    { to: `${ADMIN_BASE}/settings-general`, label: 'Cài đặt chung', icon: <Sliders size={19} />, allowedRoles: ['ADMIN'] },
  ],
  STAFF: [
    { to: STAFF_BASE, label: 'Trang chủ', icon: <Home size={19} />, allowedRoles: ['STAFF', 'ADMIN'], exact: true },
    { to: `${STAFF_BASE}/approvals`, label: 'Duyệt đặt chỗ', icon: <CheckSquare size={19} />, allowedRoles: ['STAFF', 'ADMIN'] },
    { to: `${STAFF_BASE}/checkin`, label: 'Hỗ trợ check-in', icon: <UserCheck size={19} />, allowedRoles: ['STAFF', 'ADMIN'] },
    { to: `${STAFF_BASE}/timeline`, label: 'Timeline hoạt động', icon: <CalendarDays size={19} />, allowedRoles: ['STAFF', 'ADMIN'] },
    { to: `${STAFF_BASE}/maintenance`, label: 'Bảo trì', icon: <Wrench size={19} />, allowedRoles: ['STAFF', 'ADMIN'] },
    { to: `${STAFF_BASE}/audit-logs`, label: 'Nhật ký kiểm toán', icon: <FileText size={19} />, allowedRoles: ['STAFF', 'ADMIN'] },
  ],
  STUDENT: [
    {
      to: STUDENT_SPACES_PATH,
      label: 'Tìm & Đặt phòng',
      icon: <Search size={19} />,
      activeMatch: [`${STUDENT_SPACES_PATH}/`],
      allowedRoles: ['STUDENT'],
    },
    { to: STUDENT_BOOKINGS_PATH, label: 'Lịch đặt của tôi', icon: <CalendarDays size={19} />, allowedRoles: ['STUDENT'] },
  ],
};
