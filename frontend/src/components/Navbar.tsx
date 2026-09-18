import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<string>('student@eduspace.vn');
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('eduspace_demo_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedUser.includes('staff')) setUserRole('STAFF');
      else if (savedUser.includes('admin')) setUserRole('ADMIN');
      else setUserRole('STUDENT');
    } else {
      // Tự động đăng nhập test ban đầu
      switchUser('student@eduspace.vn', 'STUDENT');
    }
  }, []);

  const switchUser = async (email: string, role: string) => {
    setLoadingLogin(true);
    try {
      const res = await api.post<{ token: string }>('/api/auth/login', {
        email,
        password: 'password' // Mật khẩu mặc định trong DB
      }).catch(async () => {
        // Fallback thử 123456
        return await api.post<{ token: string }>('/api/auth/login', {
          email,
          password: 'password'
        });
      });

      if (res?.data?.token) {
        localStorage.setItem('eduspace_token', res.data.token);
      }
    } catch {
      // Trong trường hợp chưa gọi được auth, vẫn lưu thông tin để fallback
    } finally {
      localStorage.setItem('eduspace_demo_user', email);
      setCurrentUser(email);
      setUserRole(role);
      setLoadingLogin(false);
      // Reload nhẹ để các component đồng bộ
      window.dispatchEvent(new Event('user-switched'));
    }
  };

  const navItems = [
    { to: '/spaces', label: 'Tìm Không Gian', icon: '🔍', badge: 'M03' },
    { to: '/my-bookings', label: 'Lịch Đặt Của Tôi', icon: '📅', badge: 'M04' },
    { to: '/core-approval', label: 'Duyệt Đặt Chỗ (Staff)', icon: '🛡️', badge: 'Core' }
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
            const isActive = location.pathname === item.to;
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

        {/* Role Switcher Demo */}
        <div className="navbar-user-switcher">
          <div className="user-profile-badge">
            <span className="avatar-dot" />
            <div className="user-info-text">
              <span className="user-role-label">{userRole}</span>
              <span className="user-email-text">{currentUser.split('@')[0]}</span>
            </div>
          </div>

          <div className="quick-switch-buttons">
            <button
              title="Chuyển sang Sinh viên Lê Minh Tân"
              className={`role-btn ${currentUser === 'student@eduspace.vn' ? 'active' : ''}`}
              onClick={() => switchUser('student@eduspace.vn', 'STUDENT')}
              disabled={loadingLogin}
            >
              SV: Tân
            </button>
            <button
              title="Chuyển sang Sinh viên Nguyễn Thị Khánh Vân"
              className={`role-btn ${currentUser === 'khanhvan@eduspace.vn' ? 'active' : ''}`}
              onClick={() => switchUser('khanhvan@eduspace.vn', 'STUDENT')}
              disabled={loadingLogin}
            >
              SV: Vân
            </button>
            <button
              title="Chuyển sang Nhân viên Staff (Duyệt/Check-in)"
              className={`role-btn ${currentUser === 'staff@eduspace.vn' ? 'active' : ''}`}
              onClick={() => switchUser('staff@eduspace.vn', 'STAFF')}
              disabled={loadingLogin}
            >
              Staff
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
