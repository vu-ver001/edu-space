import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './services/api';

type Health = { status: string } | null;

// Skeleton dieu huong theo vai tro se do Tan lam (RequireRole + Layout).
// Cac trang placeholder ben duoi la cho cho tung thanh vien dien.
const NAV: Array<{ to: string; label: string; owner: string }> = [
  { to: '/login', label: 'Dang nhap (Tan)', owner: 'TODO(Tan)' },
  { to: '/spaces', label: 'Tim khong gian (Van)', owner: 'TODO(Van)' },
  { to: '/my-bookings', label: 'Lich booking cua toi (Van)', owner: 'TODO(Van)' },
  { to: '/staff', label: 'Van hanh Staff (Tuyen)', owner: 'TODO(Tuyen)' },
  { to: '/checkin-demo', label: 'Demo check-in MVP (Vu)', owner: 'MOCK(Vu)' },
  { to: '/checkin', label: 'Check-in thật (Vu)', owner: 'API(Vu)' },
  { to: '/qr', label: 'Check-in QR (Vu)', owner: 'TODO(Vu)' },
  { to: '/equipment', label: 'Thiet bi (Vu)', owner: 'TODO(Vu)' },
  { to: '/admin/policy', label: 'Chinh sach (Anh)', owner: 'TODO(Anh)' },
  { to: '/admin/stats', label: 'Thong ke (Anh)', owner: 'TODO(Anh)' },
];

export default function App() {
  const [health, setHealth] = useState<Health>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError('Chua noi duoc Backend (kiem tra BE :8080 + VITE_API_URL).'));
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>EduSpace — skeleton</h1>
      <p>
        Backend: <code>{import.meta.env.VITE_API_URL}</code> — trang thai:{' '}
        <strong>{health ? health.status : error || 'dang kiem tra...'}</strong>
      </p>
      <ul>
        {NAV.map((n) => (
          <li key={n.to}>
            <Link to={n.to}>{n.label}</Link> <small>{n.owner}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
