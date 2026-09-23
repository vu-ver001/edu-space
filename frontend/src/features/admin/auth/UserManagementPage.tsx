import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const userStyles = `
  .user-mgt-container { max-width: 1100px; margin: 0 auto; padding-bottom: 40px; font-family: 'Inter', sans-serif; }
  .user-mgt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .user-mgt-title { margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 700; }
  
  .tab-container { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  .tab-btn { padding: 8px 16px; border: none; background: transparent; font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 6px; transition: 0.2s; display: flex; align-items: center; gap: 8px;}
  .tab-btn.active { background: #eff6ff; color: #2563eb; }
  .tab-btn:hover:not(.active) { background: #f1f5f9; color: #334155; }
  
  .card-box { background: white; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  
  .toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
  .search-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; width: 300px; outline: none; transition: 0.2s; }
  .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
  
  .filter-group { display: flex; gap: 8px; }
  .filter-btn { padding: 6px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; font-size: 0.85rem; cursor: pointer; color: #64748b; font-weight: 500; transition: 0.2s; }
  .filter-btn:hover { background: #f8fafc; color: #0f172a; }
  .filter-btn.active { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

  .data-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; text-align: left; }
  .data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
  .data-table th { color: #64748b; font-weight: 600; background: #f8fafc; }
  .data-table tr:hover { background: #f8fafc; }
  
  .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
  .status-active { background: #dcfce7; color: #166534; }
  .status-locked { background: #fee2e2; color: #991b1b; }
  
  .action-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 6px; border-radius: 4px; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
  .action-btn:hover { background: #e2e8f0; color: #0f172a; }
  .action-btn.danger:hover { background: #fee2e2; color: #991b1b; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group label { font-weight: 500; color: #334155; font-size: 0.95rem; }
  .form-control { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; outline: none; }
  .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
  
  .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
  
  .role-badge { padding: 4px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .role-student { background: #dbeafe; color: #1e40af; }
  .role-staff { background: #fef08a; color: #854d0e; }
  .role-admin { background: #fecdd3; color: #9f1239; }

  .import-type-selector { display: flex; gap: 24px; margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .radio-label { display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; color: #1e293b; }
`;

interface UserData {
    id?: number;
    fullName: string;
    dob: string;
    email: string;
    role: string;
    username?: string;
    password?: string;
    isActive?: boolean;
    studentId?: string;
    department?: string;
}

export const UserManagementPage = () => {
    const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'csv'>('list');
    const [loading, setLoading] = useState(false);
    const [listFilter, setListFilter] = useState<'ALL' | 'STUDENT' | 'STAFF' | 'ADMIN'>('ALL');

    // State lưu dữ liệu thật từ Backend
    const [usersList, setUsersList] = useState<UserData[]>([]);

    const [manualForm, setManualForm] = useState<UserData>({
        fullName: '', dob: '', email: '', role: 'STUDENT', studentId: '', department: ''
    });

    const [importType, setImportType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
    const [csvData, setCsvData] = useState<UserData[]>([]);
    const [fileName, setFileName] = useState<string>('');

    // 1. GỌI API LẤY DANH SÁCH USER KHI MỞ TAB 'list'
    useEffect(() => {
        if (activeTab === 'list') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsersList(response.data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
        }
    };

    const filteredUsers = usersList.filter(user => listFilter === 'ALL' || user.role === listFilter);

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setManualForm({ ...manualForm, [e.target.name]: e.target.value });
    };

    // 2. GỌI API THÊM USER THỦ CÔNG
    const handleSaveManual = async () => {
        if (!manualForm.email || !manualForm.fullName || !manualForm.dob) {
            return alert('Vui lòng điền đủ thông tin bắt buộc (Họ Tên, Email, Ngày sinh)');
        }

        setLoading(true);
        try {
            const payload = {
                email: manualForm.email,
                fullName: manualForm.fullName,
                role: manualForm.role,
                dob: manualForm.dob,
                password: manualForm.dob.replace(/[-/]/g, ''),
                studentId: manualForm.role === 'STUDENT' ? manualForm.studentId : null,
                department: manualForm.role !== 'STUDENT' ? manualForm.department : null
            };

            await api.post('/api/users', payload);
            alert('Tạo tài khoản thành công!');

            setManualForm({ fullName: '', dob: '', email: '', role: 'STUDENT', studentId: '', department: '' });
            setListFilter(manualForm.role as any);
            setActiveTab('list'); // Đẩy về tab danh sách, useEffect sẽ tự động gọi lại fetchUsers
        } catch (error: any) {
            alert('Lỗi tạo tài khoản: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        } finally {
            setLoading(false);
        }
    };

    // 3. GỌI API KHÓA/MỞ KHÓA TÀI KHOẢN
    const handleToggleStatus = async (userId: number | undefined) => {
        if (!userId) return;
        try {
            await api.patch(`/api/users/${userId}/toggle-status`);
            fetchUsers(); // Cập nhật lại bảng ngay sau khi đổi trạng thái thành công
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể thay đổi trạng thái'));
        }
    };

    // XỬ LÝ IMPORT CSV (Tạm thời Frontend - Để Backend hỗ trợ Bulk API sau)
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
                    const [studentId, fullName, dob, email] = cols;
                    if (email) parsedUser = { ...parsedUser, studentId: studentId?.trim(), fullName: fullName?.trim(), dob: dob?.trim(), email: email?.trim(), username: studentId?.trim() || email.trim().split('@')[0] };
                } else {
                    const [fullName, dob, email, department] = cols;
                    if (email) parsedUser = { ...parsedUser, fullName: fullName?.trim(), dob: dob?.trim(), email: email?.trim(), department: department?.trim(), username: email.trim().split('@')[0] };
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

    const handleSaveCSV = async () => {
        if (csvData.length === 0) return alert('Chưa có dữ liệu');
        setLoading(true);

        // Gọi API POST cho từng dòng (Nên tối ưu bằng Bulk API ở Backend sau này)
        let successCount = 0;
        for (const user of csvData) {
            try {
                await api.post('/api/users', { ...user, password: user.password });
                successCount++;
            } catch (err) {
                console.error(`Lỗi import user ${user.email}:`, err);
            }
        }

        alert(`Đã import thành công ${successCount}/${csvData.length} tài khoản!`);
        setCsvData([]);
        setFileName('');
        setLoading(false);
        setListFilter(importType);
        setActiveTab('list');
    };

    return (
        <div className="user-mgt-container">
            <style>{userStyles}</style>

            <div className="user-mgt-header">
                <h2 className="user-mgt-title">Quản lý Người dùng</h2>
            </div>

            <div className="tab-container">
                <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Danh sách tài khoản
                </button>
                <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Thêm thủ công
                </button>
                <button className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`} onClick={() => setActiveTab('csv')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Import từ CSV
                </button>
            </div>

            {/* TAB 1: DANH SÁCH */}
            {activeTab === 'list' && (
                <div className="card-box">
                    <div className="toolbar">
                        <input type="text" className="search-input" placeholder="Tìm kiếm theo Tên, Email, Username..." />

                        <div className="filter-group">
                            <button className={`filter-btn ${listFilter === 'ALL' ? 'active' : ''}`} onClick={() => setListFilter('ALL')}>Tất cả</button>
                            <button className={`filter-btn ${listFilter === 'STUDENT' ? 'active' : ''}`} onClick={() => setListFilter('STUDENT')}>Sinh viên</button>
                            <button className={`filter-btn ${listFilter === 'STAFF' ? 'active' : ''}`} onClick={() => setListFilter('STAFF')}>Nhân viên</button>
                            <button className={`filter-btn ${listFilter === 'ADMIN' ? 'active' : ''}`} onClick={() => setListFilter('ADMIN')}>Quản trị viên</button>
                        </div>
                    </div>

                    <div style={{overflowX: 'auto'}}>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Username</th>
                                <th>Họ và Tên</th>
                                <th>Email</th>
                                <th>Thông tin thêm</th>
                                <th>Phân quyền</th>
                                <th>Trạng thái</th>
                                <th style={{textAlign: 'center'}}>Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.studentId && <span style={{fontSize: '0.85rem', color: '#64748b'}}>Mã SV: {user.studentId}</span>}
                                        {user.department && <span style={{fontSize: '0.85rem', color: '#64748b'}}>Phòng: {user.department}</span>}
                                    </td>
                                    <td><span className={`role-badge role-${user.role?.toLowerCase()}`}>{user.role}</span></td>
                                    <td>
                                        {user.isActive ? <span className="status-badge status-active">Đang hoạt động</span> : <span className="status-badge status-locked">Bị khóa</span>}
                                    </td>

                                    <td style={{textAlign: 'center'}}>
                                        <button className="action-btn" title="Chỉnh sửa">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        {/* Nút Khóa / Mở khóa tích hợp API */}
                                        <button
                                            className="action-btn danger"
                                            title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                            onClick={() => handleToggleStatus(user.id)}
                                        >
                                            {user.isActive ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{textAlign: 'center', padding: '24px', color: '#64748b'}}>Không tìm thấy tài khoản nào.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: THÊM THỦ CÔNG */}
            {activeTab === 'manual' && (
                <div className="card-box">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Phân quyền (Role)</label>
                            <select name="role" className="form-control" value={manualForm.role} onChange={handleManualChange}>
                                <option value="STUDENT">Sinh viên (STUDENT)</option>
                                <option value="STAFF">Nhân viên Vận hành (STAFF)</option>
                                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            </select>
                        </div>

                        {manualForm.role === 'STUDENT' ? (
                            <div className="form-group">
                                <label>Mã Sinh Viên</label>
                                <input type="text" name="studentId" className="form-control" value={manualForm.studentId} onChange={handleManualChange} placeholder="VD: SV2021001" />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Phòng ban / Đơn vị</label>
                                <input type="text" name="department" className="form-control" value={manualForm.department} onChange={handleManualChange} placeholder="VD: Phòng Hành chính" />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Họ và Tên</label>
                            <input type="text" name="fullName" className="form-control" value={manualForm.fullName} onChange={handleManualChange} placeholder="Nguyễn Văn A" />
                        </div>
                        <div className="form-group">
                            <label>Địa chỉ Email</label>
                            <input type="email" name="email" className="form-control" value={manualForm.email} onChange={handleManualChange} placeholder="nva@eduspace.vn" />
                        </div>
                        <div className="form-group">
                            <label>Ngày sinh (Làm mật khẩu mặc định)</label>
                            <input type="date" name="dob" className="form-control" value={manualForm.dob} onChange={handleManualChange} />
                        </div>
                    </div>
                    <button className="btn-primary" onClick={handleSaveManual} disabled={loading}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                    </button>
                </div>
            )}

            {/* TAB 3: IMPORT TỪ CSV */}
            {activeTab === 'csv' && (
                <div className="card-box">
                    <div className="import-type-selector">
                        <label className="radio-label">
                            <input type="radio" name="importType" checked={importType === 'STUDENT'} onChange={() => { setImportType('STUDENT'); setCsvData([]); }} />
                            Tải lên danh sách Sinh Viên
                        </label>
                        <label className="radio-label">
                            <input type="radio" name="importType" checked={importType === 'STAFF'} onChange={() => { setImportType('STAFF'); setCsvData([]); }} />
                            Tải lên danh sách Cán bộ / Nhân viên
                        </label>
                    </div>

                    <label style={{border: '2px dashed #cbd5e1', padding: '40px', textAlign: 'center', borderRadius: '8px', background: '#f8fafc', marginBottom: '24px', cursor: 'pointer', display: 'block'}}>
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{display: 'none'}} />
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" style={{marginBottom: '12px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <h4 style={{margin: '0 0 8px 0', color: '#0f172a'}}>Kéo thả file CSV vào đây hoặc click để chọn</h4>
                        <p style={{margin: 0, color: '#64748b', fontSize: '0.9rem'}}>
                            Định dạng yêu cầu:
                            {importType === 'STUDENT' ? ' Mã SV, Họ Tên, Ngày Sinh (DD/MM/YYYY), Email' : ' Họ Tên, Ngày Sinh (DD/MM/YYYY), Email, Phòng ban'}
                        </p>
                    </label>

                    {csvData.length > 0 && (
                        <div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                                <strong style={{color: '#1e3a8a'}}>Đã phân tích: {fileName} ({csvData.length} dòng)</strong>
                                <button className="btn-primary" onClick={handleSaveCSV} disabled={loading}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    {loading ? 'Đang Import...' : 'Xác nhận Import'}
                                </button>
                            </div>

                            <table className="data-table" style={{marginTop: '16px'}}>
                                <thead>
                                <tr>
                                    {importType === 'STUDENT' && <th>Mã SV</th>}
                                    <th>Họ và Tên</th>
                                    {importType === 'STAFF' && <th>Phòng ban</th>}
                                    <th>Username (Tự tạo)</th>
                                    <th>Mật khẩu (Tự tạo)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {csvData.slice(0, 3).map((user, idx) => (
                                    <tr key={idx}>
                                        {importType === 'STUDENT' && <td>{user.studentId}</td>}
                                        <td>{user.fullName}<br/><span style={{fontSize:'0.8rem', color:'#64748b'}}>{user.email}</span></td>
                                        {importType === 'STAFF' && <td>{user.department}</td>}
                                        <td><strong>{user.username}</strong></td>
                                        <td><code>{user.password}</code></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {csvData.length > 3 && (
                                <div style={{textAlign: 'center', padding: '12px', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem', border: '1px solid #e2e8f0', borderTop: 'none'}}>
                                    ... và {csvData.length - 3} tài khoản khác được ẩn đi.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};