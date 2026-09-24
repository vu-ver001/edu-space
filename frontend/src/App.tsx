import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/layouts/PortalLayout.tsx';

// Import các trang chính thức của dự án
import LoginPage from './features/auth/pages/LoginPage';
import Placeholder from './pages/Placeholder';
import CheckInDemoPage from './features/bookings/checkin/pages/CheckInDemoPage';
import { GeneralSettingsPage } from "./features/admin/settings-general/pages/GeneralSettingsPage.tsx";
import StudentCheckInPage from './features/bookings/checkin/pages/StudentCheckInPage';
import { SpaceTypeDetailPageKT, SpaceTypeListPageKT, SpaceListPageKT, SpaceDetailPageKT, FacilityListPageKT } from "./features/space";
import { StaffOperationsPageKT } from "./features/staff";
import PolicyManagementPage from './features/admin/policy/pages/PolicyManagementPage';
import PolicyHistoryPage from './features/admin/policy/pages/PolicyHistoryPage';
import { StatisticsDashboardPage } from './features/admin/statistics';

const ADMIN_BASE = import.meta.env.VITE_ROUTE_ADMIN || '/admin';
const STAFF_BASE = import.meta.env.VITE_ROUTE_STAFF || '/staff';
const STUDENT_BASE = import.meta.env.VITE_ROUTE_STUDENT || '/home';

// TỰ ĐỘNG CHUYỂN HƯỚNG TỪ "/" SANG ĐÚNG TRANG CỦA ROLE
const RootRedirect = () => {
    const userStr = localStorage.getItem('eduspace_user') || localStorage.getItem('user');
    if (!userStr) return <Navigate to="/login" replace />;

    try {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') return <Navigate to={`${ADMIN_BASE}/stats`} replace />;
        if (user.role === 'STAFF') return <Navigate to={STAFF_BASE} replace />;
        return <Navigate to={STUDENT_BASE} replace />;
    } catch {
        return <Navigate to="/login" replace />;
    }
};

// Dev Dashboard
const DevDashboard = () => {
    const [health, setHealth] = useState<{ status: string } | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        api.get('/health')
            .then((res) => setHealth(res.data))
            .catch(() => setError('Chưa nối được Backend (kiểm tra BE đang chạy & VITE_API_URL).'));
    }, []);

    return (
        <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
            <h1>EduSpace — Dev Dashboard</h1>
            <p>
                Backend: <code>{import.meta.env.VITE_API_URL}</code> — Trạng thái:{' '}
                <strong style={{ color: health ? 'green' : 'red' }}>
                    {health ? health.status : error || 'đang kiểm tra...'}
                </strong>
            </p>
            <p>Sử dụng thanh điều hướng hoặc gõ đường dẫn để truy cập các tính năng.</p>
        </div>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. Quản lý Không gian, Tiện ích & Vận hành */}
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
                <Route path="/staff" element={<StaffOperationsPageKT />} />

                {/* 3. Đăng nhập */}
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PortalLayout />}>
                    {/* ROOT ROUTE */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* ADMIN */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                        <Route path={`${ADMIN_BASE}/stats`} element={<StatisticsDashboardPage />} />
                        <Route path={`${ADMIN_BASE}/policy`} element={<PolicyManagementPage />} />
                        <Route path={`${ADMIN_BASE}/policy/history`} element={<PolicyHistoryPage />} />
                        <Route path={`${ADMIN_BASE}/spaces`} element={<SpaceListPageKT />} />
                        <Route path={`${ADMIN_BASE}/spaces/:id`} element={<SpaceDetailPageKT />} />
                        <Route path={`${ADMIN_BASE}/facilities`} element={<FacilityListPageKT />} />
                        <Route path={`${ADMIN_BASE}/space-types`} element={<SpaceTypeListPageKT />} />
                        <Route path={`${ADMIN_BASE}/space-types/:id`} element={<SpaceTypeDetailPageKT />} />
                        <Route path={`${ADMIN_BASE}/settings-general`} element={<GeneralSettingsPage />} />
                    </Route>

                    {/* STAFF */}
                    <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
                        <Route path={STAFF_BASE} element={<StaffOperationsPageKT />} />
                        <Route path={`${STAFF_BASE}/checkin-demo`} element={<CheckInDemoPage />} />
                        <Route path={`${STAFF_BASE}/qr`} element={<Placeholder title="Check-in QR" owner="Vũ" />} />
                        <Route path={`${STAFF_BASE}/equipment`} element={<Placeholder title="Thiết bị" owner="Vũ" />} />
                    </Route>

                    {/* STUDENT */}
                    <Route element={<ProtectedRoute />}>
                        <Route path={STUDENT_BASE} element={<DevDashboard />} />
                        {/*<Route path="/spaces" element={<SearchSpacesPage />} />*/}
                        {/*<Route path="/spaces/:id" element={<SpaceDetailPage />} />*/}
                        {/*<Route path="/my-bookings" element={<MyBookingsPage />} />*/}
                        {/*<Route path="/core-approval" element={<CoreApprovalDemo />} />*/}
                        <Route path="/checkin" element={<StudentCheckInPage />} />
                        <Route path="/space-types" element={<SpaceTypeListPageKT />} />
                        <Route path="/space-types/:id" element={<SpaceTypeDetailPageKT />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="/403" element={<div style={{ padding: 20 }}><h3>403 - Không có quyền truy cập</h3></div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
