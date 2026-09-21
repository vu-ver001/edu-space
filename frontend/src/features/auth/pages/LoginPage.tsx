import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Tùy theo vị trí thư mục services, nếu file này ở src/features/auth/pages/ thì lùi 3 cấp (../../../)
import api from '../../../services/api';

const loginStyles = `
.portal-login-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
}
.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 5%;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-logo {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.header-titles h3 {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #93c5fd;
}
.header-titles h1 {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.header-right {
  text-align: right;
}
.header-right h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}
.header-right p {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: #bfdbfe;
}
.portal-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 24px;
  padding: 20px 5%;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
.portal-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  color: #1e293b;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}
.info-card {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}
.info-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.info-title-row h2 {
  font-size: 1.25rem;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px 0;
}
.info-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #bfdbfe;
}
.info-desc {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 32px;
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.step-item {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.step-number {
  width: 28px;
  height: 28px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 12px;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}
.step-item h4 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #0f172a;
}
.step-item p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
}
.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.btn-primary-outline, .btn-warning {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}
.btn-primary-outline { 
  background: #2563eb; 
  color: white; 
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.btn-primary-outline:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}
.btn-warning { 
  background: #f59e0b; 
  color: white; 
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}
.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}
.warning-alert {
  background: #fefce8;
  border: 1px solid #fef08a;
  border-left: 4px solid #eab308;
  padding: 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #854d0e;
  line-height: 1.5;
}
.login-card {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-lock-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.15);
}
.login-card h2 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: #1e3a8a;
}
.login-card > p {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 24px;
  text-align: center;
}
.login-form {
  width: 100%;
}
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}
.toggle-pwd {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}
.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.input-wrapper input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}
.form-options {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 24px;
}
.forgot-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}
.btn-submit {
  width: 100%;
  padding: 14px;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
  transition: all 0.2s ease;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(30, 58, 138, 0.4);
}
.btn-submit:disabled {
  background: #94a3b8;
  box-shadow: none;
  transform: none;
}
.btn-sso {
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}
.btn-sso:hover {
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.login-error {
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  text-align: center;
}
.portal-footer {
  background: rgba(0, 0, 0, 0.2);
  padding: 24px 5% 0;
  margin-top: 40px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.feature-item svg { color: #93c5fd; }
.feature-text h5 { margin: 0 0 4px; font-size: 0.9rem; }
.feature-text p { margin: 0; font-size: 0.75rem; color: #94a3b8; }
.footer-copy {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 16px;
}

/* CSS cho dòng chữ chạy (Marquee) */
.marquee-container {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.marquee-text {
  display: inline-block;
  padding-left: 100%;
  animation: marquee 25s linear infinite;
  font-size: 0.85rem;
  color: #93c5fd;
  font-weight: 500;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

@media (max-width: 1024px) {
  .portal-main { flex-direction: column; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .header-right { display: none; }
}
@media (max-width: 640px) {
  .steps-grid { grid-template-columns: 1fr; }
  .action-buttons { flex-direction: column; }
}
`;

export default function LoginPage() {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Đã bấm nút đăng nhập, đang chuẩn bị gửi API...");
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/api/auth/login', {
                email: loginId,
                password
            });

            console.log("Dữ liệu gốc từ Backend:", res.data);

            // 1. Lấy Token trực tiếp
            const token = res.data.token || res.data.accessToken;

            if (!token) {
                setError('Phản hồi từ server thiếu Token!');
                setLoading(false);
                return;
            }

            // 2. Lấy trực tiếp các trường thông tin user từ res.data
            const userToSave = {
                id: res.data.id || 3,
                email: res.data.email || loginId,
                fullName: res.data.fullName || 'Thành viên EduSpace',
                role: res.data.role || 'STUDENT'
            };

            console.log("User sẽ lưu vào localStorage:", userToSave);

            // 3. Lưu vào localStorage dưới mọi tên key dự phòng
            localStorage.setItem('eduspace_token', token);
            localStorage.setItem('token', token);
            localStorage.setItem('accessToken', token);
            localStorage.setItem('eduspace_user', JSON.stringify(userToSave));
            localStorage.setItem('user', JSON.stringify(userToSave));

            // 4. Điều hướng chính xác theo Role (ADMIN, STAFF, hoặc mặc định)
            if (userToSave.role === 'ADMIN') {
                navigate('/admin/users');
            } else if (userToSave.role === 'STAFF') {
                navigate('/staff');
            } else {
                navigate('/spaces');
            }

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{loginStyles}</style>
            <div className="portal-login-wrapper">
                <header className="portal-header">
                    <div className="header-left">
                        <div className="header-logo">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        </div>
                        <div className="header-titles">
                            <h2>EduSpace</h2>
                            <h1>HỆ THỐNG QUẢN LÝ & ĐẶT CHỖ KHÔNG GIAN HỌC TẬP</h1>
                        </div>
                    </div>
                    <div className="header-right">
                        <h2>CỔNG THÔNG TIN & ĐẶT CHỖ KHÔNG GIAN HỌC TẬP</h2>
                        <p>Tra cứu không gian học tập, đặt phòng tự học, thảo luận nhóm và check-in trực tuyến nhanh chóng, tiện lợi</p>
                    </div>
                </header>

                <main className="portal-main">
                    <div className="portal-card info-card">
                        <div className="info-title-row">
                            <h2>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                QUY TRÌNH ĐẶT CHỖ & SỬ DỤNG PHÒNG HỌC NĂM 2026 - 2027
                            </h2>
                            <div className="info-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <span>Đồng bộ Thời khóa biểu<br/><small style={{fontWeight: 'normal'}}>Tự động chống trùng lịch</small></span>
                            </div>
                        </div>

                        <p className="info-desc">
                            Hệ thống EduSpace hỗ trợ sinh viên chủ động đăng ký sử dụng phòng học nhóm, study booth, phòng thuyết trình theo quy trình 3 bước chuẩn:<br/>
                            <strong>Tra cứu khả dụng → Đặt lịch trực tuyến → Check-in tự động</strong>
                        </p>

                        <div className="steps-grid">
                            <div className="step-item">
                                <div className="step-number">1</div>
                                <h4>TRA CỨU PHÒNG TRỐNG</h4>
                                <p>Chọn ngày, khung giờ, cơ sở, sức chứa và thiết bị (máy chiếu, bảng).</p>
                            </div>
                            <div className="step-item">
                                <div className="step-number">2</div>
                                <h4>ĐẶT CHỖ & XÁC NHẬN</h4>
                                <p>Nhập mục đích học tập. Phòng họp duyệt tức thì hoặc theo phê duyệt.</p>
                            </div>
                            <div className="step-item">
                                <div className="step-number">3</div>
                                <h4>CHECK-IN ĐÚNG GIỜ</h4>
                                <p>Check-in qua hệ thống tại phòng trong 15 phút đầu để tránh trạng thái No-show.</p>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button type="button" className="btn-primary-outline" onClick={() => navigate('/spaces')}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                TRA CỨU PHÒNG KHẢ DỤNG →
                            </button>
                            <button type="button" className="btn-warning">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                HƯỚNG DẪN & QUY ĐỊNH →
                            </button>
                        </div>

                        <div className="warning-alert">
                            <strong>! Lưu ý quan trọng:</strong> Sinh viên cần thực hiện check-in trong vòng <strong>15 phút</strong> đầu của khung giờ đặt. Các booking quá giờ chưa xác nhận sẽ bị hệ thống tự động hủy, chuyển thành trạng thái <em>NO_SHOW</em> và tính vào hạn mức phạt quy chế sử dụng tài nguyên trường.
                        </div>
                    </div>

                    <div className="portal-card login-card">
                        <div className="login-lock-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <h2>ĐĂNG NHẬP</h2>

                        <form className="login-form" onSubmit={handleLogin}>
                            {error && <div className="login-error">{error}</div>}

                            <div className="input-group">
                                <label>Nhập tài khoản hoặc email</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nhập mã sinh viên hoặc email @edu.vn"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Mật khẩu</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" className="toggle-pwd" onClick={() => setShowPassword(!showPassword)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            {showPassword ? <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /> : <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>}
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal', color: '#64748b' }}>
                                    <input type="checkbox" /> Ghi nhớ đăng nhập
                                </label>
                                <a href="#" className="forgot-link">Quên mật khẩu?</a>
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP →'}
                            </button>
                        </form>
                    </div>
                </main>

                <div className="marquee-container">
                    <div className="marquee-text">
                        Đơn vị phát triển: Nhóm 7 Phát triển phần mềm hướng dịch vụ - Địa chỉ: Số 41A đường Phú Diễn, P.Phú Diễn, TP. Hà Nội - Điện thoại: 0879715366
                    </div>
                </div>

                <footer className="portal-footer">
                    <div className="features-grid">
                        <div className="feature-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <div className="feature-text">
                                <h5>Bảo Mật Tuyệt Đối</h5>
                                <p>Xác thực JWT & dữ liệu mã hóa đa tầng</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <div className="feature-text">
                                <h5>Kiểm Tra Trùng Lịch</h5>
                                <p>Tự động đối soát lịch chính khóa & bảo trì</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <div className="feature-text">
                                <h5>Hỗ Trợ 24/7</h5>
                                <p>Đội ngũ kỹ thuật viên & quản lý phòng trực hỗ trợ</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <div className="feature-text">
                                <h5>Check-in Nhanh Chóng</h5>
                                <p>Xác nhận có mặt linh hoạt, minh bạch điểm tín nhiệm</p>
                            </div>
                        </div>
                    </div>
                    <div className="footer-copy">
                        Bản quyền © 2025 - 2026 EduSpace - Hệ Thống Quản Lý Không Gian Học Tập Dùng Chung.<br/>
                        Kiến trúc Web App hiện đại • Tích hợp Cổng xác thực định danh tập trung (SSO)
                    </div>
                </footer>
            </div>
        </>
    );
}