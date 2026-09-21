import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate, Link } from 'react-router-dom';
import { DynamicIcon } from '../../helper/DynamicIcon.tsx';
import './PortalLayout.css';

const ADMIN_BASE = import.meta.env.VITE_ROUTE_ADMIN || '/admin';
const STAFF_BASE = import.meta.env.VITE_ROUTE_STAFF || '/staff';
const STUDENT_BASE = import.meta.env.VITE_ROUTE_STUDENT || '/home';

export const PortalLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<{ id: number, email: string, fullName: string, role: string } | null>(null);
  const [uiSettings, setUiSettings] = useState<any>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('eduspace_user') || localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
    else navigate('/login');

    const savedSettings = localStorage.getItem('eduspace_ui_settings');
    if (savedSettings) setUiSettings(JSON.parse(savedSettings));
  }, [navigate]);

  const handleLogout = () => {
    ['eduspace_token', 'token', 'accessToken', 'eduspace_user', 'user'].forEach(key => localStorage.removeItem(key));
    navigate('/login');
  };

  if (!user) return null;

  const getNavItems = () => {
    if (user.role === 'ADMIN') {
      return [
        { to: `${ADMIN_BASE}/stats`, label: uiSettings.adminStatsLabel || 'Trang chủ', icon: uiSettings.adminStatsIcon || '🏠' },
        { to: `${ADMIN_BASE}/users`, label: uiSettings.adminUsersLabel || 'Quản lý người dùng', icon: uiSettings.adminUsersIcon || '👥' },
        { to: `${ADMIN_BASE}/spaces`, label: 'Quản lý không gian', icon: '🏢' },
        { to: `${ADMIN_BASE}/policy`, label: 'Cấu hình chính sách', icon: '⚙️' },
        { to: `${ADMIN_BASE}/settings-general`, label: 'Cài đặt chung', icon: '🎨' }
      ];
    }
    if (user.role === 'STAFF') {
      return [
        { to: STAFF_BASE, label: uiSettings.staffHomeLabel || 'Trang chủ', icon: uiSettings.staffHomeIcon || '🏠' },
        { to: `${STAFF_BASE}/approvals`, label: uiSettings.staffApproveLabel || 'Duyệt đặt chỗ', icon: uiSettings.staffApproveIcon || '✅' },
        { to: `${STAFF_BASE}/maintenance`, label: 'Tạo bảo trì', icon: '🛠️' },
        { to: `${STAFF_BASE}/checkin`, label: 'Hỗ trợ Check-in', icon: '📍' }
      ];
    }
    return [
      { to: STUDENT_BASE, label: uiSettings.stuHomeLabel || 'Trang chủ', icon: uiSettings.stuHomeIcon || '🏠' },
      { to: '/spaces', label: uiSettings.stuSpaceLabel || 'Tìm & Đặt phòng', icon: uiSettings.stuSpaceIcon || '🔍' },
      { to: '/my-bookings', label: 'Lịch đặt của tôi', icon: '📅' },
      { to: '/checkin', label: 'Tự Check-in', icon: '📍' },
      { to: '/waitlist', label: 'Danh sách chờ', icon: '⏳' }
    ];
  };

  const navItems = getNavItems();
  const currentItem = navItems.find(item => location.pathname.startsWith(item.to) && item.to !== '/');
  const pageTitle = currentItem ? currentItem.label : (uiSettings.appName || 'EduSpace Portal');

  return (
      <div className="portal-container">
        {/* SIDEBAR TÁCH NHỎ */}
        <aside className={`portal-sidebar-wide ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand-box">
            <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <Link to="/" className="brand-link">
              <DynamicIcon iconData={uiSettings.logoIcon || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'} />
              <span className="brand-name">{uiSettings.appName || 'EduSpace'}</span>
            </Link>
          </div>
          <nav className="sidebar-wide-nav">
            {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === STAFF_BASE || item.to === `${ADMIN_BASE}/stats` || item.to === STUDENT_BASE} className={({ isActive }) => `sidebar-wide-item ${isActive ? 'active' : ''}`} title={isCollapsed ? item.label : ""}>
                  <span className="nav-item-icon"><DynamicIcon iconData={item.icon} /></span>
                  <span className="nav-item-text">{item.label}</span>
                </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN WORKSPACE */}
        <div className="portal-main-area">
          <header className="portal-top-bar">
            <h2 className="top-bar-title">{pageTitle}</h2>
            <div className="header-greeting-box" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="header-avatar-circle">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span>{user.fullName.toUpperCase()}</span>
              <svg className="chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              {showProfileMenu && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-profile-header">
                      <div className="dropdown-large-avatar"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
                      <div className="dropdown-profile-name">{user.fullName.toUpperCase()}</div>
                    </div>
                    <div className="dropdown-actions">
                      <button className="dropdown-action-btn" onClick={(e) => e.stopPropagation()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>Thay đổi mật khẩu</button>
                      <button className="dropdown-action-btn" onClick={handleLogout}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Đăng xuất</button>
                    </div>
                  </div>
              )}
            </div>
          </header>
          <div className="portal-content-canvas">
            <Outlet />
          </div>
        </div>
      </div>
  );
};