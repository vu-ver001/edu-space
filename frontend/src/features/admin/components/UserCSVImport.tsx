import React, { useState } from 'react';

export interface UserData {
    id?: number;
    fullName: string;
    dob: string;
    email: string;
    role: string;
    username?: string;
    password?: string;
    isActive?: boolean;
    userCode?: string;
    department?: string;
    className?: string; // Bổ sung trường Lớp
}

interface UserCSVImportProps {
    onSubmit: (csvData: UserData[], importType: string) => void;
    onCancel: () => void;
    loading?: boolean;
    errorMessage?: string | null;
    successMessage?: string | null;
}

export const UserCSVImport: React.FC<UserCSVImportProps> = ({
                                                                onSubmit,
                                                                onCancel,
                                                                loading = false,
                                                                errorMessage,
                                                                successMessage
                                                            }) => {
    const [importType, setImportType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
    const [csvData, setCsvData] = useState<UserData[]>([]);
    const [fileName, setFileName] = useState<string>('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            const lines = text.split('\n');
            const parsedUsers: UserData[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = line.split(',');

                let parsedUser: UserData = { fullName: '', dob: '', email: '', role: importType };

                if (importType === 'STUDENT') {
                    // Cập nhật để đọc thêm cột className
                    const [userCode, fullName, dob, className, email] = cols;
                    if (email) parsedUser = {
                        ...parsedUser,
                        userCode: userCode?.trim(),
                        fullName: fullName?.trim(),
                        dob: dob?.trim(),
                        className: className?.trim(),
                        email: email?.trim(),
                        username: userCode?.trim() || email.trim().split('@')[0]
                    };
                } else {
                    const [userCode, fullName, dob, email, department] = cols;
                    if (email) parsedUser = {
                        ...parsedUser,
                        userCode: userCode?.trim(),
                        fullName: fullName?.trim(),
                        dob: dob?.trim(),
                        email: email?.trim(),
                        department: department?.trim(),
                        username: userCode?.trim() || email.trim().split('@')[0]
                    };
                }

                if (parsedUser.email) {
                    parsedUser.password = parsedUser.dob ? parsedUser.dob.replace(/[-/]/g, '') : '123456';
                    parsedUsers.push(parsedUser);
                }
            }
            setCsvData(parsedUsers);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div>
            {successMessage && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {errorMessage}
                </div>
            )}

            <div className="import-type-selector" style={{ display: 'flex', gap: '24px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer', color: '#1e293b' }}>
                    <input type="radio" name="importType" checked={importType === 'STUDENT'} onChange={() => { setImportType('STUDENT'); setCsvData([]); setFileName(''); }} />
                    Danh sách Sinh Viên
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer', color: '#1e293b' }}>
                    <input type="radio" name="importType" checked={importType === 'STAFF'} onChange={() => { setImportType('STAFF'); setCsvData([]); setFileName(''); }} />
                    Danh sách Cán bộ / Nhân viên
                </label>
            </div>

            <label style={{border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', borderRadius: '8px', background: '#f8fafc', marginBottom: '24px', cursor: 'pointer', display: 'block'}}>
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{display: 'none'}} />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" style={{marginBottom: '12px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <h4 style={{margin: '0 0 8px 0', color: '#0f172a'}}>Kéo thả file CSV vào đây hoặc click để chọn</h4>
                <p style={{margin: 0, color: '#64748b', fontSize: '0.9rem'}}>
                    Định dạng:
                    {importType === 'STUDENT' ? ' Mã SV, Họ Tên, Ngày Sinh (DD/MM/YYYY), Lớp, Email' : ' Mã MNV, Họ Tên, Ngày Sinh (DD/MM/YYYY), Email, Phòng ban'}
                </p>
            </label>

            {csvData.length > 0 && (
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    <strong style={{color: '#1e3a8a', display: 'block', marginBottom: '12px'}}>Đã phân tích: {fileName} ({csvData.length} dòng)</strong>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                            <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{importType === 'STUDENT' ? 'Mã SV' : 'Mã NV'}</th>
                            <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Họ và Tên</th>
                            {importType === 'STUDENT' && <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Lớp</th>}
                            <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                            {importType === 'STAFF' && <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Phòng ban</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {csvData.slice(0, 5).map((user, idx) => (
                            <tr key={idx}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{user.userCode}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{user.fullName}</td>
                                {importType === 'STUDENT' && <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{user.className}</td>}
                                <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{user.email}</td>
                                {importType === 'STAFF' && <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{user.department}</td>}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {csvData.length > 5 && (
                        <div style={{textAlign: 'center', padding: '8px', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderTop: 'none'}}>
                            ... và {csvData.length - 5} tài khoản khác được ẩn đi.
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading || !!successMessage}
                    style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Hủy bỏ
                </button>
                <button
                    className="btn-primary"
                    onClick={() => onSubmit(csvData, importType)}
                    disabled={loading || csvData.length === 0 || !!successMessage}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {loading ? 'Đang Import...' : 'Xác nhận Import'}
                </button>
            </div>
        </div>
    );
};