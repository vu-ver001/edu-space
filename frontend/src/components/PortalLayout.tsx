import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate, Link } from 'react-router-dom';

const portalStyles = `
  /* RESET & CONTAINER */
  .portal-container { display: flex; min-height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
  
  /* SIDEBAR THU/MỞ - ÉP KÍCH THƯỚC CHUẨN */
  .portal-sidebar-wide { 
    width: 260px; 
    min-width: 260px; /* Bắt buộc giữ 260px khi mở */
    background: #1e293b; 
    color: white; 
    display: flex; 
    flex-direction: column; 
    transition: width 0.3s ease, min-width 0.3s ease; 
    overflow-x: hidden; 
    z-index: 10;
  }
  .portal-sidebar-wide.collapsed { 
    width: 72px; 
    min-width: 72px; /* Ép buộc gầy lại 72px */
  }
  
  /* BRAND BOX (CHỨA NÚT 3 GẠCH VÀ LOGO) TRONG SIDEBAR */
  .sidebar-brand-box { 
    height: 60px; 
    padding: 0 16px; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    border-bottom: 1px solid #334155; 
    box-sizing: border-box; 
    white-space: nowrap; 
  }
  .collapsed .sidebar-brand-box { 
    padding: 0; 
    justify-content: center; /* Đưa nút 3 gạch ra giữa khi thu nhỏ */
  }
  
  /* NÚT 3 GẠCH */
  .sidebar-toggle-btn { 
    background: none; 
    border: none; 
    color: #cbd5e1; 
    cursor: pointer; 
    padding: 6px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 6px; 
    transition: 0.2s; 
    flex-shrink: 0; 
  }
  .sidebar-toggle-btn:hover { background: #334155; color: white; }
  
  /* LINK CHỨA LOGO VÀ TÊN */
  .brand-link { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    text-decoration: none; 
    color: white; 
  }
  .brand-name { 
    font-size: 1.15rem; 
    font-weight: bold; 
    color: #ffffff; /* Thêm dòng này để ép chữ màu trắng tuyệt đối */
  }
  .collapsed .brand-link { display: none; }
  
  /* MENU ĐIỀU HƯỚNG */
  .sidebar-wide-nav { padding: 16px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; overflow-x: hidden; }
  .collapsed .sidebar-wide-nav { padding: 16px 8px; align-items: center; }
  
  .sidebar-wide-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: #cbd5e1; font-size: 0.95rem; text-decoration: none; border-radius: 8px; transition: 0.2s; white-space: nowrap; box-sizing: border-box; width: 100%; }
  .sidebar-wide-item:hover, .sidebar-wide-item.active { background: #3b82f6; color: white; }
  
  .collapsed .sidebar-wide-item { width: 44px; height: 44px; padding: 0; justify-content: center; }
  
  .nav-item-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .nav-item-icon svg { width: 20px; height: 20px; }
  .nav-item-text { transition: opacity 0.2s; opacity: 1; }
  .collapsed .nav-item-text { opacity: 0; display: none; }
  
  /* KHU VỰC LÀM VIỆC CHÍNH */
  .portal-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-x: hidden; }
  
  /* HEADER TRẮNG (Đã xóa nút 3 gạch, chỉ còn Title) */
  .portal-top-bar { height: 60px; box-sizing: border-box; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
  .top-bar-title { margin: 0; font-size: 1.15rem; font-weight: 600; color: #0f172a; }
  
  /* PROFILE & DROPDOWN HEADER */
  .header-greeting-box { display: flex; align-items: center; gap: 8px; cursor: pointer; position: relative; color: #1e3a8a; font-weight: 500; font-size: 0.9rem; }
  .header-avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #d1d5db; color: #9ca3af; display: flex; align-items: center; justify-content: center; overflow: hidden; border: none; }
  .header-avatar-circle svg { width: 18px; height: 18px; }
  .chevron-down { color: #93c5fd; }
  
  .profile-dropdown-menu { position: absolute; top: 44px; right: 0; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 220px; z-index: 100; overflow: hidden; border: 1px solid #e2e8f0; }
  .dropdown-profile-header { background: #eef2ff; padding: 16px; display: flex; align-items: center; gap: 12px; }
  .dropdown-large-avatar { width: 44px; height: 44px; border-radius: 50%; background: #d1d5db; color: #9ca3af; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dropdown-large-avatar svg { width: 24px; height: 24px; }
  .dropdown-profile-name { font-size: 0.9rem; color: #0f172a; font-weight: 600; text-transform: uppercase; word-break: break-word; }
  
  .dropdown-actions { padding: 8px 0; background: white; }
  .dropdown-action-btn { width: 100%; text-align: left; padding: 10px 16px; background: none; border: none; font-size: 0.9rem; color: #1e3a8a; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
  .dropdown-action-btn:hover { background: #f8fafc; }
  .dropdown-action-btn svg { width: 16px; height: 16px; }
  
  /* VÙNG CHỨA NỘI DUNG */
  .portal-content-canvas { padding: 24px; flex: 1; overflow-y: auto; }
`;

export const PortalLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<{ id: number, email: string, fullName: string, role: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('eduspace_user') || localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('eduspace_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('eduspace_user');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const ADMIN_BASE = import.meta.env.VITE_ROUTE_ADMIN || '/admin';
  const STAFF_BASE = import.meta.env.VITE_ROUTE_STAFF || '/staff';
  const STUDENT_BASE = import.meta.env.VITE_ROUTE_STUDENT || '/home';

  const getNavItems = () => {
    if (user.role === 'ADMIN') {
      return [
        { to: `${ADMIN_BASE}/stats`, label: 'Trang chủ', icon: '🏠' },
        { to: `${ADMIN_BASE}/users`, label: 'Quản lý người dùng', icon: '👥' },
        { to: `${ADMIN_BASE}/spaces`, label: 'Quản lý không gian', icon: '🏢' },
        { to: `${ADMIN_BASE}/policy`, label: 'Cấu hình chính sách', icon: '⚙️' }
      ];
    }
    if (user.role === 'STAFF') {
      return [
        { to: STAFF_BASE, label: 'Trang chủ', icon: '🏠' },
        { to: `${STAFF_BASE}/approvals`, label: 'Duyệt đặt chỗ', icon: '✅' },
        { to: `${STAFF_BASE}/maintenance`, label: 'Tạo bảo trì', icon: '🛠️' },
        { to: `${STAFF_BASE}/checkin`, label: 'Hỗ trợ Check-in', icon: '📍' }
      ];
    }
    return [
      { to: STUDENT_BASE, label: 'Trang chủ', icon: '🏠' },
      { to: '/spaces', label: 'Tìm & Đặt phòng', icon: '🔍' },
      { to: '/my-bookings', label: 'Lịch đặt của tôi', icon: '📅' },
      { to: '/checkin', label: 'Tự Check-in', icon: '📍' },
      { to: '/waitlist', label: 'Danh sách chờ', icon: '⏳' }
    ];
  };

  const navItems = getNavItems();

  const getPageTitle = (path: string) => {
    const currentItem = navItems.find(item => path.startsWith(item.to) && item.to !== '/');
    return currentItem ? currentItem.label : 'EduSpace Portal';
  };

  return (
      <>
        <style>{portalStyles}</style>
        <div className="portal-container">

          {/* SIDEBAR */}
          <aside className={`portal-sidebar-wide ${isCollapsed ? 'collapsed' : ''}`}>

            {/* BỘ PHẬN ĐẦU SIDEBAR: NÚT 3 GẠCH VÀ LOGO */}
            <div className="sidebar-brand-box">
              <button
                  className="sidebar-toggle-btn"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title="Thu/Mở thanh điều hướng"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              <Link to="/" className="brand-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                <span className="brand-name">EduSpace</span>
              </Link>
            </div>

            {/* MENU ĐIỀU HƯỚNG */}
            <nav className="sidebar-wide-nav">
              {navItems.map((item) => (
                  <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === STAFF_BASE || item.to === `${ADMIN_BASE}/stats` || item.to === STUDENT_BASE}
                      className={({ isActive }) => `sidebar-wide-item ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? item.label : ""}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-text">{item.label}</span>
                  </NavLink>
              ))}
            </nav>
          </aside>

          {/* MAIN WORKSPACE */}
          <div className="portal-main-area">

            {/* HEADER TRẮNG */}
            <header className="portal-top-bar">
              {/* Chỉ hiện tiêu đề trang */}
              <h2 className="top-bar-title">{getPageTitle(location.pathname)}</h2>

              {/* PROFILE */}
              <div className="header-greeting-box" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="header-avatar-circle">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span>{user.fullName.toUpperCase()}</span>
                <svg className="chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>

                {showProfileMenu && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-profile-header">
                        <div className="dropdown-large-avatar">
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <div className="dropdown-profile-name">
                          {user.fullName.toUpperCase()}
                        </div>
                      </div>
                      <div className="dropdown-actions">
                        <button className="dropdown-action-btn" onClick={(e) => e.stopPropagation()}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                          </svg>
                          Thay đổi mật khẩu
                        </button>
                        <button className="dropdown-action-btn" onClick={handleLogout}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                )}
              </div>
            </header>

            {/* VÙNG CHỨA COMPONENT CON TỪ REACT ROUTER (OUTLET) */}
            <div className="portal-content-canvas">
              <Outlet />
            </div>
          </div>
        </div>
      </>
  );
};