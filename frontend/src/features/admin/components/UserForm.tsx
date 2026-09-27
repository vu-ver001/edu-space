import React, { useState, useEffect } from 'react';

interface UserFormProps {
    initialData?: {
        id?: number;
        fullName: string;
        dob: string;
        email: string;
        role: string;
        studentId?: string;
        department?: string;
    };
    isEditMode?: boolean;
    onSubmit: (formData: any) => void;
    onCancel?: () => void;
    loading?: boolean;
    // Bổ sung 2 props để nhận thông báo từ ngoài truyền vào
    errorMessage?: string | null;
    successMessage?: string | null;
}

export const UserForm: React.FC<UserFormProps> = ({
                                                      initialData,
                                                      isEditMode = false,
                                                      onSubmit,
                                                      onCancel,
                                                      loading = false,
                                                      errorMessage,
                                                      successMessage
                                                  }) => {
    const [form, setForm] = useState({
        fullName: '',
        dob: '',
        email: '',
        role: 'STUDENT',
        studentId: '',
        department: ''
    });

    // Thêm state lỗi nội bộ (dành cho việc check rỗng các trường)
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setForm({
                fullName: initialData.fullName || '',
                dob: initialData.dob || '',
                email: initialData.email || '',
                role: initialData.role || 'STUDENT',
                studentId: initialData.studentId || '',
                department: initialData.department || ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setLocalError(null); // Xóa lỗi nội bộ khi người dùng bắt đầu nhập lại
    };

    const formatPasswordFromDob = (dobStr: string) => {
        if (!dobStr) return '123456';
        const parts = dobStr.split('-');
        if (parts.length === 3) {
            return parts[2] + parts[1] + parts[0];
        }
        return dobStr.replace(/[-/]/g, '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Cập nhật check lỗi rỗng vào form thay vì gọi alert
        if (!form.email || !form.fullName || !form.dob) {
            setLocalError('Vui lòng điền đầy đủ các thông tin bắt buộc (Họ Tên, Email, Ngày sinh).');
            return;
        }

        const payload = {
            ...form,
            password: isEditMode ? undefined : formatPasswordFromDob(form.dob),
            studentId: form.role === 'STUDENT' ? form.studentId : null,
            department: form.role !== 'STUDENT' ? form.department : null
        };

        onSubmit(payload);
    };

    // Hiển thị lỗi nội bộ trước (nếu có), nếu không thì hiển thị lỗi do API báo về
    const displayError = localError || errorMessage;

    return (
        <form onSubmit={handleSubmit}>

            {/* THÔNG BÁO THÀNH CÔNG */}
            {successMessage && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    {successMessage}
                </div>
            )}

            {/* THÔNG BÁO LỖI */}
            {displayError && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {displayError}
                </div>
            )}

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>Phân quyền (Role) *</label>
                    <select
                        name="role"
                        className="form-control"
                        value={form.role}
                        onChange={handleChange}
                        style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                        <option value="STUDENT">Sinh viên (STUDENT)</option>
                        <option value="STAFF">Nhân viên Vận hành (STAFF)</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    </select>
                </div>

                {form.role === 'STUDENT' ? (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#334155' }}>Mã Sinh Viên</label>
                        <input
                            type="text"
                            name="studentId"
                            className="form-control"
                            value={form.studentId}
                            onChange={handleChange}
                            placeholder="VD: 2311063325"
                            style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                ) : (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#334155' }}>Phòng ban / Đơn vị</label>
                        <input
                            type="text"
                            name="department"
                            className="form-control"
                            value={form.department}
                            onChange={handleChange}
                            placeholder="VD: Phòng Hành chính"
                            style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>Họ và Tên *</label>
                    <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>Địa chỉ Email *</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="nva@eduspace.vn"
                        style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>
                        {isEditMode ? 'Ngày sinh *' : 'Ngày sinh (Làm mật khẩu) *'}
                    </label>
                    <input
                        type="date"
                        name="dob"
                        className="form-control"
                        value={form.dob}
                        onChange={handleChange}
                        style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !!successMessage}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {loading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo tài khoản')}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Hủy bỏ
                    </button>
                )}
            </div>
        </form>
    );
};