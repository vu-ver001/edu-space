import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type Props = { title: string; owner: string };

export default function Placeholder({ title, owner }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@eduspace.vn');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If this placeholder is not for login, show original placeholder
  if (title !== 'Dang nhap') {
    return (
      <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <h1>{title}</h1>
        <p>
          <small>{`TODO(${owner}): xay dung man hinh theo dac ta.`}</small>
        </p>
        <a href="/">Ve trang chu</a>
      </main>
    );
  }

  const handleLogin = async (loginEmail?: string, loginPass?: string, redirectPath?: string) => {
    setIsLoading(true);
    setError(null);
    const targetEmail = loginEmail || email;
    const targetPass = loginPass || password;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const res = await axios.post(`${baseUrl}/api/auth/login`, {
        email: targetEmail,
        password: targetPass,
      });

      if (res.data?.token) {
        localStorage.setItem('eduspace_token', res.data.token);
        // Redirect to requested path or default to space-types for admin
        if (redirectPath) {
          navigate(redirectPath);
        } else if (targetEmail.includes('admin')) {
          navigate('/space-types');
        } else if (targetEmail.includes('staff')) {
          navigate('/staff');
        } else {
          navigate('/spaces');
        }
      } else {
        setError('Không nhận được token xác thực.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '26px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              border: '1px solid #dbeafe',
            }}
          >
            ES
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
            Đăng nhập EduSpace
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            Cổng quản lý và đặt không gian học tập trực tuyến
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Quick 1-Click Login for development testing */}
        <div style={{ marginBottom: '20px' }}>
          <span
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#64748b',
              marginBottom: '10px',
              letterSpacing: '0.04em',
            }}
          >
            Đăng nhập nhanh 1 chạm (Test Account):
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleLogin('admin@eduspace.vn', '123456', '/space-types')}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>👑 Quản Trị Viên (Admin)</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>→ Vào Loại Không Gian</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('staff@eduspace.vn', '123456', '/staff')}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🛡️ Nhân Viên Quầy (Staff)</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>→ Vào Vận Hành Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('student@eduspace.vn', '123456', '/spaces')}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🎓 Sinh Viên (Student)</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>→ Vào Tra Cứu Phòng</span>
            </button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            margin: '20px 0',
          }}
        >
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ffffff',
              padding: '0 10px',
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            hoặc nhập tài khoản
          </span>
        </div>

        {/* Regular Login Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email đăng nhập
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '11px 16px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <small style={{ color: '#94a3b8', fontSize: '11.5px' }}>
            Mã định danh nhóm: TODO({owner})
          </small>
        </div>
      </div>
    </div>
  );
}
