import { useState, useEffect, useRef } from 'react';
import api from '../../../../services/api';

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

  /* CSS CHO NÚT UPLOAD VÀ PREVIEW */
  .upload-btn { background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; transition: 0.2s; }
  .upload-btn:hover { background: #e2e8f0; }
  .upload-btn:disabled { opacity: 0.6; cursor: wait; }
  .logo-preview-box { margin-top: 12px; padding: 12px 24px; background: #1e293b; border-radius: 6px; display: inline-flex; align-items: center; gap: 12px; }
  .logo-preview-box img { max-height: 32px; max-width: 150px; object-fit: contain; }
  .logo-preview-box .svg-wrapper svg { width: 32px; height: 32px; fill: currentColor; color: white; }
`;

export const GeneralSettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState({
        appName: 'EduSpace',
        logoIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',

        stuHomeLabel: 'Trang chủ', stuHomeIcon: '🏠',
        stuSpaceLabel: 'Tìm & Đặt phòng', stuSpaceIcon: '🔍',

        staffHomeLabel: 'Dashboard Vận hành', staffHomeIcon: '🖥️',
        staffApproveLabel: 'Duyệt đặt chỗ', staffApproveIcon: '✅',

        adminStatsLabel: 'Thống kê tổng quan', adminStatsIcon: '📊',
        adminUsersLabel: 'Quản lý người dùng', adminUsersIcon: '👥',
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('eduspace_ui_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Hàm Upload lên Cloudinary
    const handleUploadCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);

        // TODO: Thay thế 2 thông số này bằng thông tin tài khoản Cloudinary của bạn
        formData.append('upload_preset', 'eduspace_preset');
        const CLOUD_NAME = 'daxdtgf2j';

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.secure_url) {
                // Tự động điền link ảnh vừa up vào ô Logo
                handleChange('logoIcon', data.secure_url);
            } else {
                alert('Tải ảnh thất bại: ' + (data.error?.message || 'Lỗi không xác định'));
            }
        } catch (error) {
            alert('Lỗi kết nối đến Cloudinary');
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = Object.keys(settings).map(key => ({
                key,
                value: settings[key as keyof typeof settings]
            }));

            // GỌI API THẬT XUỐNG SPRING BOOT
            await api.put('/api/settings/bulk', payload);

            localStorage.setItem('eduspace_ui_settings', JSON.stringify(settings));

            alert('Đã lưu cấu hình thành công!');
            window.location.reload();
        } catch (error) {
            alert('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    // Hàm phụ trợ để render preview (giống cơ chế DynamicIcon)
    const renderPreview = (data: string) => {
        if (!data) return null;
        if (data.startsWith('<svg')) {
            return <div className="svg-wrapper" dangerouslySetInnerHTML={{ __html: data }} />;
        }
        if (data.startsWith('http')) {
            return <img src={data} alt="preview" />;
        }
        return <span style={{ fontSize: '24px', color: 'white' }}>{data}</span>;
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                        <label style={{ marginBottom: 0 }}>Biểu tượng Logo (Mã SVG hoặc Link ảnh)</label>

                        {/* NÚT UPLOAD ẨN */}
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleUploadCloudinary}
                        />
                        {/* NÚT UPLOAD HIỂN THỊ */}
                        <button
                            type="button"
                            className="upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            {isUploadingLogo ? 'Đang tải lên...' : 'Tải ảnh lên (Cloudinary)'}
                        </button>
                    </div>

                    <textarea
                        className="form-control"
                        rows={3}
                        value={settings.logoIcon}
                        onChange={(e) => handleChange('logoIcon', e.target.value)}
                        placeholder="Dán mã SVG hoặc link hình ảnh vào đây..."
                    />

                    {/* KHUNG PREVIEW TRỰC QUAN */}
                    <div className="logo-preview-box">
                        {renderPreview(settings.logoIcon)}
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.15rem' }}>{settings.appName || 'EduSpace'}</span>
                    </div>
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