import React, { useState, useEffect } from 'react';

interface UserFormProps {
    initialData?: {
        id?: number;
        fullName: string;
        dob: string;
        email: string;
        role: string;
        userCode?: string;
        department?: string;
    };
    isEditMode?: boolean;
    onSubmit: (formData: any) => void;
    onCancel?: () => void;
    loading?: boolean;
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
        userCode: '',
        department: ''
    });

    const [localError, setLocalError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setForm({
                fullName: initialData.fullName || '',
                dob: initialData.dob || '',
                email: initialData.email || '',
                role: initialData.role || 'STUDENT',
                userCode: initialData.userCode || '',
                department: initialData.department || ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
        setLocalError(null);
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

        const errors: Record<string, string> = {};

        if (!form.fullName.trim()) errors.fullName = 'Vui lòng nhập Họ và Tên';
        if (!form.email.trim()) errors.email = 'Vui lòng nhập Địa chỉ Email';
        if (!form.dob) errors.dob = 'Vui lòng chọn Ngày sinh';

        if (!form.userCode?.trim()) {
            errors.userCode = form.role === 'STUDENT' ? 'Vui lòng nhập Mã Sinh Viên' : 'Vui lòng nhập Mã Định Danh';
        }
        if (form.role !== 'STUDENT' && !form.department?.trim()) {
            errors.department = 'Vui lòng nhập Phòng ban / Đơn vị';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setLocalError('Vui lòng kiểm tra lại các trường bị lỗi bên dưới.');
            return;
        }

        const payload = {
            ...form,
            password: isEditMode ? undefined : formatPasswordFromDob(form.dob),
            // Trả chung thuộc tính userCode lên BE
            userCode: form.userCode,
            department: form.role !== 'STUDENT' ? form.department : null
        };

        onSubmit(payload);
    };

    const displayError = localError || errorMessage;

    const getInputStyle = (fieldName: string, isDisabled: boolean = false) => ({
        padding: '10px 14px',
        border: fieldErrors[fieldName] ? '1px solid #ef4444' : '1px solid #cbd5e1',
        borderRadius: '6px',
        outline: 'none',
        backgroundColor: isDisabled ? '#f1f5f9' : (fieldErrors[fieldName] ? '#fef2f2' : 'white'),
        color: isDisabled ? '#64748b' : '#0f172a',
        cursor: isDisabled ? 'not-allowed' : 'text',
        transition: '0.2s'
    });

    return (
        <form onSubmit={handleSubmit}>
            {successMessage && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    {successMessage}
                </div>
            )}

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
                        value={form.role}
                        onChange={handleChange}
                        style={getInputStyle('role', isEditMode)}
                        disabled={isEditMode}
                    >
                        <option value="STUDENT">Sinh viên (STUDENT)</option>
                        <option value="STAFF">Nhân viên Vận hành (STAFF)</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>
                        {form.role === 'STUDENT' ? 'Mã Sinh Viên *' : 'Mã định danh (MNV) *'}
                    </label>
                    <input
                        type="text"
                        name="userCode"
                        value={form.userCode}
                        onChange={handleChange}
                        placeholder={form.role === 'STUDENT' ? "VD: 2311063325" : "VD: NV0123"}
                        style={getInputStyle('userCode', isEditMode)}
                        disabled={isEditMode}
                    />
                    {fieldErrors.userCode && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.userCode}</span>}
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>Họ và Tên *</label>
                    <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        style={getInputStyle('fullName')}
                    />
                    {fieldErrors.fullName && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.fullName}</span>}
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>Địa chỉ Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="nva@eduspace.vn"
                        style={getInputStyle('email', isEditMode)}
                        disabled={isEditMode}
                    />
                    {fieldErrors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.email}</span>}
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: '#334155' }}>
                        {isEditMode ? 'Ngày sinh *' : 'Ngày sinh (Làm mật khẩu) *'}
                    </label>
                    <input
                        type="date"
                        name="dob"
                        value={form.dob}
                        onChange={handleChange}
                        style={getInputStyle('dob')}
                    />
                    {fieldErrors.dob && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.dob}</span>}
                </div>

                {form.role !== 'STUDENT' && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: 500, color: '#334155' }}>Phòng ban / Đơn vị *</label>
                        <input
                            type="text"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            placeholder="VD: Phòng Hành chính"
                            style={getInputStyle('department', isEditMode)}
                            disabled={isEditMode}
                        />
                        {fieldErrors.department && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{fieldErrors.department}</span>}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    type="submit"
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