import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

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

    try {
        const decoded: any = jwtDecode(token);

        // Kiểm tra xem token hết hạn chưa
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
            localStorage.removeItem('eduspace_token');
            localStorage.removeItem('eduspace_user');
            return <Navigate to="/login" replace />;
        }

        // Tìm role thực sự được cất trong Token (cover nhiều tên gọi khác nhau từ Backend)
        const realRole = decoded.role || decoded.roles || decoded.scope || decoded.authorities;

        // Nếu trong token có thông tin role, ta đối chiếu xem nó có khớp với LocalStorage không.
        // Nếu LocalStorage là ADMIN mà trong Token lại là STUDENT -> Bắt quả tang sửa bậy -> Đuổi 403
        if (realRole) {
            const isTampered = typeof realRole === 'string'
                ? realRole !== user.role
                : !realRole.includes(user.role); // Trường hợp role lưu dạng mảng ["STUDENT"]

            if (isTampered) return <Navigate to="/403" replace />;
        }
    } catch (error) {
        // Có người cố tình sửa nội dung chuỗi Token -> Token hỏng -> Đuổi về login
        localStorage.removeItem('eduspace_token');
        localStorage.removeItem('eduspace_user');
        return <Navigate to="/login" replace />;
    }

    // 2. Đã đăng nhập nhưng sai Role -> Đuổi về trang báo lỗi 403 (hoặc trang chủ)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/403" replace />;
    }

    // 3. Hợp lệ -> Cho phép render component con bên trong
    return <Outlet />;
};