import React from 'react';
import { Building2, CheckCircle2, Wrench, AlertCircle } from 'lucide-react';

interface Props {
  totalCount: number;
  availableCount: number;
  maintenanceCount: number;
  inactiveCount: number;
  activeStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export const SpaceStatsCardsKT: React.FC<Props> = ({
  totalCount,
  availableCount,
  maintenanceCount,
  inactiveCount,
}) => {
  return (
    <div className="stats-cards-grid">
      {/* Card 1: Tổng số không gian - Pastel Blue */}
      <div className="stat-card-box stat-card-pastel-blue" style={{ cursor: 'default' }}>
        <div className="stat-card-top-row">
          <span className="stat-card-label">Tổng số không gian</span>
          <div className="stat-card-icon-badge icon-blue">
            <Building2 size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{totalCount}</span>
        </div>
      </div>

      {/* Card 2: Sẵn sàng hoạt động - Pastel Green */}
      <div className="stat-card-box stat-card-pastel-green" style={{ cursor: 'default' }}>
        <div className="stat-card-top-row">
          <span className="stat-card-label">Hoạt động</span>
          <div className="stat-card-icon-badge icon-green">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{availableCount}</span>
        </div>
      </div>

      {/* Card 3: Bảo trì - Pastel Amber */}
      <div className="stat-card-box stat-card-pastel-amber" style={{ cursor: 'default' }}>
        <div className="stat-card-top-row">
          <span className="stat-card-label">Bảo trì</span>
          <div className="stat-card-icon-badge icon-amber">
            <Wrench size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{maintenanceCount}</span>
        </div>
      </div>

      {/* Card 4: Ngưng hoạt động - Pastel Slate/Rose */}
      <div className="stat-card-box stat-card-pastel-slate" style={{ cursor: 'default' }}>
        <div className="stat-card-top-row">
          <span className="stat-card-label">Ngưng hoạt động</span>
          <div className="stat-card-icon-badge icon-slate">
            <AlertCircle size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{inactiveCount}</span>
        </div>
      </div>
    </div>
  );
};

