import React, { useState, useMemo, useEffect } from 'react';
import { Download, X, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import './ExportReportModal.css';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFromDate: string; // YYYY-MM-DD
  currentToDate: string;   // YYYY-MM-DD
  onExport: (
    from: string,
    to: string,
    isMonth: boolean,
    monthLabel: string,
    applyToDashboard: boolean
  ) => Promise<void>;
  isExporting: boolean;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  currentFromDate,
  currentToDate,
  onExport,
  isExporting,
}) => {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  // Mode: 'month' | 'range'
  const [mode, setMode] = useState<'month' | 'range'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [applyToDashboard, setApplyToDashboard] = useState<boolean>(true);
  const [modalError, setModalError] = useState<string | null>(null);

  // Calculate start and end date for the selected month (Hooks must be called unconditionally)
  const monthRange = useMemo(() => {
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const totalDays = lastDay;
    const label = `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
    const filename = `Bao_Cao_Thong_Ke_Thang_${String(selectedMonth).padStart(2, '0')}_${selectedYear}.xlsx`;
    return { start, end, totalDays, label, filename, lastDay };
  }, [selectedYear, selectedMonth]);

  // Reset error when modal opens or inputs change
  useEffect(() => {
    if (isOpen) {
      setModalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return '--/--/----';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const handleSelectThisMonth = () => {
    setModalError(null);
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  const handleSelectPrevMonth = () => {
    setModalError(null);
    if (currentMonth === 1) {
      setSelectedYear(currentYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth - 1);
    }
  };

  const handleMonthClick = (m: number) => {
    setModalError(null);
    setSelectedMonth(m);
  };

  const handleYearChange = (y: number) => {
    setModalError(null);
    setSelectedYear(y);
  };

  const handleModeChange = (newMode: 'month' | 'range') => {
    setModalError(null);
    setMode(newMode);
  };

  const handleSubmit = async () => {
    setModalError(null);
    try {
      if (mode === 'month') {
        await onExport(monthRange.start, monthRange.end, true, monthRange.label, applyToDashboard);
      } else {
        await onExport(currentFromDate, currentToDate, false, '', false);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Không có dữ liệu trong khoảng thời gian này để xuất báo cáo.');
    }
  };

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-modal-header-left">
            <div className="export-icon-box">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="export-modal-title">Xuất Báo Cáo Thống Kê</h3>
              <p className="export-modal-subtitle">Tải dữ liệu phân tích đặt chỗ định dạng Excel (.xlsx)</p>
            </div>
          </div>
          <button type="button" className="export-modal-close-btn" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="export-modal-body">
          {/* Error Banner if month has no data */}
          {modalError && (
            <div className="export-modal-error-banner">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{modalError}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="export-mode-tabs">
            <button
              type="button"
              className={`export-mode-tab ${mode === 'month' ? 'active' : ''}`}
              onClick={() => handleModeChange('month')}
            >
              🗓️ Xuất theo Tháng
            </button>
            <button
              type="button"
              className={`export-mode-tab ${mode === 'range' ? 'active' : ''}`}
              onClick={() => handleModeChange('range')}
            >
              📅 Khoảng ngày đang xem
            </button>
          </div>

          {mode === 'month' ? (
            <>
              {/* Year & Shortcuts */}
              <div className="export-year-row">
                <div className="export-year-select-group">
                  <span className="export-year-label">Năm:</span>
                  <select
                    className="export-year-select"
                    value={selectedYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                  >
                    {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="export-shortcuts-group">
                  <button
                    type="button"
                    className="export-shortcut-pill"
                    onClick={handleSelectThisMonth}
                  >
                    Tháng này
                  </button>
                  <button
                    type="button"
                    className="export-shortcut-pill"
                    onClick={handleSelectPrevMonth}
                  >
                    Tháng trước
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="export-month-grid">
                {MONTH_NAMES.map((name, index) => {
                  const mNum = index + 1;
                  const isSelected = selectedMonth === mNum;
                  const isCur = selectedYear === currentYear && currentMonth === mNum;

                  return (
                    <button
                      key={mNum}
                      type="button"
                      className={`export-month-btn ${isSelected ? 'selected' : ''} ${
                        isCur ? 'is-current-month' : ''
                      }`}
                      onClick={() => handleMonthClick(mNum)}
                    >
                      <span>{name}</span>
                      <span className="month-tag">
                        {isCur ? 'Hiện tại' : `T${mNum}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Card */}
              <div className="export-preview-card">
                <div className="export-preview-row">
                  <span>Kỳ báo cáo xuất:</span>
                  <strong>Tháng {monthRange.label} ({monthRange.totalDays} ngày)</strong>
                </div>
                <div className="export-preview-row">
                  <span>Thời gian chi tiết:</span>
                  <strong>
                    01/{String(selectedMonth).padStart(2, '0')}/{selectedYear} → {monthRange.lastDay}/{String(selectedMonth).padStart(2, '0')}/{selectedYear}
                  </strong>
                </div>
                <div className="export-preview-row">
                  <span>Tên file Excel:</span>
                  <span className="export-preview-filename">{monthRange.filename}</span>
                </div>
              </div>

              {/* Sync Dashboard checkbox */}
              <label className="export-sync-checkbox-label">
                <input
                  type="checkbox"
                  checked={applyToDashboard}
                  onChange={(e) => setApplyToDashboard(e.target.checked)}
                />
                <span>Đồng thời cập nhật biểu đồ và bảng trên màn hình theo tháng này</span>
              </label>
            </>
          ) : (
            /* Mode Range Preview */
            <div className="export-preview-card" style={{ padding: '16px 18px', gap: '10px' }}>
              <div className="export-preview-row">
                <span>Khoảng ngày đang xem:</span>
                <strong>
                  {formatDisplay(currentFromDate)} → {formatDisplay(currentToDate)}
                </strong>
              </div>
              <div className="export-preview-row">
                <span>Định dạng xuất:</span>
                <strong>Toàn bộ số liệu KPI & Bảng kê theo khoảng ngày</strong>
              </div>
              <div className="export-preview-row">
                <span>Tên file tải về:</span>
                <span className="export-preview-filename">
                  Thong_Ke_EduSpace_{currentToDate ? currentToDate.replace(/-/g, '') : 'all'}.xlsx
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="export-modal-footer">
          <button
            type="button"
            className="export-modal-cancel-btn"
            onClick={onClose}
            disabled={isExporting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="export-modal-submit-btn"
            onClick={handleSubmit}
            disabled={isExporting}
          >
            <Download size={16} className={isExporting ? 'spin-icon' : ''} />
            <span>{isExporting ? 'Đang tạo file Excel...' : 'Tải File Excel Báo Cáo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
