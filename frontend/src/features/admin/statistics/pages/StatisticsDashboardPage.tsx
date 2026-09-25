import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  UserCheck,
  CalendarCheck2,
  Info,
  CalendarClock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { statisticsService } from '../services/statisticsService';
import type { DashboardStatisticsResponse, TimeFilterPreset } from '../types/statistics';
import { CustomDateRangePicker, toLocalIsoDate } from '../components/CustomDateRangePicker';
import { ExportReportModal } from '../components/ExportReportModal';
import '../statistics.css';

export default function StatisticsDashboardPage() {
  const [stats, setStats] = useState<DashboardStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<TimeFilterPreset>('30days');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toLocalIsoDate(d);
  });
  const [toDate, setToDate] = useState<string>(() => toLocalIsoDate(new Date()));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  const toggleExpand = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const maintenanceRooms = useMemo(() => {
    return stats?.maintenanceDetails?.filter(item =>
      item.resourceType?.toLowerCase().includes('phòng')
    ) || [];
  }, [stats?.maintenanceDetails]);

  const maintenanceTables = useMemo(() => {
    return stats?.maintenanceDetails?.filter(item =>
      item.resourceType?.toLowerCase().includes('bàn')
    ) || [];
  }, [stats?.maintenanceDetails]);

  const maintenanceSeats = useMemo(() => {
    return stats?.maintenanceDetails?.filter(item =>
      item.resourceType?.toLowerCase().includes('ghế')
    ) || [];
  }, [stats?.maintenanceDetails]);

  const loadData = async (from?: string, to?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await statisticsService.getDashboardStatistics(from, to);
      setStats(data);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu thống kê:', err);
      setError(err?.response?.data?.message || 'Không thể kết nối máy chủ để lấy dữ liệu thống kê từ CSDL.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(fromDate, toDate);
  }, []);

  const handleApplyPreset = (newPreset: TimeFilterPreset) => {
    setPreset(newPreset);
    const today = new Date();
    const todayStr = toLocalIsoDate(today);

    let startStr = '';
    if (newPreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startStr = toLocalIsoDate(d);
    } else if (newPreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startStr = toLocalIsoDate(d);
    } else if (newPreset === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = toLocalIsoDate(d);
    } else if (newPreset === 'all') {
      startStr = '';
    }

    setFromDate(startStr);
    setToDate(todayStr);
    loadData(startStr || undefined, todayStr || undefined);
  };

  const handleDateChange = (from: string, to: string) => {
    if (from && to && to <= from) {
      setError('Ngày đến phải lớn hơn từ ngày.');
      return;
    }
    setError(null);
    setFromDate(from);
    setToDate(to);
    setPreset('custom');
    loadData(from || undefined, to || undefined);
  };

  // Xuất báo cáo chuyên nghiệp định dạng Excel (.xlsx) với tùy chọn chọn tháng hoặc khoảng ngày
  const handleConfirmExport = async (
    exportFrom: string,
    exportTo: string,
    isMonth: boolean,
    monthLabel: string,
    applyToDashboard: boolean
  ) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await statisticsService.exportExcel(exportFrom || undefined, exportTo || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = `Thong_Ke_EduSpace_${toLocalIsoDate(new Date()).replace(/-/g, '')}.xlsx`;
      if (isMonth && monthLabel) {
        filename = `Bao_Cao_Thong_Ke_Thang_${monthLabel.replace('/', '_')}.xlsx`;
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (applyToDashboard) {
        setFromDate(exportFrom);
        setToDate(exportTo);
        setPreset('custom');
        loadData(exportFrom || undefined, exportTo || undefined);
      }

      setShowExportModal(false);
    } catch (err: any) {
      console.error('Lỗi khi xuất file Excel:', err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  // Tính toán các phân đoạn cho Donut Chart
  const statusSegments = useMemo(() => {
    if (!stats) return [];
    const total = stats.totalBookings || 1;
    const items = [
      { key: 'completed', label: 'Hoàn thành', count: stats.completedCount, color: '#16a34a' },
      { key: 'checkedIn', label: 'Đang sử dụng (Check-in)', count: stats.checkedInCount, color: '#2563eb' },
      { key: 'confirmed', label: 'Đã duyệt / Chờ dùng', count: stats.confirmedCount, color: '#6366f1' },
      { key: 'pending', label: 'Chờ duyệt', count: stats.pendingApprovalCount, color: '#eab308' },
      { key: 'noShow', label: 'Vắng mặt (No-Show)', count: stats.noShowCount, color: '#f97316' },
      { key: 'cancelled', label: 'Đã hủy', count: stats.cancelledCount, color: '#94a3b8' },
      { key: 'rejected', label: 'Từ chối', count: stats.rejectedCount, color: '#ef4444' },
    ];

    const circumference = 2 * Math.PI * 40; // R=40 => ~251.3
    let cumulative = 0;

    return items.map((item) => {
      const percentage = (item.count / total) * 100;
      const strokeLength = (item.count / total) * circumference;
      const strokeDashoffset = -cumulative;
      cumulative += strokeLength;

      return {
        ...item,
        percentage: Math.round(percentage * 10) / 10,
        strokeLength,
        strokeDashoffset,
        circumference,
      };
    });
  }, [stats]);

  return (
    <div className="stats-page-container">
      <div className="stats-content-wrapper">
        {/* Header Card */}
        <header className="stats-header-card">
          <div className="stats-header-bg-decor" aria-hidden="true">
            <svg viewBox="0 0 960 110" preserveAspectRatio="none" className="stats-header-svg">
              <defs>
                <linearGradient id="statsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e3f0fe" />
                  <stop offset="50%" stopColor="#edf5fe" />
                  <stop offset="100%" stopColor="#e5f1fe" />
                </linearGradient>
              </defs>
              <path
                d="M0,0 L960,0 L960,65 C780,105 520,30 280,75 C140,100 60,70 0,85 Z"
                fill="url(#statsGrad)"
                opacity="0.85"
              />
            </svg>
          </div>

          <div className="stats-title-group">
            <div className="stats-main-icon-box">
              <BarChart3 size={28} />
            </div>
            <div className="stats-title-text">
              <h1>Tổng Quan Vận Hành</h1>
              <p>
                Tổng hợp chỉ số vận hành không gian học tập, tỷ lệ sử dụng thực tế và phân bổ lượt đặt chỗ.
                {stats?.calculatedAt && (
                  <span style={{ display: 'inline-block', marginLeft: '3px', marginTop: '2px', color: '#2563eb', fontWeight: 600 }}>
                    Dữ liệu tính toán lúc: {new Date(stats.calculatedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="stats-header-actions">
            <button
              type="button"
              className="stats-action-btn icon-only"
              onClick={() => loadData(fromDate, toDate)}
              disabled={isLoading || isExporting}
              title="Làm mới dữ liệu"
              aria-label="Làm mới dữ liệu"
            >
              <RotateCw size={16} className={isLoading ? 'spin-icon' : ''} />
            </button>

            <button
              type="button"
              className="stats-action-btn primary"
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              title="Chọn tháng hoặc khoảng thời gian để xuất file Excel (.xlsx)"
            >
              <Download size={15} className={isExporting ? 'spin-icon' : ''} />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Báo Cáo'}</span>
            </button>
          </div>
        </header>

        {/* Filter Toolbar */}
        <section className="stats-filter-bar">
          <div className="stats-presets-group">
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
              Thời gian:
            </span>
            <button
              className={`stats-preset-chip ${preset === '7days' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('7days')}
            >
              7 ngày qua
            </button>
            <button
              className={`stats-preset-chip ${preset === '30days' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('30days')}
            >
              30 ngày qua
            </button>
            <button
              className={`stats-preset-chip ${preset === 'this_month' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('this_month')}
            >
              Tháng này
            </button>
            <button
              className={`stats-preset-chip ${preset === 'all' ? 'active' : ''}`}
              onClick={() => handleApplyPreset('all')}
            >
              Toàn bộ
            </button>
          </div>

          <CustomDateRangePicker
            startDate={fromDate}
            endDate={toDate}
            preset={preset}
            onChange={(start, end) => handleDateChange(start, end)}
            onPresetChange={(p) => handleApplyPreset(p)}
          />
        </section>

        {/* Thông báo lỗi nếu không kết nối được CSDL */}
        {error && (
          <div className="stats-demo-banner" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
            <AlertTriangle size={16} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Primary KPI Cards */}
        <section className="stats-kpi-grid">
          {/* Card 1: Tổng lượt đặt */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-badge blue">
                <CalendarCheck2 size={22} />
              </div>
              <span className="kpi-tag blue">Tổng quan</span>
            </div>
            <div className="kpi-card-middle">
              <span className="kpi-label">Tổng lượt đặt chỗ</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{stats?.totalBookings ?? 0}</span>
                <span className="kpi-unit">lượt</span>
              </div>
            </div>
            <div className="kpi-card-bottom">
              <TrendingUp size={14} color="#16a34a" />
              <span>Ghi nhận trong khoảng thời gian đã lọc</span>
            </div>
          </div>

          {/* Card 2: Tỷ lệ sử dụng thực tế */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-badge green">
                <UserCheck size={22} />
              </div>
              <span className="kpi-tag green">Hiệu quả</span>
            </div>
            <div className="kpi-card-middle">
              <span className="kpi-label">Tỷ lệ sử dụng thực tế</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{stats?.actualUsageRate ?? 0}%</span>
              </div>
            </div>
            <div className="kpi-card-bottom">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>Lượt đã check-in & hoàn thành / Tổng số</span>
            </div>
          </div>

          {/* Card 3: Tỷ lệ không đến (No-show) */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-badge orange">
                <AlertTriangle size={22} />
              </div>
              <span className="kpi-tag orange">Cảnh báo</span>
            </div>
            <div className="kpi-card-middle">
              <span className="kpi-label">Tỷ lệ vắng mặt (No-Show)</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{stats?.noShowRate ?? 0}%</span>
              </div>
            </div>
            <div className="kpi-card-bottom">
              <Info size={14} color="#ea580c" />
              <span>Đặt chỗ nhưng không đến quầy làm thủ tục</span>
            </div>
          </div>

          {/* Card 4: Đang chờ duyệt */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-badge amber">
                <Clock size={22} />
              </div>
              <span className="kpi-tag amber">Cần xử lý</span>
            </div>
            <div className="kpi-card-middle">
              <span className="kpi-label">Chờ phê duyệt</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{stats?.pendingApprovalCount ?? 0}</span>
                <span className="kpi-unit">yêu cầu</span>
              </div>
            </div>
            <div className="kpi-card-bottom">
              <CalendarClock size={14} color="#ca8a04" />
              <span>Đang đợi Staff/Admin phê duyệt không gian</span>
            </div>
          </div>
        </section>

        {/* Secondary Metrics Strip */}
        <section className="stats-secondary-strip">
          <div className="sub-metric-item">
            <div className="sub-metric-icon red">
              <Wrench size={18} />
            </div>
            <div className="sub-metric-data">
              <span className="sub-metric-val">
                {stats?.totalMaintenanceCount ?? stats?.maintenanceSpacesCount ?? 0}{' '}
                <small style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>tài nguyên</small>
              </span>
              <span className="sub-metric-title">Bảo trì / Ngừng phục vụ</span>
              <div className="sub-metric-detail-pills">
                <span className="sub-metric-detail-pill red" title="Phòng bảo trì (spaces / blocks)">
                  🏢 {stats?.maintenanceSpacesCount ?? 0} phòng
                </span>
                <span className="sub-metric-detail-pill" title="Bàn tạm ngừng (space_tables)">
                  🪑 {stats?.maintenanceTablesCount ?? 0} bàn
                </span>
                <span className="sub-metric-detail-pill" title="Ghế tạm ngừng (seats)">
                  💺 {stats?.maintenanceSeatsCount ?? 0} ghế
                </span>
              </div>
            </div>
          </div>

          <div className="sub-metric-item">
            <div className="sub-metric-icon purple">
              <XCircle size={18} />
            </div>
            <div className="sub-metric-data">
              <span className="sub-metric-val">{stats?.expiredPendingCount ?? 0}</span>
              <span className="sub-metric-title">Chờ duyệt bị quá hạn</span>
            </div>
          </div>

          <div className="sub-metric-item">
            <div className="sub-metric-icon emerald">
              <CheckCircle2 size={18} />
            </div>
            <div className="sub-metric-data">
              <span className="sub-metric-val">{stats?.completedCount ?? 0}</span>
              <span className="sub-metric-title">Lượt đã hoàn thành</span>
            </div>
          </div>

          <div className="sub-metric-item">
            <div className="sub-metric-icon cyan">
              <Sparkles size={18} />
            </div>
            <div className="sub-metric-data">
              <span className="sub-metric-val">{stats?.confirmedCount ?? 0}</span>
              <span className="sub-metric-title">Đã xác nhận sắp tới</span>
            </div>
          </div>
        </section>

        {/* Analytics Visuals: Donut Chart & Flow Pipeline */}
        <section className="stats-analytics-grid">
          {/* Cột trái: Donut Chart phân bổ trạng thái */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h3 className="analytics-card-title">
                  <BarChart3 size={18} color="#2563eb" />
                  Phân Bổ Trạng Thái Đặt Phòng
                </h3>
                <p className="analytics-card-subtitle">Tỷ trọng các trạng thái booking trong hệ thống</p>
              </div>
            </div>

            <div className="donut-chart-wrapper">
              <div className="donut-svg-box">
                <svg viewBox="0 0 100 100" width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Vòng nền mờ */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />

                  {/* Các phân đoạn trạng thái */}
                  {statusSegments.map((seg) => {
                    if (seg.count <= 0) return null;
                    return (
                      <circle
                        key={seg.key}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={`${seg.strokeLength} ${seg.circumference}`}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'all 0.4s ease' }}
                      />
                    );
                  })}
                </svg>

                <div className="donut-center-label">
                  <div className="donut-center-num">{stats?.totalBookings ?? 0}</div>
                  <div className="donut-center-text">Tổng Lượt</div>
                </div>
              </div>

              {/* Chú thích trạng thái (Legend) */}
              <div className="donut-legend">
                {statusSegments.map((seg) => (
                  <div key={seg.key} className="legend-item">
                    <div className="legend-color-tag">
                      <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                      <span className="legend-name">{seg.label}</span>
                    </div>
                    <span className="legend-value">
                      {seg.count} <small style={{ color: '#94a3b8' }}>({seg.percentage}%)</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Thanh Tiến Trình & Hiệu Suất Vận Hành */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h3 className="analytics-card-title">
                  <TrendingUp size={18} color="#16a34a" />
                  Hiệu Suất Vận Hành & Tỷ Lệ Đạt
                </h3>
                <p className="analytics-card-subtitle">So sánh các nhóm trạng thái tích cực và hao hụt</p>
              </div>
            </div>

            <div className="pipeline-bars-list">
              <div className="pipeline-item">
                <div className="pipeline-item-header">
                  <span style={{ color: '#16a34a' }}>Đã hoàn thành tốt đẹp</span>
                  <span>
                    {stats?.completedCount ?? 0} / {stats?.totalBookings ?? 0} (
                    {stats?.totalBookings ? Math.round(((stats.completedCount || 0) / stats.totalBookings) * 100) : 0}%)
                  </span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${stats?.totalBookings ? ((stats.completedCount || 0) / stats.totalBookings) * 100 : 0}%`,
                      backgroundColor: '#16a34a',
                    }}
                  />
                </div>
              </div>

              <div className="pipeline-item">
                <div className="pipeline-item-header">
                  <span style={{ color: '#2563eb' }}>Đã check-in (Đang sử dụng)</span>
                  <span>
                    {stats?.checkedInCount ?? 0} / {stats?.totalBookings ?? 0} (
                    {stats?.totalBookings ? Math.round(((stats.checkedInCount || 0) / stats.totalBookings) * 100) : 0}%)
                  </span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${stats?.totalBookings ? ((stats.checkedInCount || 0) / stats.totalBookings) * 100 : 0}%`,
                      backgroundColor: '#2563eb',
                    }}
                  />
                </div>
              </div>

              <div className="pipeline-item">
                <div className="pipeline-item-header">
                  <span style={{ color: '#ca8a04' }}>Đang chờ phê duyệt</span>
                  <span>
                    {stats?.pendingApprovalCount ?? 0} / {stats?.totalBookings ?? 0} (
                    {stats?.totalBookings ? Math.round(((stats.pendingApprovalCount || 0) / stats.totalBookings) * 100) : 0}%)
                  </span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${stats?.totalBookings ? ((stats.pendingApprovalCount || 0) / stats.totalBookings) * 100 : 0}%`,
                      backgroundColor: '#ca8a04',
                    }}
                  />
                </div>
              </div>

              <div className="pipeline-item">
                <div className="pipeline-item-header">
                  <span style={{ color: '#ea580c' }}>Không đến (No-Show)</span>
                  <span>
                    {stats?.noShowCount ?? 0} / {stats?.totalBookings ?? 0} (
                    {stats?.totalBookings ? Math.round(((stats.noShowCount || 0) / stats.totalBookings) * 100) : 0}%)
                  </span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${stats?.totalBookings ? ((stats.noShowCount || 0) / stats.totalBookings) * 100 : 0}%`,
                      backgroundColor: '#ea580c',
                    }}
                  />
                </div>
              </div>

              <div className="pipeline-item">
                <div className="pipeline-item-header">
                  <span style={{ color: '#64748b' }}>Đã hủy hoặc bị từ chối</span>
                  <span>
                    {(stats?.cancelledCount ?? 0) + (stats?.rejectedCount ?? 0)} / {stats?.totalBookings ?? 0} (
                    {stats?.totalBookings
                      ? Math.round((((stats.cancelledCount || 0) + (stats.rejectedCount || 0)) / stats.totalBookings) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${stats?.totalBookings
                        ? (((stats.cancelledCount || 0) + (stats.rejectedCount || 0)) / stats.totalBookings) * 100
                        : 0
                        }%`,
                      backgroundColor: '#94a3b8',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Breakdown Table */}
        <section className="stats-table-card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Bảng Kê Chi Tiết Số Liệu Trạng Thái
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Thống kê chi tiết từng nhóm trạng thái booking phục vụ báo cáo đối soát.
            </p>
          </div>

          <table className="stats-table">
            <thead>
              <tr>
                <th>Trạng thái đặt phòng</th>
                <th>Mã kỹ thuật</th>
                <th>Số lượng ghi nhận</th>
                <th>Tỷ lệ / Tổng số</th>
                <th>Đánh giá vận hành</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="status-badge-pill completed">Hoàn thành</span>
                </td>
                <td><code>COMPLETED</code></td>
                <td><strong>{stats?.completedCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.completedCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#16a34a' }}>Đạt mục tiêu sử dụng</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill checked_in">Đã Check-in</span>
                </td>
                <td><code>CHECKED_IN</code></td>
                <td><strong>{stats?.checkedInCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.checkedInCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#2563eb' }}>Sinh viên đang dùng phòng</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill confirmed">Đã xác nhận</span>
                </td>
                <td><code>CONFIRMED</code></td>
                <td><strong>{stats?.confirmedCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.confirmedCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#4338ca' }}>Đang chờ tới giờ sử dụng</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill pending">Chờ phê duyệt</span>
                </td>
                <td><code>PENDING_APPROVAL</code></td>
                <td><strong>{stats?.pendingApprovalCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.pendingApprovalCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#a16207' }}>Cần Staff xử lý</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill no_show">Không đến (No-Show)</span>
                </td>
                <td><code>NO_SHOW</code></td>
                <td><strong>{stats?.noShowCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.noShowCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#c2410c' }}>Cần nhắc nhở</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill cancelled">Đã hủy</span>
                </td>
                <td><code>CANCELLED</code></td>
                <td><strong>{stats?.cancelledCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.cancelledCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#64748b' }}>Người dùng tự hủy trước giờ</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill rejected">Bị từ chối</span>
                </td>
                <td><code>REJECTED</code></td>
                <td><strong>{stats?.rejectedCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.rejectedCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#b91c1c' }}>Không đủ điều kiện duyệt</td>
              </tr>
              <tr>
                <td>
                  <span className="status-badge-pill expired">Chờ duyệt quá hạn</span>
                </td>
                <td><code>EXPIRED</code></td>
                <td><strong>{stats?.expiredPendingCount ?? 0}</strong> lượt</td>
                <td>{stats?.totalBookings ? Math.round(((stats.expiredPendingCount || 0) / stats.totalBookings) * 1000) / 10 : 0}%</td>
                <td style={{ color: '#86198f' }}>Hết hạn trước khi được duyệt</td>
              </tr>

              {/* Phân hệ Bảo trì đa tài nguyên: Phòng, Bàn, Ghế */}
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={5} style={{ fontWeight: 700, color: '#0f172a', padding: '14px 16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span>TỔNG HỢP SỐ LƯỢNG BẢO TRÌ THEO LOẠI TÀI NGUYÊN</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                      💡 Click vào từng dòng để mở/đóng danh sách chi tiết
                    </span>
                  </div>
                </td>
              </tr>

              {/* 1. Hàng Phòng học */}
              <tr
                className={maintenanceRooms.length > 0 ? (expandedTypes['room'] ? 'row-expandable row-expanded-active' : 'row-expandable') : ''}
                onClick={() => maintenanceRooms.length > 0 && toggleExpand('room')}
              >
                <td>
                  <span className="status-badge-pill" style={{ background: '#fee2e2', color: '#b91c1c' }}>🏢 Phòng học</span>
                </td>
                <td><code>spaces & maintenance_blocks</code></td>
                <td><strong>{stats?.maintenanceSpacesCount ?? maintenanceRooms.length}</strong> phòng</td>
                <td>
                  {maintenanceRooms.length > 0 ? (
                    <button
                      type="button"
                      className={`maintenance-expand-btn ${expandedTypes['room'] ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('room');
                      }}
                    >
                      {expandedTypes['room'] ? (
                        <>
                          <ChevronUp size={13} /> Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} /> Chi tiết ({maintenanceRooms.length})
                        </>
                      )}
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Không có bảo trì</span>
                  )}
                </td>
                <td style={{ color: (stats?.maintenanceSpacesCount ?? maintenanceRooms.length) > 0 ? '#b91c1c' : '#16a34a' }}>
                  {(stats?.maintenanceSpacesCount ?? maintenanceRooms.length) > 0 ? 'Đang bảo trì / chặn lịch' : 'Hoạt động bình thường'}
                </td>
              </tr>

              {/* Chi tiết Phòng học dropdown */}
              {expandedTypes['room'] && maintenanceRooms.length > 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '12px 18px', background: '#fdf2f2', borderBottom: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '2px' }}>
                        🏢 Danh sách cụ thể {maintenanceRooms.length} phòng học đang bảo trì:
                      </div>
                      {maintenanceRooms.map((item, idx) => (
                        <div
                          key={`room-${item.resourceCode}-${idx}`}
                          className="maintenance-detail-card"
                          style={{ borderLeftColor: '#ef4444' }}
                        >
                          <div className="maintenance-card-code">
                            <code style={{ background: '#fee2e2', color: '#b91c1c' }}>{item.resourceCode}</code>
                          </div>
                          <div className="maintenance-card-info">
                            <strong>{item.resourceName}</strong>
                            <div className="maintenance-card-sub">
                              Thuộc: <span>{item.spaceName}</span> ({item.location})
                            </div>
                          </div>
                          <div className="maintenance-card-time">
                            <Clock size={13} />
                            <span>
                              {item.startTime && item.endTime
                                ? `${new Date(item.startTime).toLocaleDateString('vi-VN')} - ${new Date(item.endTime).toLocaleDateString('vi-VN')}`
                                : 'Toàn thời gian'}
                            </span>
                          </div>
                          <div className="maintenance-card-status">
                            <span className="status-text-red">{item.statusText || 'Đang bảo trì'}</span>
                            <div className="maintenance-card-reason">
                              Lý do: {item.reason || 'Bảo trì kỹ thuật'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {/* 2. Hàng Cụm bàn nhóm */}
              <tr
                className={maintenanceTables.length > 0 ? (expandedTypes['table'] ? 'row-expandable row-expanded-active' : 'row-expandable') : ''}
                onClick={() => maintenanceTables.length > 0 && toggleExpand('table')}
              >
                <td>
                  <span className="status-badge-pill" style={{ background: '#fef3c7', color: '#92400e' }}>🪑 Cụm bàn nhóm</span>
                </td>
                <td><code>space_tables (INACTIVE)</code></td>
                <td><strong>{stats?.maintenanceTablesCount ?? maintenanceTables.length}</strong> bàn</td>
                <td>
                  {maintenanceTables.length > 0 ? (
                    <button
                      type="button"
                      className={`maintenance-expand-btn ${expandedTypes['table'] ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('table');
                      }}
                    >
                      {expandedTypes['table'] ? (
                        <>
                          <ChevronUp size={13} /> Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} /> Chi tiết ({maintenanceTables.length})
                        </>
                      )}
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Không có bảo trì</span>
                  )}
                </td>
                <td style={{ color: (stats?.maintenanceTablesCount ?? maintenanceTables.length) > 0 ? '#b91c1c' : '#16a34a' }}>
                  {(stats?.maintenanceTablesCount ?? maintenanceTables.length) > 0 ? 'Tạm ngừng đón khách' : 'Sẵn sàng sử dụng'}
                </td>
              </tr>

              {/* Chi tiết Cụm bàn nhóm dropdown */}
              {expandedTypes['table'] && maintenanceTables.length > 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '12px 18px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
                        🪑 Danh sách cụ thể {maintenanceTables.length} cụm bàn nhóm đang tạm khóa:
                      </div>
                      {maintenanceTables.map((item, idx) => (
                        <div
                          key={`table-${item.resourceCode}-${idx}`}
                          className="maintenance-detail-card"
                          style={{ borderLeftColor: '#f59e0b' }}
                        >
                          <div className="maintenance-card-code">
                            <code style={{ background: '#fef3c7', color: '#92400e' }}>{item.resourceCode}</code>
                          </div>
                          <div className="maintenance-card-info">
                            <strong>{item.resourceName}</strong>
                            <div className="maintenance-card-sub">
                              Thuộc: <span>{item.spaceName}</span> ({item.location})
                            </div>
                          </div>
                          <div className="maintenance-card-time">
                            <Clock size={13} />
                            <span>
                              {item.startTime && item.endTime
                                ? `${new Date(item.startTime).toLocaleDateString('vi-VN')} - ${new Date(item.endTime).toLocaleDateString('vi-VN')}`
                                : 'Toàn thời gian'}
                            </span>
                          </div>
                          <div className="maintenance-card-status">
                            <span className="status-text-red">{item.statusText || 'Tạm ngừng'}</span>
                            <div className="maintenance-card-reason">
                              Lý do: {item.reason || 'Bảo trì kỹ thuật'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {/* 3. Hàng Vị trí ghế ngồi */}
              <tr
                className={maintenanceSeats.length > 0 ? (expandedTypes['seat'] ? 'row-expandable row-expanded-active' : 'row-expandable') : ''}
                onClick={() => maintenanceSeats.length > 0 && toggleExpand('seat')}
              >
                <td>
                  <span className="status-badge-pill" style={{ background: '#f1f5f9', color: '#475569' }}>💺 Vị trí ghế ngồi</span>
                </td>
                <td><code>seats (INACTIVE)</code></td>
                <td><strong>{stats?.maintenanceSeatsCount ?? maintenanceSeats.length}</strong> chỗ</td>
                <td>
                  {maintenanceSeats.length > 0 ? (
                    <button
                      type="button"
                      className={`maintenance-expand-btn ${expandedTypes['seat'] ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('seat');
                      }}
                    >
                      {expandedTypes['seat'] ? (
                        <>
                          <ChevronUp size={13} /> Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} /> Chi tiết ({maintenanceSeats.length})
                        </>
                      )}
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Không có bảo trì</span>
                  )}
                </td>
                <td style={{ color: (stats?.maintenanceSeatsCount ?? maintenanceSeats.length) > 0 ? '#b91c1c' : '#16a34a' }}>
                  {(stats?.maintenanceSeatsCount ?? maintenanceSeats.length) > 0 ? 'Hỏng hóc / chờ thay thế' : 'Sẵn sàng sử dụng'}
                </td>
              </tr>

              {/* Chi tiết Vị trí ghế ngồi dropdown */}
              {expandedTypes['seat'] && maintenanceSeats.length > 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '12px 18px', background: '#f5f7ff', borderBottom: '1px solid #c7d2fe' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#3730a3', marginBottom: '2px' }}>
                        💺 Danh sách cụ thể {maintenanceSeats.length} vị trí ghế ngồi đang bảo trì / chờ thay thế:
                      </div>
                      {maintenanceSeats.map((item, idx) => (
                        <div
                          key={`seat-${item.resourceCode}-${idx}`}
                          className="maintenance-detail-card"
                          style={{ borderLeftColor: '#6366f1' }}
                        >
                          <div className="maintenance-card-code">
                            <code style={{ background: '#e0e7ff', color: '#3730a3' }}>{item.resourceCode}</code>
                          </div>
                          <div className="maintenance-card-info">
                            <strong>{item.resourceName}</strong>
                            <div className="maintenance-card-sub">
                              Thuộc: <span>{item.spaceName}</span> ({item.location})
                            </div>
                          </div>
                          <div className="maintenance-card-time">
                            <Clock size={13} />
                            <span>
                              {item.startTime && item.endTime
                                ? `${new Date(item.startTime).toLocaleDateString('vi-VN')} - ${new Date(item.endTime).toLocaleDateString('vi-VN')}`
                                : 'Toàn thời gian'}
                            </span>
                          </div>
                          <div className="maintenance-card-status">
                            <span className="status-text-red">{item.statusText || 'Hỏng hóc'}</span>
                            <div className="maintenance-card-reason">
                              Lý do: {item.reason || 'Bảo trì / Thay mới'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Modal chọn tháng & cấu hình xuất báo cáo Excel */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        currentFromDate={fromDate}
        currentToDate={toDate}
        onExport={handleConfirmExport}
        isExporting={isExporting}
      />
    </div>
  );
}
