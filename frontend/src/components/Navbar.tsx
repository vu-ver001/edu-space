import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('eduspace_user') || 'null');
      setCurrentUser(savedUser?.email || '');
      setUserRole(savedUser?.role || '');
    } catch {
      setCurrentUser('');
      setUserRole('');
    }
  }, []);

  const navItems = [
    { to: '/student/spaces', label: 'Tìm Không Gian', icon: '🔍', badge: 'M03' },
    { to: '/student/my-bookings', label: 'Lịch Đặt Của Tôi', icon: '📅', badge: 'M04' }
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <span className="brand-title">EduSpace</span>
            <span className="brand-subtitle">Lõi Đặt Chỗ • Khánh Vân</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="navbar-links">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <span className="nav-badge">{item.badge}</span>
              </Link>
            );
          })}
        </nav>

        {/* Hiển thị phiên hiện tại, không tự đăng nhập hoặc đổi danh tính. */}
        <div className="navbar-user-switcher">
          <div className="user-profile-badge">
            <span className="avatar-dot" />
            <div className="user-info-text">
              <span className="user-role-label">{userRole}</span>
              <span className="user-email-text">{currentUser.split('@')[0]}</span>
            </div>
          </div>

          <div className="quick-switch-buttons">
            <Link to="/login" className="role-btn">Đăng nhập tài khoản khác</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
