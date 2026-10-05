import { useState, useEffect } from 'react';
import api from '../services/api';

export const ProfilePage = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/users/me');
            setProfile(response.data);
        } catch (error) {
            console.error('Lỗi khi tải thông tin hồ sơ:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Đang tải thông tin hồ sơ...</div>;
    if (!profile) return <div>Không tìm thấy thông tin người dùng.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#0f172a', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                Hồ sơ cá nhân
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.fullName}</div>
                </div>

                <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Email hệ thống</label>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.email}</div>
                </div>

                {/*<div>*/}
                {/*    <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Vai trò (Role)</label>*/}
                {/*    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#2563eb' }}>{profile.role}</div>*/}
                {/*</div>*/}

                <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngày sinh</label>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.dob || 'Chưa cập nhật'}</div>
                </div>

                {profile.role === 'STUDENT' && (
                    <>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Mã Sinh Viên</label>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.userCode || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Lớp học</label>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.className || 'Chưa cập nhật'}</div>
                        </div>
                    </>
                )}

                {profile.role !== 'STUDENT' && (
                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Phòng ban / Đơn vị</label>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{profile.department || 'Chưa cập nhật'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};