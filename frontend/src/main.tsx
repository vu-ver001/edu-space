import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import Placeholder from './pages/Placeholder.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Placeholder title="Dang nhap" owner="Tan" />} />
        <Route path="/spaces" element={<Placeholder title="Tim khong gian" owner="Van" />} />
        <Route path="/my-bookings" element={<Placeholder title="Lich booking cua toi" owner="Van" />} />
        <Route path="/staff" element={<Placeholder title="Van hanh Staff" owner="Tuyen" />} />
        <Route path="/qr" element={<Placeholder title="Check-in QR" owner="Vu" />} />
        <Route path="/equipment" element={<Placeholder title="Thiet bi" owner="Vu" />} />
        <Route path="/admin/policy" element={<Placeholder title="Chinh sach" owner="Anh" />} />
        <Route path="/admin/stats" element={<Placeholder title="Thong ke" owner="Anh" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
