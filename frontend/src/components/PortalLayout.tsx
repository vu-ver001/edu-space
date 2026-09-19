import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom'; // Thêm Outlet
import api from '../services/api';

// Đã bỏ interface Props vì React Router xử lý component con qua Outlet
export const PortalLayout = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<string>('student@eduspace.vn');
  const [currentName, setCurrentName] = useState<string>('Nguyễn Văn An');
  const [shortName, setShortName] = useState<string>('An');
  const [currentInitials, setCurrentInitials] = useState<string>('AN');
  const [userRoleLabel, setUserRoleLabel] = useState<string>('Sinh viên');
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('eduspace_demo_user');
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
    } else if (email.includes('student') || email.includes('tan') || email.includes('an')) {
      setCurrentName('Nguyễn Văn An');
      setShortName('An');
      setCurrentInitials('AN');
      setUserRoleLabel('Sinh viên');
    } else if (email.includes('staff')) {
      setCurrentName('Nguyễn Thị Kim Tuyến');
      setShortName('Tuyến');
      setCurrentInitials('KT');
      setUserRoleLabel('Nhân viên Staff');
    } else {
      setCurrentName('Quản trị viên');
      setShortName('Admin');
      setCurrentInitials('AD');
      setUserRoleLabel('Quản trị');
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
    if (path.includes('/core-approval') || path.includes('/staff')) return 'Duyệt đặt chỗ (Staff)';
    if (path.includes('/admin')) return 'Quản trị hệ thống';
    return 'EduSpace Dashboard';
  };

  const dynamicPageTitle = getPageTitle(location.pathname);

  const navItems = [
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
      to: '/checkin',
      label: 'Check-in',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"></circle>
          <polyline points="8 12 11 15 16 9"></polyline>
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
              const isActive = location.pathname === item.to || (item.to === '/spaces' && location.pathname.startsWith('/spaces/'));
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
            {/* React Router sẽ tự động chèn màn hình con vào vị trí của Outlet này */}
            <Outlet />
          </div>
        </div>
      </div>
  );
};