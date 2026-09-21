import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';

// Import các trang chính thức của dự án
import LoginPage from './features/auth/pages/LoginPage';
import Placeholder from './pages/Placeholder';
import CheckInDemoPage from './features/bookings/checkin/pages/CheckInDemoPage';
import { SearchSpacesPage } from './pages/SearchSpacesPage';
import { SpaceDetailPage } from './pages/SpaceDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { CoreApprovalDemo } from './pages/CoreApprovalDemo';
import { SpaceTypeDetailPageKT, SpaceTypeListPageKT, SpaceListPageKT, SpaceDetailPageKT, FacilityListPageKT } from "./features/space";
import { StaffOperationsPageKT } from "./features/staff";
import PolicyManagementPage from './features/admin/policy/pages/PolicyManagementPage';
import PolicyHistoryPage from './features/admin/policy/pages/PolicyHistoryPage';

// Giữ lại trang check Health của team làm màn hình chào mừng tạm thời
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
                {/* 1. Các trang Quản lý Không gian, Tiện ích & Vận hành của Kim Tuyến */}
                {/* Truy cập trực tiếp qua URL, hiển thị nguyên bản toàn màn hình, không bọc menu */}
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

                {/* 2. Module Chính sách của Ngọc Anh */}
                <Route path="/admin/policy" element={<PolicyManagementPage />} />
                <Route path="/admin/policy/history" element={<PolicyHistoryPage />} />

                {/* 3. Phần Đăng nhập & Khung chung của team (giữ nguyên không sửa mất code) */}
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PortalLayout />}>
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                        <Route path="/admin/stats" element={<Placeholder title="Thống kê" owner="Anh" />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
                        <Route path="/checkin-demo" element={<CheckInDemoPage />} />
                        <Route path="/qr" element={<Placeholder title="Check-in QR" owner="Vũ" />} />
                        <Route path="/equipment" element={<Placeholder title="Thiết bị" owner="Vũ" />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route path="/spaces" element={<SearchSpacesPage />} />
                        <Route path="/spaces/:id" element={<SpaceDetailPage />} />
                        <Route path="/my-bookings" element={<MyBookingsPage />} />
                        <Route path="/core-approval" element={<CoreApprovalDemo />} />
                        <Route path="/" element={<DevDashboard />} />
                    </Route>
                </Route>

                {/* Bắt lỗi đường dẫn không tồn tại */}
                <Route path="/403" element={<div style={{ padding: 20 }}><h3>403 - Không có quyền truy cập</h3></div>} />
                <Route path="*" element={<Navigate to="/admin/spaces" replace />} />
            </Routes>
        </BrowserRouter>
    );
}