import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    // Đọc token theo đúng key mà file api.ts đã định nghĩa
    const token = localStorage.getItem('eduspace_token');

    // Giả sử thông tin user (id, email, role) được lưu dưới key 'user' khi login thành công
    const userStr = localStorage.getItem('eduspace_user');
    const user = userStr ? JSON.parse(userStr) : null;

    // 1. Chưa đăng nhập -> Đuổi về trang login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng sai Role -> Đuổi về trang báo lỗi 403 (hoặc trang chủ)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/403" replace />;
    }

    // 3. Hợp lệ -> Cho phép render component con bên trong
    return <Outlet />;
};