import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../services/api';

const UPLOAD_PRESET = import.meta.env.UPLOAD_PRESET;
const CLOUD_NAME = import.meta.env.CLOUD_NAME;

type AppRole = 'STUDENT' | 'STAFF' | 'ADMIN';

const CUSTOMIZABLE_ITEMS: {
    key: string;
    iconKey: string;
    role: AppRole;
    defaultLabel: string;
    desc: string;
}[] = [
    { key: 'stuSpaceLabel',      iconKey: 'stuSpaceIcon',      role: 'STUDENT', defaultLabel: 'Tìm & Đặt phòng',    desc: 'Menu 1' },
    { key: 'staffHomeLabel',     iconKey: 'staffHomeIcon',     role: 'STAFF',   defaultLabel: 'Trang chủ',           desc: 'Menu 1' },
    { key: 'staffApproveLabel',  iconKey: 'staffApproveIcon',  role: 'STAFF',   defaultLabel: 'Duyệt đặt chỗ',      desc: 'Menu 2' },
    { key: 'adminStatsLabel',    iconKey: 'adminStatsIcon',    role: 'ADMIN',   defaultLabel: 'Trang chủ',           desc: 'Menu 1' },
    { key: 'adminUsersLabel',    iconKey: 'adminUsersIcon',    role: 'ADMIN',   defaultLabel: 'Quản lý người dùng',  desc: 'Menu 2' },
];

const FIXED_ITEMS: { role: AppRole; label: string; note: string }[] = [
    { role: 'STUDENT', label: 'Lịch đặt của tôi',       note: 'Cố định' },
    { role: 'STAFF',   label: 'Hỗ trợ check-in',         note: 'Cố định' },
    { role: 'STAFF',   label: 'Timeline hoạt động',      note: 'Cố định' },
    { role: 'STAFF',   label: 'Bảo trì',                 note: 'Cố định' },
    { role: 'STAFF',   label: 'Nhật ký kiểm toán',       note: 'Cố định' },
    { role: 'ADMIN',   label: 'Quản lý không gian',      note: 'Cố định (nhóm: Loại KG, Không gian, Tiện ích)' },
    { role: 'ADMIN',   label: 'Cấu hình chính sách',     note: 'Cố định' },
    { role: 'ADMIN',   label: 'Cài đặt chung',           note: 'Trang hiện tại' },
];

const ROLE_LABEL: Record<AppRole, string> = {
    STUDENT: 'Sinh viên',
    STAFF:   'Nhân viên vận hành',
    ADMIN:   'Quản trị viên',
};

const ROLE_COLORS: Record<AppRole, { bg: string; text: string; border: string }> = {
    STUDENT: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    STAFF:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    ADMIN:   { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
};

// Settings là Record<string, string> đơn giản — tránh union type phức tạp
type Settings = Record<string, string>;

const DEFAULT_SETTINGS: Settings = {
    appName:  'EduSpace',
    logoIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    stuSpaceLabel:     'Tìm & Đặt phòng',    stuSpaceIcon:     '🔍',
    staffHomeLabel:    'Trang chủ',           staffHomeIcon:    '🖥️',
    staffApproveLabel: 'Duyệt đặt chỗ',      staffApproveIcon: '✅',
    adminStatsLabel:   'Trang chủ',           adminStatsIcon:   '📊',
    adminUsersLabel:   'Quản lý người dùng',  adminUsersIcon:   '👥',
};

// Style helpers — dùng hàm trả CSSProperties thay vì gán vào object có mixed type
function saveBtnStyle(disabled: boolean): React.CSSProperties {
    return {
        background: disabled ? '#94a3b8' : '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '10px 22px',
        borderRadius: 8,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.92rem',
    };
}

function roleBadgeStyle(role: AppRole): React.CSSProperties {
    const c = ROLE_COLORS[role];
    return {
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 99,
        marginBottom: 14,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
    };
}

// Shared static styles
const card: React.CSSProperties        = { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24, border: '1px solid #e2e8f0' };
const cardTitle: React.CSSProperties   = { borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginTop: 0, marginBottom: 20, color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 };
const labelStyle: React.CSSProperties  = { display: 'block', marginBottom: 6, fontWeight: 500, color: '#334155', fontSize: '0.9rem' };
const inputStyle: React.CSSProperties  = { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box', fontSize: '0.9rem', color: '#0f172a', fontFamily: 'inherit' };
const rowStyle: React.CSSProperties    = { display: 'grid', gridTemplateColumns: '1.6fr 0.9fr', gap: 14, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 };
const fixedRow: React.CSSProperties    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 8 };
const noteBox: React.CSSProperties     = { background: '#eff6ff', color: '#1e40af', padding: '10px 14px', borderRadius: 6, fontSize: '0.83rem', marginBottom: 18, borderLeft: '4px solid #3b82f6' };
const uploadBtn: React.CSSProperties   = { background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' };
const previewBox: React.CSSProperties  = { marginTop: 12, padding: '10px 20px', background: '#1e293b', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 12 };

export const GeneralSettingsPage = () => {
    const [loading, setLoading]                 = useState(false);
    const [saved, setSaved]                     = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef                          = useRef<HTMLInputElement>(null);
    const [settings, setSettings]               = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const raw = localStorage.getItem('eduspace_ui_settings');
        if (raw) {
            try { setSettings(prev => ({ ...prev, ...JSON.parse(raw) })); } catch { /* ignore */ }
        }
    }, []);

    const set = (key: string, value: string) =>
        setSettings(prev => ({ ...prev, [key]: value }));

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', UPLOAD_PRESET);
        try {
            const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.secure_url) set('logoIcon', data.secure_url);
            else alert('Tải ảnh thất bại: ' + (data.error?.message || 'Lỗi không xác định'));
        } catch {
            alert('Lỗi kết nối Cloudinary');
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/api/settings/bulk', Object.entries(settings).map(([key, value]) => ({ key, value })));
            localStorage.setItem('eduspace_ui_settings', JSON.stringify(settings));
            setSaved(true);
            setTimeout(() => { setSaved(false); window.location.reload(); }, 1200);
        } catch {
            alert('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const renderLogoPreview = (data: string) => {
        if (!data) return null;
        if (data.startsWith('<svg')) {
            return <span style={{ color: '#fff' }} dangerouslySetInnerHTML={{ __html: data }} />;
        }
        if (data.startsWith('http')) {
            return <img src={data} alt="logo" style={{ maxHeight: 32, maxWidth: 140, objectFit: 'contain' }} />;
        }
        return <span style={{ fontSize: 24, color: '#fff' }}>{data}</span>;
    };

    const ROLES: AppRole[] = ['STUDENT', 'STAFF', 'ADMIN'];
    const isDisabled = loading || saved;

    return (
        <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 48, fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.45rem', fontWeight: 700 }}>
                    Cấu hình hệ thống &amp; giao diện
                </h2>
                <button style={saveBtnStyle(isDisabled)} onClick={handleSave} disabled={isDisabled}>
                    {saved ? (
                        <><span>✓</span> Đã lưu!</>
                    ) : loading ? (
                        <>Đang lưu...</>
                    ) : (
                        <><SaveIcon /> Lưu cài đặt</>
                    )}
                </button>
            </div>

            {/* ── BLOCK 1: Thương hiệu ── */}
            <div style={card}>
                <h3 style={cardTitle}><BrandIcon /> 1. Nhận diện thương hiệu</h3>

                <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Tên ứng dụng (hiển thị ở sidebar và tiêu đề tab)</label>
                    <input
                        style={inputStyle}
                        value={settings.appName ?? ''}
                        onChange={e => set('appName', e.target.value)}
                        placeholder="EduSpace"
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Logo (mã SVG hoặc link ảnh)</label>
                        <input
                            type="file"
                            accept="image/*,.svg"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleUpload}
                        />
                        <button
                            style={uploadBtn}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                        >
                            <UploadIcon /> {isUploadingLogo ? 'Đang tải...' : 'Upload lên Cloudinary'}
                        </button>
                    </div>
                    <textarea
                        style={{ ...inputStyle, resize: 'vertical' }}
                        rows={3}
                        value={settings.logoIcon ?? ''}
                        onChange={e => set('logoIcon', e.target.value)}
                        placeholder="Dán SVG hoặc URL ảnh..."
                    />
                    <div style={previewBox}>
                        {renderLogoPreview(settings.logoIcon ?? '')}
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
              {settings.appName || 'EduSpace'}
            </span>
                    </div>
                </div>
            </div>

            {/* ── BLOCK 2: Menu theo role ── */}
            <div style={card}>
                <h3 style={cardTitle}><MenuIcon /> 2. Tùy chỉnh nhãn menu theo vai trò</h3>
                <p style={noteBox}>
                    Chỉ các mục <strong>"Có thể tùy chỉnh"</strong> bên dưới mới nhận giá trị từ trang này.
                    Các mục còn lại dùng nhãn/icon cố định từ <code>roleNavigation.tsx</code>.
                </p>

                {ROLES.map(role => {
                    const customItems = CUSTOMIZABLE_ITEMS.filter(i => i.role === role);
                    const fixedItems  = FIXED_ITEMS.filter(i => i.role === role);

                    return (
                        <div key={role} style={{ marginBottom: 28 }}>
                            <span style={roleBadgeStyle(role)}>{ROLE_LABEL[role]}</span>

                            {/* Mục tùy chỉnh */}
                            {customItems.map(item => (
                                <div key={item.key} style={rowStyle}>
                                    <div>
                                        <label style={labelStyle}>{item.desc} — Nhãn hiển thị</label>
                                        <input
                                            style={inputStyle}
                                            value={settings[item.key] ?? ''}
                                            onChange={e => set(item.key, e.target.value)}
                                            placeholder={item.defaultLabel}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Icon (emoji / SVG)</label>
                                        <input
                                            style={inputStyle}
                                            value={settings[item.iconKey] ?? ''}
                                            onChange={e => set(item.iconKey, e.target.value)}
                                            placeholder="🔍"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Mục cố định */}
                            {fixedItems.map(item => (
                                <div key={item.label} style={fixedRow}>
                                    <span style={{ fontSize: '0.88rem', color: '#475569' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>{item.note}</span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

// ── Inline icons ──────────────────────────────────────────────────────────────
function SaveIcon() {
    return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
        </svg>
    );
}

function BrandIcon() {
    return (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
    );
}
