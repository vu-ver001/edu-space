import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import Placeholder from './pages/Placeholder.tsx';
import CheckInDemoPage from './features/bookings/checkin/pages/CheckInDemoPage';
import StudentCheckInPage from './features/bookings/checkin/pages/StudentCheckInPage';
import { SearchSpacesPage } from './pages/SearchSpacesPage.tsx';
import { SpaceDetailPage } from './pages/SpaceDetailPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { CoreApprovalDemo } from './pages/CoreApprovalDemo.tsx';
import { SpaceTypeListPageKT, SpaceTypeDetailPageKT, SpaceListPageKT, SpaceDetailPageKT, FacilityListPageKT } from './features/space';
import { StaffOperationsPageKT } from './features/staff';

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
        {/* ================= BEGIN KT ================= */}
        <Route path="/staff" element={<StaffOperationsPageKT />} />
        <Route path="/admin/space-types" element={<SpaceTypeListPageKT />} />
        <Route path="/admin/space-types/:id" element={<SpaceTypeDetailPageKT />} />
        <Route path="/space-types" element={<SpaceTypeListPageKT />} />
        <Route path="/space-types/:id" element={<SpaceTypeDetailPageKT />} />
        <Route path="/admin/spaces" element={<SpaceListPageKT />} />
        <Route path="/admin/spaces/:id" element={<SpaceDetailPageKT />} />
        <Route path="/spaces-management" element={<SpaceListPageKT />} />
        <Route path="/spaces-management/:id" element={<SpaceDetailPageKT />} />
        <Route path="/admin/facilities" element={<FacilityListPageKT />} />
        <Route path="/facilities" element={<FacilityListPageKT />} />
        {/* ================= END KT ================= */}
        <Route path="/checkin-demo" element={<CheckInDemoPage />} />
        <Route path="/checkin" element={<StudentCheckInPage />} />
        <Route path="/qr" element={<Placeholder title="Check-in QR" owner="Vu" />} />
        <Route path="/equipment" element={<Placeholder title="Thiet bi" owner="Vu" />} />
        <Route path="/admin/policy" element={<Placeholder title="Chinh sach" owner="Anh" />} />
        <Route path="/admin/stats" element={<Placeholder title="Thong ke" owner="Anh" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
