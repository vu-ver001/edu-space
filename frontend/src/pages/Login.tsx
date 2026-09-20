import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/api/auth/login', { email, password });

            // Login hiện tại chỉ trả token. Lấy profile bằng token vừa cấp để
            // ProtectedRoute có đủ id/email/fullName/role (đặc biệt với STAFF).
            const token = res.data.token || res.data.accessToken || res.data.data?.token || res.data.data?.accessToken;

            if (!token) {
                setError('Đăng nhập thành công nhưng không tìm thấy Token trong phản hồi!');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('eduspace_token', token);

            const profileResponse = await api.get('/api/users/me');
            const profile = profileResponse.data;
            if (!profile?.id || !profile?.email || !profile?.role) {
                localStorage.removeItem('eduspace_token');
                setError('Đăng nhập thành công nhưng không lấy được thông tin vai trò.');
                return;
            }

            localStorage.setItem('eduspace_user', JSON.stringify({
                id: profile.id,
                email: profile.email,
                fullName: profile.fullName,
                role: profile.role,
            }));
            // PortalLayout dùng key này cho tài khoản demo; đồng bộ để không
            // giữ lại role cũ sau khi đổi từ Student sang Staff/Admin.
            localStorage.setItem('eduspace_demo_user', profile.email);

            navigate(profile.role === 'STAFF' || profile.role === 'ADMIN' ? '/staff' : '/');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại!';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div style={{ maxWidth: 400, margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Đăng nhập</h2>

            {error && (
                <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="student@eduspace.vn"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Nhập mật khẩu"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: '10px',
                        backgroundColor: isLoading ? '#a0c4ff' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        marginTop: '10px'
                    }}
                >
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
    );
}
