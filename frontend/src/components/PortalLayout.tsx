import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../services/api';

interface Props {
  pageTitle?: string;
  children?: React.ReactNode;
}

export const PortalLayout: React.FC<Props> = ({ children }) => {
  useEffect(() => {
    // Duy trì phiên đăng nhập đồng bộ từ API backend nếu có token
    const token = localStorage.getItem('eduspace_token');
    if (token) {
      api.get('/api/users/me')
        .then((res) => {
          if (res.data) {
            const u = res.data;
            localStorage.setItem('eduspace_user', JSON.stringify({
              id: u.id,
              email: u.email,
              fullName: u.fullName,
              role: u.role
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="portal-clean-wrapper" style={{ minHeight: '100vh', background: 'var(--portal-bg, #F8FAFC)', width: '100%' }}>
      <main className="portal-content-canvas" style={{ maxWidth: '1340px', margin: '0 auto', padding: '24px 28px', width: '100%', boxSizing: 'border-box' }}>
        {children || <Outlet />}
      </main>
    </div>
  );
};