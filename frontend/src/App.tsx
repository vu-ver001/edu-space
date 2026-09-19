import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';

// Import các trang chính thức của dự án
import Login from './pages/Login';
import Placeholder from './pages/Placeholder';
import CheckInDemoPage from './features/bookings/checkin/pages/CheckInDemoPage';
import { SearchSpacesPage } from './pages/SearchSpacesPage';
import { SpaceDetailPage } from './pages/SpaceDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { CoreApprovalDemo } from './pages/CoreApprovalDemo';

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
            <p>Sử dụng thanh điều hướng bên cạnh để truy cập các tính năng.</p>
        </div>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Nhóm Public: Không cần đăng nhập */}
                <Route path="/login" element={<Login />} />

                {/* Nhóm Private: Bắt buộc đăng nhập và bọc bởi khung giao diện PortalLayout */}
                <Route element={<PortalLayout />}>

                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                        <Route path="/admin/policy" element={<Placeholder title="Chính sách" owner="Anh" />} />
                        <Route path="/admin/stats" element={<Placeholder title="Thống kê" owner="Anh" />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
                        <Route path="/staff" element={<Placeholder title="Vận hành Staff" owner="Tuyến" />} />
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

                {/* Bắt lỗi đường dẫn không tồn tại hoặc lỗi quyền (403) */}
                <Route path="/403" element={<div style={{ padding: 20 }}><h3>403 - Không có quyền truy cập</h3></div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}