import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { policyService } from '../services/policyService';
import type { AuditLogResponse } from '../types/policy';
import { parsePolicyText } from '../utils/policyFormatters';
import '../policy.css';

export default function PolicyHistoryPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<number, boolean>>({});

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

  const toggleExpand = (id: number) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  return (
    <div className="policy-page-container">
      {/* Breadcrumbs Navigation */}
      <nav className="policy-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <Link to="/admin/policy" className="breadcrumb-link">Quy định đặt chỗ</Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">Lịch sử thay đổi</span>
      </nav>

      {/* Top Header Card */}
      <div className="history-header-card">
        <div className="history-header-left">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/admin/policy')}
            title="Quay lại trang quản trị chính sách"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div>
            <div className="history-title-row">
              <div className="history-icon-circle">
                <History size={22} />
              </div>
              <h1 className="history-title">Lịch sử thay đổi chính sách</h1>
              <span className="history-count-badge">{logs.length} lượt cập nhật</span>
            </div>
            <p className="history-subtitle">
              Nhật ký ghi nhận chi tiết các lần điều chỉnh quy định hoạt động, thời lượng đặt phòng và cơ chế check-in toàn hệ thống.
            </p>
          </div>
        </div>

        <div className="history-header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="history-toolbar">
        <div className="history-search-wrapper">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Tìm theo người thực hiện, thao tác hoặc giá trị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
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
          <History size={48} className="empty-icon" />
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
        <div className="history-timeline">
          {filteredLogs.map((log, index) => {
            const newItems = parsePolicyText(log.newValue);
            const oldItems = parsePolicyText(log.oldValue);
            const isExpanded = !!expandedLogIds[log.id];
            const hasOldComparison = log.oldValue && log.oldValue !== log.newValue && oldItems.length > 0;

            return (
              <article key={log.id} className="history-card">
                <div className="history-card-header">
                  <div className="history-actor-info">
                    <div className="history-avatar">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="history-actor-name">
                        {log.performedBy || 'Quản trị viên'}
                        <span className="role-tag">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      </div>
                      <div className="history-timestamp">
                        <Clock size={13} />
                        {log.performedAt
                          ? new Date(log.performedAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : 'Vừa xong'}
                      </div>
                    </div>
                  </div>

                  <div className="history-action-pill">
                    <CheckCircle2 size={14} />
                    <span>
                      {log.action === 'UPDATE_POLICY' ? 'Cập nhật chính sách đặt chỗ' : log.action}
                    </span>
                  </div>
                </div>

                <div className="history-card-body">
                  <div className="history-section-header">
                    <span className="history-section-badge">
                      <SlidersHorizontal size={13} /> Thiết lập áp dụng
                    </span>
                    {index === 0 && (
                      <span className="current-active-tag">
                        <Sparkles size={12} /> Chính sách hiện hành
                      </span>
                    )}
                  </div>

                  <div className="history-details-grid">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="history-detail-card">
                        <span className="detail-card-dot" />
                        <div className="detail-card-content">
                          <span className="detail-card-label">{item.label}</span>
                          <span className="detail-card-value">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* So sánh với giá trị trước đó (nếu có thay đổi) */}
                  {hasOldComparison && (
                    <div className="history-diff-toggle-area">
                      <button
                        type="button"
                        className="btn-toggle-diff"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {isExpanded ? '▲ Thu gọn so sánh trước đó' : '▼ Xem thiết lập trước khi sửa'}
                      </button>

                      {isExpanded && (
                        <div className="history-diff-container">
                          <span className="history-diff-title">Thiết lập trước thay đổi:</span>
                          <div className="history-details-grid old-state">
                            {oldItems.map((item, idx) => (
                              <div key={idx} className="history-detail-card old">
                                <span className="detail-card-dot old" />
                                <div className="detail-card-content">
                                  <span className="detail-card-label">{item.label}</span>
                                  <span className="detail-card-value">{item.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
