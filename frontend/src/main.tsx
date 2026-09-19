import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import Placeholder from './pages/Placeholder.tsx';
import CheckInDemoPage from './features/bookings/checkin/pages/CheckInDemoPage';
import { SearchSpacesPage } from './pages/SearchSpacesPage.tsx';
import { SpaceDetailPage } from './pages/SpaceDetailPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { CoreApprovalDemo } from './pages/CoreApprovalDemo.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/spaces" replace />} />
        <Route path="/login" element={<Placeholder title="Dang nhap" owner="Tan" />} />
        <Route path="/spaces" element={<SearchSpacesPage />} />
        <Route path="/spaces/:id" element={<SpaceDetailPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/core-approval" element={<CoreApprovalDemo />} />
        <Route path="/staff" element={<Placeholder title="Van hanh Staff" owner="Tuyen" />} />
        <Route path="/checkin-demo" element={<CheckInDemoPage />} />
        <Route path="/qr" element={<Placeholder title="Check-in QR" owner="Vu" />} />
        <Route path="/equipment" element={<Placeholder title="Thiet bi" owner="Vu" />} />
        <Route path="/admin/policy" element={<Placeholder title="Chinh sach" owner="Anh" />} />
        <Route path="/admin/stats" element={<Placeholder title="Thong ke" owner="Anh" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
