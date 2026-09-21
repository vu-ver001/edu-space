import { useState, useEffect } from 'react';

const settingsStyles = `
  .settings-container { max-width: 900px; margin: 0 auto; padding-bottom: 40px; font-family: 'Inter', sans-serif; }
  .settings-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .settings-title { margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 700; }
  
  .settings-card { background: white; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; border: 1px solid #e2e8f0; }
  .settings-card-title { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-top: 0; margin-bottom: 24px; color: #1e3a8a; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #334155; font-size: 0.95rem; }
  .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 0.95rem; color: #0f172a; transition: all 0.2s; }
  .form-control:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
  
  .menu-item-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
  .menu-item-row .form-group { margin-bottom: 0; }
  
  .btn-save { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; box-shadow: 0 4px 6px rgba(37,99,235,0.2); }
  .btn-save:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-save:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
  
  .note-box { background: #eff6ff; color: #1e40af; padding: 12px 16px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
`;

export const GeneralSettingsPage = () => {
    const [loading, setLoading] = useState(false);

    // Khởi tạo state với các giá trị mặc định của hệ thống
    const [settings, setSettings] = useState({
        appName: 'EduSpace',
        logoIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',

        // Menu Sinh viên
        stuHomeLabel: 'Trang chủ', stuHomeIcon: '🏠',
        stuSpaceLabel: 'Tìm & Đặt phòng', stuSpaceIcon: '🔍',

        // Menu Staff
        staffHomeLabel: 'Dashboard Vận hành', staffHomeIcon: '🖥️',
        staffApproveLabel: 'Duyệt đặt chỗ', staffApproveIcon: '✅',

        // Menu Admin
        adminStatsLabel: 'Thống kê tổng quan', adminStatsIcon: '📊',
        adminUsersLabel: 'Quản lý người dùng', adminUsersIcon: '👥',
    });

    // Tải cấu hình từ localStorage khi mở trang
    useEffect(() => {
        const savedSettings = localStorage.getItem('eduspace_ui_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            // TODO: Nối API PUT /api/settings sau
            localStorage.setItem('eduspace_ui_settings', JSON.stringify(settings));

            alert('Đã lưu cấu hình thành công! Giao diện sẽ được cập nhật lại.');
            window.location.reload(); // Reload lại trang để PortalLayout ăn cấu hình mới ngay lập tức

            setLoading(false);
        }, 600);
    };

    return (
        <div className="settings-container">
            <style>{settingsStyles}</style>

            <div className="settings-header-top">
                <h2 className="settings-title">Cấu hình Hệ thống & Giao diện</h2>
                <button className="btn-save" onClick={handleSave} disabled={loading}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    {loading ? 'Đang lưu dữ liệu...' : 'Lưu cài đặt'}
                </button>
            </div>

            {/* BLOCK 1: NHẬN DIỆN THƯƠNG HIỆU */}
            <div className="settings-card">
                <h3 className="settings-card-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    1. Nhận diện thương hiệu
                </h3>

                <div className="form-group">
                    <label>Tên Ứng dụng (Hiển thị ở Logo và Tiêu đề)</label>
                    <input
                        className="form-control"
                        value={settings.appName}
                        onChange={(e) => handleChange('appName', e.target.value)}
                        placeholder="VD: EduSpace"
                    />
                </div>
                <div className="form-group">
                    <label>Biểu tượng Logo (Mã SVG hoặc Link ảnh)</label>
                    <div className="note-box">
                        Khuyên dùng mã thẻ <code>&lt;svg&gt;...&lt;/svg&gt;</code> nét mảnh, màu trắng để xuyên thấu được background của thanh điều hướng.
                    </div>
                    <textarea
                        className="form-control"
                        rows={3}
                        value={settings.logoIcon}
                        onChange={(e) => handleChange('logoIcon', e.target.value)}
                        placeholder="Dán mã SVG hoặc link hình ảnh vào đây..."
                    />
                </div>
            </div>

            {/* BLOCK 2: MENU SINH VIÊN */}
            <div className="settings-card">
                <h3 className="settings-card-title">2. Cấu hình Menu Sinh viên (STUDENT)</h3>

                <div className="menu-item-row">
                    <div className="form-group">
                        <label>Menu 1: Text hiển thị</label>
                        <input className="form-control" value={settings.stuHomeLabel} onChange={(e) => handleChange('stuHomeLabel', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon (Emoji/SVG/Class)</label>
                        <input className="form-control" value={settings.stuHomeIcon} onChange={(e) => handleChange('stuHomeIcon', e.target.value)} />
                    </div>
                </div>

                <div className="menu-item-row">
                    <div className="form-group">
                        <label>Menu 2: Text hiển thị</label>
                        <input className="form-control" value={settings.stuSpaceLabel} onChange={(e) => handleChange('stuSpaceLabel', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon (Emoji/SVG/Class)</label>
                        <input className="form-control" value={settings.stuSpaceIcon} onChange={(e) => handleChange('stuSpaceIcon', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* BLOCK 3: MENU QUẢN TRỊ VIÊN */}
            <div className="settings-card">
                <h3 className="settings-card-title">3. Cấu hình Menu Quản trị (ADMIN)</h3>
                <div className="menu-item-row">
                    <div className="form-group">
                        <label>Menu 1: Text hiển thị</label>
                        <input className="form-control" value={settings.adminStatsLabel} onChange={(e) => handleChange('adminStatsLabel', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon (Emoji/SVG/Class)</label>
                        <input className="form-control" value={settings.adminStatsIcon} onChange={(e) => handleChange('adminStatsIcon', e.target.value)} />
                    </div>
                </div>
                <div className="menu-item-row">
                    <div className="form-group">
                        <label>Menu 2: Text hiển thị</label>
                        <input className="form-control" value={settings.adminUsersLabel} onChange={(e) => handleChange('adminUsersLabel', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon (Emoji/SVG/Class)</label>
                        <input className="form-control" value={settings.adminUsersIcon} onChange={(e) => handleChange('adminUsersIcon', e.target.value)} />
                    </div>
                </div>
            </div>

        </div>
    );
};