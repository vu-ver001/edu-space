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

            // LOG DỮ LIỆU ĐỂ KIỂM TRA BE TRẢ VỀ CÁI GÌ
            console.log("Dữ liệu Backend trả về:", res.data);

            // Thích ứng với 2 kiểu trả về phổ biến của Spring Boot
            const token = res.data.token || res.data.accessToken || res.data.data?.token || res.data.data?.accessToken;
            const userInfo = res.data.user || res.data.data || res.data;

            if (!token) {
                setError('Đăng nhập thành công nhưng không tìm thấy Token trong phản hồi!');
                setIsLoading(false);
                return;
            }

            // LƯU ĐÚNG TÊN KEY MÀ PROTECTED ROUTE YÊU CẦU
            localStorage.setItem('eduspace_token', token);
            localStorage.setItem('eduspace_user', JSON.stringify({
                id: userInfo.id,
                email: userInfo.email,
                fullName: userInfo.fullName,
                role: userInfo.role
            }));

            // Chuyển hướng
            navigate('/');
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