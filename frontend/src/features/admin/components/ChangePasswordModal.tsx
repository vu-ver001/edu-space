import React, { useState } from 'react';
import api from '../../../services/api';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // Báo lỗi chung (trên cùng)
    const [success, setSuccess] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Báo lỗi riêng từng ô

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        // Xóa viền đỏ của ô đó khi người dùng bắt đầu gõ lại
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const errors: Record<string, string> = {};

        // Bắt lỗi từng trường
        if (!form.oldPassword) errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';

        if (!form.newPassword) {
            errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
        } else if (form.newPassword.length < 6) {
            errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
        }

        if (!form.confirmPassword) {
            errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
        } else if (form.newPassword !== form.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }

        // Nếu có lỗi, đánh dấu đỏ các ô và dừng submit
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Vui lòng điền đầy đủ các thông tin bên dưới.');
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/auth/change-password', {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            });

            setSuccess('Đổi mật khẩu thành công!');

            // Xóa form và tự động đóng
            setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setFieldErrors({});
            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 1500);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    // Style chung để đổi màu viền và nền khi có lỗi
    const getInputStyle = (fieldName: string) => ({
        padding: '10px 14px',
        border: fieldErrors[fieldName] ? '1px solid #ef4444' : '1px solid #cbd5e1',
        borderRadius: '6px',
        outline: 'none',
        backgroundColor: fieldErrors[fieldName] ? '#fef2f2' : 'white',
        transition: '0.2s'
    });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '10px',
                width: '450px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Thay đổi mật khẩu</h3>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Đảm bảo an toàn cho tài khoản của bạn</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Báo lỗi chung */}
                    {error && (
                        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            {error}
                        </div>
                    )}
                    {/* Báo thành công */}
                    {success && (
                        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            {success}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 500, color: '#334155', fontSize: '0.95rem' }}>Mật khẩu hiện tại *</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={form.oldPassword}
                                onChange={handleChange}
                                style={getInputStyle('oldPassword')}
                            />
                            {fieldErrors.oldPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.oldPassword}</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 500, color: '#334155', fontSize: '0.95rem' }}>Mật khẩu mới *</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                style={getInputStyle('newPassword')}
                            />
                            {fieldErrors.newPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.newPassword}</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 500, color: '#334155', fontSize: '0.95rem' }}>Xác nhận mật khẩu mới *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                style={getInputStyle('confirmPassword')}
                            />
                            {fieldErrors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            {loading ? 'Đang cập nhật...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};