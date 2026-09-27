import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

// Khai báo cấu trúc dữ liệu mà Backend giấu bên trong Token
interface JwtPayload {
    role: string;
    exp?: number; // Thời gian hết hạn của token
    // Có thể thêm id, username... tùy backend cấu hình
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const token = localStorage.getItem('eduspace_token');

    // 1. Không có token -> Đuổi về trang login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // Bóc tách token. Bất cứ hành động tự sửa token nào cũng sẽ làm token bị hỏng và nhảy xuống block catch.
        const decoded = jwtDecode<JwtPayload>(token);

        // (Tùy chọn) Kiểm tra Token đã hết hạn chưa
        if (decoded.exp) {
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                // Hết hạn -> Xóa rác và đuổi về login
                localStorage.removeItem('eduspace_token');
                localStorage.removeItem('eduspace_user');
                return <Navigate to="/login" replace />;
            }
        }

        // 2. Kiểm tra Role thực sự lấy từ bên trong Token
        if (allowedRoles && !allowedRoles.includes(decoded.role)) {
            return <Navigate to="/403" replace />;
        }

        // 3. Hợp lệ -> Cho phép render component
        return <Outlet />;
    } catch (error) {
        // Token bị can thiệp sai định dạng -> Xóa và đuổi về login ngay
        localStorage.removeItem('eduspace_token');
        localStorage.removeItem('eduspace_user');
        return <Navigate to="/login" replace />;
    }
};