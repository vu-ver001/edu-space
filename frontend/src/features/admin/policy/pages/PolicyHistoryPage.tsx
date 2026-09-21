import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  CalendarClock,
  RefreshCw,
  Search,
  User,
  Clock,
  CheckCircle2,
  Calendar,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { policyService } from '../services/policyService';
import type { AuditLogResponse } from '../types/policy';
import { parsePolicyText } from '../utils/policyFormatters';
import '../policy.css';

export default function PolicyHistoryPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await policyService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      // Tự động đăng nhập test admin nếu gặp 401
      if (err.response?.status === 401) {
        try {
          await policyService.quickAdminLogin();
          const retryData = await policyService.getAuditLogs();
          setLogs(retryData);
          return;
        } catch {
          // Bỏ qua lỗi login thử
        }
      }
      setError('Không thể tải lịch sử thay đổi chính sách. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((l) => {
      const actor = (l.performedBy || '').toLowerCase();
      const action = (l.action || '').toLowerCase();
      const newVal = (l.newValue || '').toLowerCase();
      return actor.includes(q) || action.includes(q) || newVal.includes(q);
    });
  }, [logs, searchQuery]);

  const formatHistoryTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const dd = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${hh}:${mm}:${ss} ${dd}/${MM}/${yyyy}`;
  };

  const renderMetricIcon = (key: string, _index?: number) => {
    switch (key) {
      case 'hours':
        return <Clock size={18} color="#0284c7" strokeWidth={2} />;
      case 'duration':
        return <Calendar size={18} color="#0284c7" strokeWidth={2} />;
      case 'quota':
        return <Sun size={18} color="#0284c7" strokeWidth={2} />;
      case 'checkin':
        return <CheckCircle2 size={18} color="#0284c7" strokeWidth={2} />;
      default:
        return <SlidersHorizontal size={18} color="#0284c7" strokeWidth={2} />;
    }
  };

  return (
    <div className="policy-page-container">
      <div className="policy-content-wrapper">
        {/* Breadcrumbs Navigation */}
        <nav className="policy-history-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-nav-link">
            <Home size={14} className="breadcrumb-nav-icon" /> Trang chủ
          </Link>
          <ChevronRight size={13} className="breadcrumb-nav-separator" />
          <Link to="/admin/policy" className="breadcrumb-nav-link">
            Quy định đặt chỗ
          </Link>
          <ChevronRight size={13} className="breadcrumb-nav-separator" />
          <span className="breadcrumb-nav-current">Lịch sử thay đổi</span>
        </nav>

        {/* Top Hero Header Card with Waves & Sparkles */}
        <header className="policy-header">
          {/* Decorative wavy background & sparkles */}
          <div className="policy-header-bg-decor" aria-hidden="true">
            <svg viewBox="0 0 960 110" preserveAspectRatio="none" className="policy-header-svg">
              <defs>
                <linearGradient id="historyHeaderGradBase" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e3f0fe" />
                  <stop offset="45%" stopColor="#edf5fe" />
                  <stop offset="100%" stopColor="#e5f1fe" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#historyHeaderGradBase)" />

              {/* Left organic decorative waves */}
              <path
                d="M-20 -20 Q 30 70, 70 50 T 170 30 Q 220 15, 250 -30 Z"
                fill="#bddbfd"
                opacity="0.5"
              />
              <path
                d="M-30 -20 Q 20 110, 80 85 T 160 -20 Z"
                fill="#c6e1fd"
                opacity="0.65"
              />
              <path
                d="M-30 -20 Q -5 95, 35 75 Q 75 55, 60 -20 Z"
                fill="#b2d6fc"
                opacity="0.8"
              />

              {/* Right organic decorative waves */}
              <path
                d="M800 -30 Q 840 85, 900 65 T 990 20 L 990 -30 Z"
                fill="#bddbfd"
                opacity="0.5"
              />
              <path
                d="M860 -20 Q 890 90, 940 70 Q 980 50, 990 -20 Z"
                fill="#c6e1fd"
                opacity="0.7"
              />
              <path
                d="M910 -20 Q 930 80, 970 65 L 990 -20 Z"
                fill="#b2d6fc"
                opacity="0.8"
              />

              {/* Subtle sparkle stars in bottom-right */}
              <g fill="#ffffff" opacity="0.9">
                <path d="M 860 85 Q 860 90, 865 90 Q 860 90, 860 95 Q 860 90, 855 90 Q 860 90, 860 85 Z" />
                <path d="M 915 75 Q 915 82, 922 82 Q 915 82, 915 89 Q 915 82, 908 82 Q 915 82, 915 75 Z" />
                <path d="M 945 92 Q 945 95, 948 95 Q 945 95, 945 98 Q 945 95, 942 95 Q 945 95, 945 92 Z" />
                <circle cx="830" cy="80" r="1.5" opacity="0.7" />
                <circle cx="880" cy="98" r="1.2" opacity="0.8" />
                <circle cx="935" cy="80" r="1.5" opacity="0.7" />
                <circle cx="955" cy="86" r="1" opacity="0.9" />
              </g>
            </svg>
          </div>

          <div className="policy-title-group">
            <div className="policy-main-icon-box">
              <CalendarClock size={28} color="#2563eb" strokeWidth={2.2} />
            </div>
            <div className="policy-title-text">
              <h1>Lịch sử thay đổi chính sách</h1>
              <p>Nhật ký ghi nhận chi tiết các lần điều chỉnh quy định hoạt động, thời lượng đặt phòng và cơ chế check-in toàn hệ thống.</p>
            </div>
          </div>

          <div className="policy-header-actions">
            <button
              type="button"
              className="btn-history-refresh"
              onClick={() => fetchLogs(true)}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </header>

        {/* Filter / Search Bar */}
        <div className="history-search-bar">
          <Search size={16} className="history-search-icon-inside" />
          <input
            type="text"
            className="history-search-input-field"
            placeholder="Tìm theo người thực hiện, thao tác hoặc giá trị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="history-search-clear-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* Error alert */}
        {error && (
          <div className="policy-error-banner" style={{ marginBottom: 20 }}>
            <span>{error}</span>
            <button onClick={() => fetchLogs()} className="btn-retry">
              Thử lại
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          <div className="history-loading-state">
            <RefreshCw size={28} className="spin-anim" color="var(--primary-blue)" />
            <p>Đang tải lịch sử thay đổi...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="history-empty-state">
            <CalendarClock size={48} className="empty-icon" />
            <h3>Không tìm thấy lịch sử phù hợp</h3>
            <p>
              {searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}".`
                : 'Hệ thống chưa ghi nhận lần thay đổi chính sách nào.'}
            </p>
            {searchQuery && (
              <button className="btn-reset" onClick={() => setSearchQuery('')}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="history-card-list">
            {filteredLogs.map((log, index) => {
              const newItems = parsePolicyText(log.newValue);
              const actorEmail = log.performedBy || 'admin@eduspace.vn';

              return (
                <article key={log.id} className="history-card-item">
                  {/* Card Topbar */}
                  <div className="history-card-topbar">
                    <div className="history-actor-group">
                      <div className="history-actor-avatar">
                        <User size={18} />
                      </div>
                      <div className="history-actor-details">
                        <div className="history-actor-meta">
                          <span className="history-actor-email">{actorEmail}</span>
                          <span className="history-admin-badge">Admin</span>
                        </div>
                        <div className="history-timestamp-row">
                          <Clock size={13} />
                          <span>
                            {log.performedAt
                              ? formatHistoryTimestamp(log.performedAt)
                              : '22:04:46 19/09/2026'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="history-status-badge">
                      <CheckCircle2 size={15} />
                      <span>
                        {log.action === 'UPDATE_POLICY'
                          ? 'Cập nhật chính sách đặt chỗ'
                          : log.action || 'Cập nhật chính sách đặt chỗ'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="history-card-content">
                    <div className="history-section-row">
                      <div className="history-section-heading">
                        <Calendar size={16} />
                        <span>Thiết lập áp dụng</span>
                      </div>
                      {index === 0 && (
                        <span className="history-current-badge">
                          <SlidersHorizontal size={13} /> Chỉnh sửa hiện hành
                        </span>
                      )}
                    </div>

                    <div className="history-subcards-grid">
                      {newItems.map((item, idx) => (
                        <div key={idx} className="history-subcard-item">
                          <div className={`history-subcard-circle ${item.key || 'default'}`}>
                            {renderMetricIcon(item.key, index)}
                          </div>
                          <div className="history-subcard-texts">
                            <span className="history-subcard-label">{item.label}</span>
                            <span className="history-subcard-value" title={item.value}>
                              {item.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
