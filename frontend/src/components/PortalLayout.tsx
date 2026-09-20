import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom'; // Thêm Outlet
import api from '../services/api';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  ScanLine,
  Settings,
} from 'lucide-react';

interface PortalLayoutProps {
  /** Used by standalone pages that render the layout directly. */
  children?: ReactNode;
  /** Optional title override for standalone pages. */
  pageTitle?: string;
}

export const PortalLayout = ({ children, pageTitle }: PortalLayoutProps) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<string>('student@eduspace.vn');
  const [currentName, setCurrentName] = useState<string>('Nguyễn Văn An');
  const [shortName, setShortName] = useState<string>('An');
  const [currentInitials, setCurrentInitials] = useState<string>('AN');
  const [userRoleLabel, setUserRoleLabel] = useState<string>('Sinh viên');
  const [currentRole, setCurrentRole] = useState<'STUDENT' | 'STAFF' | 'ADMIN'>('STUDENT');
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);

  useEffect(() => {
    const savedDemoUser = localStorage.getItem('eduspace_demo_user');
    const savedProfile = localStorage.getItem('eduspace_user');
    let savedUser = savedDemoUser;
    if (!savedUser && savedProfile) {
      try {
        savedUser = JSON.parse(savedProfile).email ?? '';
      } catch {
        savedUser = '';
      }
    }
    if (savedUser) {
      setCurrentUser(savedUser);
      updateUserMeta(savedUser);
    } else {
      switchUser('student@eduspace.vn');
    }
  }, []);

  const updateUserMeta = (email: string) => {
    if (email.includes('khanhvan')) {
      setCurrentName('Nguyễn Thị Khánh Vân');
      setShortName('Vân');
      setCurrentInitials('KV');
      setUserRoleLabel('Sinh viên');
      setCurrentRole('STUDENT');
    } else if (email.includes('student') || email.includes('tan') || email.includes('an')) {
      setCurrentName('Nguyễn Văn An');
      setShortName('An');
      setCurrentInitials('AN');
      setUserRoleLabel('Sinh viên');
      setCurrentRole('STUDENT');
    } else if (email.includes('staff')) {
      setCurrentName('Nguyễn Thị Kim Tuyến');
      setShortName('Tuyến');
      setCurrentInitials('KT');
      setUserRoleLabel('Nhân viên Staff');
      setCurrentRole('STAFF');
    } else {
      setCurrentName('Quản trị viên');
      setShortName('Admin');
      setCurrentInitials('AD');
      setUserRoleLabel('Quản trị');
      setCurrentRole('ADMIN');
    }
  };

  const switchUser = async (email: string) => {
    try {
      const res = await api.post<{ token: string }>('/api/auth/login', {
        email,
        password: 'password'
      }).catch(async () => {
        return await api.post<{ token: string }>('/api/auth/login', {
          email,
          password: '123456'
        });
      });
      if (res?.data?.token) {
        localStorage.setItem('eduspace_token', res.data.token);
      }
    } catch {
      // Fallback
    } finally {
      localStorage.setItem('eduspace_demo_user', email);
      const role = email.includes('staff') ? 'STAFF' : email.includes('student') || email.includes('khanhvan') ? 'STUDENT' : 'ADMIN';
      localStorage.setItem('eduspace_user', JSON.stringify({
        id: role === 'ADMIN' ? 1 : role === 'STAFF' ? 11 : 101,
        email,
        fullName: role === 'ADMIN' ? 'Admin' : role === 'STAFF' ? 'Nguyễn Thị Kim Tuyến' : 'Nguyễn Văn An',
        role,
      }));
      setCurrentUser(email);
      updateUserMeta(email);
      setShowRoleDropdown(false);
      window.dispatchEvent(new Event('user-switched'));
    }
  };

  // Tự động tạo Tiêu đề trang dựa trên URL hiện tại
  const getPageTitle = (path: string) => {
    if (path.includes('/spaces')) return 'Tìm không gian';
    if (path.includes('/my-bookings')) return 'Lịch đặt của tôi';
    if (path.includes('/staff/timeline')) return 'Vận hành / Timeline hoạt động';
    if (path.includes('/staff/audit-logs')) return 'Vận hành / Nhật ký kiểm toán';
    if (path.includes('/core-approval') || path === '/staff') return 'Duyệt đặt chỗ (Staff)';
    if (path.includes('/admin')) return 'Quản trị hệ thống';
    return 'EduSpace Dashboard';
  };

  const dynamicPageTitle = pageTitle ?? getPageTitle(location.pathname);

  const studentNavItems = [
    {
      to: '/spaces',
      label: 'Tìm không gian',
      icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
      )
    },
    {
      to: '/my-bookings',
      label: 'Lịch đặt của tôi',
      icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
      )
    },
    {
      to: '/core-approval',
      label: 'Duyệt đặt chỗ (Staff)',
      icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
          </svg>
      )
    }
  ];

  const operationsNavItems = [
    { to: '/', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { to: '/staff/timeline', label: 'Timeline hoạt động', icon: <CalendarDays size={20} /> },
    { to: '/staff/audit-logs', label: 'Nhật ký kiểm toán', icon: <FileClock size={20} /> },
    { to: '/staff', label: 'Duyệt đặt chỗ', icon: <ClipboardCheck size={20} /> },
    { to: '/qr', label: 'Check-in', icon: <ScanLine size={20} /> },
    { to: '/spaces', label: 'Không gian học tập', icon: <Building2 size={20} /> },
    ...(currentRole === 'ADMIN' ? [{ to: '/admin/policy', label: 'Cài đặt', icon: <Settings size={20} /> }] : []),
  ];
  const navItems = currentRole === 'STUDENT' ? studentNavItems : operationsNavItems;

  return (
      <div className="portal-container">
        {/* 1. SIDEBAR DỌC */}
        <aside className="portal-sidebar-wide">
          {/* Logo EduSpace */}
          <Link to="/spaces" className="sidebar-brand-box">
            <div className="sidebar-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-name">EduSpace</span>
              <span className="brand-desc">Quản lý không gian học</span>
            </div>
          </Link>

          {/* Khối Vai Trò */}
          <div className="sidebar-role-card">
            <span className="role-label-tiny">VAI TRÒ</span>
            <span className="role-badge-pill">{userRoleLabel}</span>
          </div>

          {/* Navigation Items (Icon + Text) */}
          <nav className="sidebar-wide-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
                || (item.to === '/spaces' && location.pathname.startsWith('/spaces/'))
                || (item.to === '/staff/timeline' && location.pathname.startsWith('/staff/timeline'))
                || (item.to === '/staff/audit-logs' && location.pathname.startsWith('/staff/audit-logs'));
              return (
                  <Link
                      key={item.to}
                      to={item.to}
                      className={`sidebar-wide-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-text">{item.label}</span>
                  </Link>
              );
            })}
          </nav>

          {/* User Profile Bottom */}
          <div className="sidebar-profile-bottom">
            <div
                className="user-profile-trigger"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <div className="profile-user-left">
                <div className="profile-avatar-circle">
                  {currentInitials}
                </div>
                <div className="profile-info-col">
                  <span className="profile-fullname">{currentName}</span>
                  <span className="profile-role-sub">{userRoleLabel}</span>
                </div>
              </div>
              <svg className="profile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {showRoleDropdown && (
                <div className="sidebar-role-dropdown">
                  <p className="dropdown-title">Chuyển đổi vai trò Demo</p>
                  <button
                      className={`role-option-btn ${currentUser === 'student@eduspace.vn' ? 'selected' : ''}`}
                      onClick={() => switchUser('student@eduspace.vn')}
                  >
                    <span>👨‍🎓 <strong>Nguyễn Văn An</strong> (Sinh viên)</span>
                    {currentUser === 'student@eduspace.vn' && <span>✓</span>}
                  </button>
                  <button
                      className={`role-option-btn ${currentUser === 'khanhvan@eduspace.vn' ? 'selected' : ''}`}
                      onClick={() => switchUser('khanhvan@eduspace.vn')}
                  >
                    <span>👩‍🎓 <strong>Khánh Vân</strong> (Sinh viên)</span>
                    {currentUser === 'khanhvan@eduspace.vn' && <span>✓</span>}
                  </button>
                  <button
                      className={`role-option-btn ${currentUser === 'staff@eduspace.vn' ? 'selected' : ''}`}
                      onClick={() => switchUser('staff@eduspace.vn')}
                  >
                    <span>🛡️ <strong>Kim Tuyến</strong> (Staff duyệt)</span>
                    {currentUser === 'staff@eduspace.vn' && <span>✓</span>}
                  </button>
                  <button
                      className={`role-option-btn ${currentUser === 'admin@eduspace.vn' ? 'selected' : ''}`}
                      onClick={() => switchUser('admin@eduspace.vn')}
                  >
                    <span>⚙️ <strong>Admin</strong> (Quản trị hệ thống)</span>
                    {currentUser === 'admin@eduspace.vn' && <span>✓</span>}
                  </button>
                </div>
            )}
          </div>
        </aside>

        {/* 2. MAIN WORKSPACE */}
        <div className="portal-main-area">
          {/* Top Header Bar */}
          <header className="portal-top-bar">
            <div className="top-bar-left">
              <button className="top-bar-menu-btn" type="button" aria-label="Menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="7" x2="20" y2="7"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="17" x2="20" y2="17"></line>
                </svg>
              </button>
              <h2 className="top-bar-title">{dynamicPageTitle}</h2>
            </div>

            <div className="top-bar-right">
              <div className="header-greeting-box">
              <span className="greeting-text">
                Chào, <strong>{shortName}</strong>
              </span>
                <div className="header-avatar-circle">
                  {currentInitials}
                </div>
              </div>
            </div>
          </header>

          {/* Content Canvas */}
          <div className="portal-content-canvas">
            {/* Nested routes render through Outlet; standalone pages can provide children. */}
            {children ?? <Outlet />}
          </div>
        </div>
      </div>
  );
};
