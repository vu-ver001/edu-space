import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const normalizeRole = (r: any): string => {
    if (!r || typeof r !== 'string') return '';
    return r.replace(/^ROLE_/, '').toUpperCase();
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    // Đọc token theo đúng key mà file api.ts đã định nghĩa
    const token = localStorage.getItem('eduspace_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');

    // Đọc thông tin user từ localStorage (hỗ trợ cả eduspace_user và user)
    const userStr = localStorage.getItem('eduspace_user') || localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // 1. Chưa đăng nhập -> Đuổi về trang login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = normalizeRole(user.role);

    try {
        const decoded: any = jwtDecode(token);

        // Kiểm tra xem token hết hạn chưa
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
            ['eduspace_token', 'token', 'accessToken', 'eduspace_user', 'user'].forEach(k => localStorage.removeItem(k));
            return <Navigate to="/login" replace />;
        }

        // Tìm role thực sự được cất trong Token (cover nhiều tên gọi khác nhau từ Backend)
        const rawRealRole = decoded.role || decoded.roles || decoded.scope || decoded.authorities;

        // Nếu trong token có thông tin role, ta đối chiếu xem nó có khớp với LocalStorage không.
        if (rawRealRole) {
            const tokenRoles = Array.isArray(rawRealRole)
                ? rawRealRole.map((r: any) => normalizeRole(typeof r === 'string' ? r : r?.authority))
                : [normalizeRole(rawRealRole)];

            const isTampered = !tokenRoles.includes(userRole);
            if (isTampered) return <Navigate to="/403" replace />;
        }
    } catch {
        // Có người cố tình sửa nội dung chuỗi Token -> Token hỏng -> Đuổi về login
        ['eduspace_token', 'token', 'accessToken', 'eduspace_user', 'user'].forEach(k => localStorage.removeItem(k));
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng sai Role -> Đuổi về trang báo lỗi 403 (hoặc trang chủ)
    if (allowedRoles) {
        const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
        if (!normalizedAllowed.includes(userRole)) {
            return <Navigate to="/403" replace />;
        }
    }

    // 3. Hợp lệ -> Cho phép render component con bên trong
    return <Outlet />;
};