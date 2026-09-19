import React from 'react';
import { Layers, DoorOpen, Armchair, Users } from 'lucide-react';

interface Props {
  totalCount: number;
  wholeSpaceCount: number;
  perSeatCount: number;
  perTableCount: number;
}

export const SpaceTypeStatsCardsKT: React.FC<Props> = ({
  totalCount,
  wholeSpaceCount,
  perSeatCount,
  perTableCount,
}) => {
  return (
    <div className="stats-cards-grid">
      {/* Card 1: Tổng số loại không gian - Pastel Blue */}
      <div className="stat-card-box stat-card-pastel-blue">
        <div className="stat-card-top-row">
          <span className="stat-card-label">Tổng số loại không gian</span>
          <div className="stat-card-icon-badge icon-blue">
            <Layers size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{totalCount}</span>
        </div>
      </div>

      {/* Card 2: Đặt nguyên phòng - Pastel Sky */}
      <div className="stat-card-box stat-card-pastel-sky">
        <div className="stat-card-top-row">
          <span className="stat-card-label">Đặt nguyên phòng</span>
          <div className="stat-card-icon-badge icon-sky">
            <DoorOpen size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{wholeSpaceCount}</span>
        </div>
      </div>

      {/* Card 3: Đặt theo chỗ ngồi - Pastel Green */}
      <div className="stat-card-box stat-card-pastel-green">
        <div className="stat-card-top-row">
          <span className="stat-card-label">Đặt theo chỗ ngồi</span>
          <div className="stat-card-icon-badge icon-green">
            <Armchair size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{perSeatCount}</span>
        </div>
      </div>

      {/* Card 4: Đặt theo bàn - Pastel Purple */}
      <div className="stat-card-box stat-card-pastel-purple">
        <div className="stat-card-top-row">
          <span className="stat-card-label">Đặt theo bàn</span>
          <div className="stat-card-icon-badge icon-purple">
            <Users size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="stat-card-value-row">
          <span className="stat-card-value">{perTableCount}</span>
        </div>
      </div>
    </div>
  );
};

