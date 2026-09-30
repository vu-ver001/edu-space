import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { DynamicIcon } from '../../helper/DynamicIcon.tsx';
import { ROLE_NAV_ITEMS, isNavActive, ADMIN_BASE, STAFF_BASE, STUDENT_SPACES_PATH } from '../../config/roleNavigation.tsx';
import type { AppRole, NavItem } from '../../config/roleNavigation.tsx';
import './PortalLayout.css';
import { ChangePasswordModal } from '../../features/admin/components/ChangePasswordModal.tsx';

const VALID_ROLES: AppRole[] = ['ADMIN', 'STAFF', 'STUDENT'];

// Key tùy biến UI theo role → route, dùng để override nhãn/icon mà không phụ thuộc text label.
const UI_OVERRIDES: Record<AppRole, { to: string; labelKey?: string; iconKey?: string }[]> = {
  ADMIN: [
    { to: `${ADMIN_BASE}/stats`, labelKey: 'adminStatsLabel', iconKey: 'adminStatsIcon' },
    { to: `${ADMIN_BASE}/users`, labelKey: 'adminUsersLabel', iconKey: 'adminUsersIcon' },
  ],
  STAFF: [
    { to: STAFF_BASE, labelKey: 'staffHomeLabel', iconKey: 'staffHomeIcon' },
    { to: `${STAFF_BASE}/approvals`, labelKey: 'staffApproveLabel', iconKey: 'staffApproveIcon' },
  ],
  STUDENT: [{ to: STUDENT_SPACES_PATH, labelKey: 'stuSpaceLabel', iconKey: 'stuSpaceIcon' }],
};

export const PortalLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [user, setUser] = useState<{ id: number, email: string, fullName: string, role: string } | null>(null);
  const [uiSettings, setUiSettings] = useState<any>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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

  const getInitials = (name?: string) => {
    if (!name) return 'KT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
    setShowProfileMenu(false);
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar-bottom-profile')) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showProfileMenu]);

  if (!user) return null;

  const renderIcon = (customIcon: any, defaultIcon: ReactNode) => {
    if (!customIcon) return defaultIcon;
    if (typeof customIcon === 'string') return <DynamicIcon iconData={customIcon} />;
    return customIcon;
  };

  // Menu lấy từ nguồn dùng chung theo role; lọc theo allowedRoles để tự ẩn khi config lệch.
  const getNavItems = (): NavItem[] => {
    const role = user.role as AppRole;
    const overrides = UI_OVERRIDES[role] ?? [];
    return ROLE_NAV_ITEMS[role]
      .filter((item) => item.allowedRoles.includes(role))
      .map((item) => {
        const override = overrides.find((o) => o.to === item.to);
        if (!override) return item;
        const label = override.labelKey ? uiSettings[override.labelKey] : undefined;
        const iconKey = override.iconKey ? uiSettings[override.iconKey] : undefined;
        if (!label && !iconKey) return item;
        return {
          ...item,
          label: label || item.label,
          icon: renderIcon(iconKey, item.icon),
        };
      });
  };

  if (!VALID_ROLES.includes(user.role as AppRole)) {
    return <Navigate to="/403" replace />;
  }

  const navItems = getNavItems();
  const initials = getInitials(user.fullName);

  return (
      <div className="portal-container">
        {/* SIDEBAR */}
        <aside className={`portal-sidebar-wide ${isCollapsed ? 'collapsed' : ''}`}>

          {/* KHỐI TRÊN: LOGO & MENU */}
          <div className="sidebar-top-section">
            <div className="sidebar-brand-box">
              <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <Link to="/" className="brand-link">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                <span className="brand-name">{uiSettings.appName || 'EduSpace'}</span>
              </Link>
            </div>

            <nav className="sidebar-wide-nav" aria-label="Điều hướng theo vai trò">
              {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    aria-label={item.label}
                    className={() => `sidebar-wide-item ${isNavActive(item, pathname) ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-text">{item.label}</span>
                  </NavLink>
              ))}
            </nav>
          </div>

          {/* KHỐI DƯỚI: PROFILE NGƯỜI DÙNG */}
          <div className="sidebar-bottom-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="profile-avatar-circle">
              {initials}
            </div>

            <div className="profile-info-box">
              <span className="profile-name">{user.fullName}</span>
              <span className="profile-role">{user.role === 'STAFF' ? 'Staff' : user.role === 'ADMIN' ? 'Admin' : 'Sinh viên'}</span>
            </div>

            {!isCollapsed && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            )}

            {/* POPUP DROPDOWN (Bật sang phải) */}
            {showProfileMenu && (
                <div className="profile-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-profile-header">
                    <div className="dropdown-large-avatar">
                      {initials}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                      <strong style={{color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{user.fullName}</strong>
                      <span style={{fontSize: '0.8rem', color: '#64748b'}}>{user.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-actions">
                    <button className="dropdown-action-btn" onClick={handleChangePassword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>Thay đổi mật khẩu</button>
                    <button className="dropdown-action-btn" onClick={handleLogout}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Đăng xuất</button>
                  </div>
                </div>
            )}
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <div className="portal-main-area">
          <div className="portal-content-canvas">
            <Outlet />
          </div>
        </div>

        <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
  );
};
