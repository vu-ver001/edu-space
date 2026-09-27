import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { UserForm } from '../components/UserForm';
import { UserCSVImport, type UserData } from '../components/UserCSVImport';

const userStyles = `
  .user-mgt-container { max-width: 1100px; margin: 0 auto; padding-bottom: 40px; font-family: 'Inter', sans-serif; }
  .user-mgt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .user-mgt-title { margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 700; }
  
  .card-box { background: white; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  
  .toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; gap: 16px; flex-wrap: wrap; }
  .toolbar-left { display: flex; gap: 16px; align-items: center; flex: 1; }
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
  
  .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
  
  .btn-secondary { background: white; color: #334155; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-secondary:hover { background: #f1f5f9; color: #0f172a; }

  .role-badge { padding: 4px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .role-student { background: #dbeafe; color: #1e40af; }
  .role-staff { background: #fef08a; color: #854d0e; }
  .role-admin { background: #fecdd3; color: #9f1239; }
`;

export const UserManagementPage = () => {
    const [loading, setLoading] = useState(false);
    const [listFilter, setListFilter] = useState<'ALL' | 'STUDENT' | 'STAFF' | 'ADMIN'>('ALL');
    const [usersList, setUsersList] = useState<UserData[]>([]);

    // STATE QUẢN LÝ POPUP CHO THÊM/SỬA TÀI KHOẢN
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [modalSuccess, setModalSuccess] = useState<string | null>(null);

    // STATE QUẢN LÝ POPUP CHO IMPORT CSV
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsersList(response.data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
        }
    };

    const filteredUsers = usersList.filter(user => listFilter === 'ALL' || user.role === listFilter);

    // Mở Modal Thêm/Sửa
    const handleOpenCreateModal = () => { setEditingUser(null); setModalError(null); setModalSuccess(null); setIsUserModalOpen(true); };
    const handleOpenEditModal = (user: UserData) => { setEditingUser(user); setModalError(null); setModalSuccess(null); setIsUserModalOpen(true); };
    const handleCloseUserModal = () => { setIsUserModalOpen(false); setEditingUser(null); setModalError(null); setModalSuccess(null); };

    // API Cập nhật/Thêm mới
    const handleSubmitForm = async (payload: any) => {
        setModalError(null);
        setModalSuccess(null);
        setLoading(true);
        try {
            if (editingUser?.id) {
                await api.put(`/api/users/${editingUser.id}`, payload);
                setModalSuccess('Cập nhật thông tin tài khoản thành công!');
            } else {
                await api.post('/api/users', payload);
                setModalSuccess('Tạo tài khoản thành công!');
                setListFilter(payload.role);
            }
            fetchUsers();
            setTimeout(() => handleCloseUserModal(), 1500);
        } catch (error: any) {
            setModalError(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Khóa / Mở khóa
    const handleToggleStatus = async (userId: number | undefined) => {
        if (!userId) return;
        try {
            await api.patch(`/api/users/${userId}/toggle-status`);
            fetchUsers();
        } catch (error: any) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Không thể thay đổi trạng thái'));
        }
    };

    // API Import CSV
    const handleSaveCSV = async (usersToImport: UserData[], roleType: string) => {
        if (usersToImport.length === 0) return alert('Chưa có dữ liệu');
        setLoading(true);
        let successCount = 0;
        for (const user of usersToImport) {
            try {
                await api.post('/api/users', { ...user, password: user.password });
                successCount++;
            } catch (err) {
                console.error(`Lỗi import user ${user.email}:`, err);
            }
        }
        alert(`Đã import thành công ${successCount}/${usersToImport.length} tài khoản!`);
        setLoading(false);
        setListFilter(roleType as any);
        fetchUsers();
        setIsCsvModalOpen(false); // Đóng modal CSV khi import xong
    };

    return (
        <div className="user-mgt-container">
            <style>{userStyles}</style>

            <div className="user-mgt-header">
                <h2 className="user-mgt-title">Quản lý Người dùng</h2>
            </div>

            <div className="card-box">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <input type="text" className="search-input" placeholder="Tìm kiếm theo Tên, Email, Username..." />
                        <div className="filter-group">
                            <button className={`filter-btn ${listFilter === 'ALL' ? 'active' : ''}`} onClick={() => setListFilter('ALL')}>Tất cả</button>
                            <button className={`filter-btn ${listFilter === 'STUDENT' ? 'active' : ''}`} onClick={() => setListFilter('STUDENT')}>Sinh viên</button>
                            <button className={`filter-btn ${listFilter === 'STAFF' ? 'active' : ''}`} onClick={() => setListFilter('STAFF')}>Nhân viên</button>
                            <button className={`filter-btn ${listFilter === 'ADMIN' ? 'active' : ''}`} onClick={() => setListFilter('ADMIN')}>Quản trị viên</button>
                        </div>
                    </div>

                    {/* HAI NÚT HÀNH ĐỘNG GỘP CHUNG VÀO TOOLBAR */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={() => setIsCsvModalOpen(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Import CSV
                        </button>
                        <button className="btn-primary" onClick={handleOpenCreateModal}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Thêm tài khoản
                        </button>
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
                                    <button className="action-btn" title="Chỉnh sửa" onClick={() => handleOpenEditModal(user)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="action-btn danger" title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'} onClick={() => handleToggleStatus(user.id)}>
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
                            <tr><td colSpan={7} style={{textAlign: 'center', padding: '24px', color: '#64748b'}}>Không tìm thấy tài khoản nào.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM/SỬA TÀI KHOẢN (USER FORM) */}
            {isUserModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
                                    {editingUser ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{editingUser ? 'Cập nhật thông tin chi tiết của người dùng' : 'Khai báo thông tin tài khoản và phân quyền hệ thống'}</span>
                                </div>
                            </div>
                            <button onClick={handleCloseUserModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>✕</button>
                        </div>
                        <UserForm initialData={editingUser || undefined} isEditMode={!!editingUser} loading={loading} onSubmit={handleSubmitForm} onCancel={handleCloseUserModal} errorMessage={modalError} successMessage={modalSuccess} />
                    </div>
                </div>
            )}

            {/* MODAL IMPORT CSV */}
            {isCsvModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#f8fafc', color: '#475569', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Nhập dữ liệu hàng loạt</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tải lên file định dạng .csv để tự động tạo nhiều tài khoản</span>
                                </div>
                            </div>
                            <button onClick={() => setIsCsvModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>✕</button>
                        </div>

                        <UserCSVImport onSubmit={handleSaveCSV} onCancel={() => setIsCsvModalOpen(false)} loading={loading} />
                    </div>
                </div>
            )}
        </div>
    );
};