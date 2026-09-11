import type { ActiveItemSetBonus, StatBlock } from "../types";
import { getVisibleStatRows } from "../utils/statFormatting";
import { SetBonusList } from "./SetBonusList";

interface GearStatsPanelProps {
  gearStats: StatBlock;
  activeSetBonuses: ActiveItemSetBonus[];
  warnings: string[];
  isCalculating: boolean;
  includeHolyShield: boolean;
  onIncludeHolyShieldChange: (checked: boolean) => void;
}

export function GearStatsPanel({
  gearStats,
  activeSetBonuses,
  warnings,
  isCalculating,
  includeHolyShield,
  onIncludeHolyShieldChange,
}: GearStatsPanelProps) {
  const visibleStatRows = getVisibleStatRows(gearStats);

  return (
    <section className="panel stats-panel">
      <div className="panel-title-row compact-panel-title">
        <h2>Gear Stat Totals</h2>

        <label className="mini-toggle">
          <input
            type="checkbox"
            checked={includeHolyShield}
            onChange={(event) => onIncludeHolyShieldChange(event.target.checked)}
          />
          <span>Holy Shield</span>
        </label>
      </div>

      <p className="panel-caption">
        Gear totals include equipped items, enchants, active gems, and active socket
        bonuses.
      </p>

      {isCalculating && <p className="muted">Calculating...</p>}

      {visibleStatRows.length === 0 ? (
        <p className="muted">Equip gear to see stat totals.</p>
      ) : (
        <div className="compact-stat-grid">
          {visibleStatRows.map((stat) => (
            <div className="compact-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      )}

      <SetBonusList
        bonuses={activeSetBonuses}
        title="Active Set Bonuses"
      />

      {warnings.length > 0 && (
        <div className="warning-list">
          {warnings.map((warning) => (
            <p key={warning} className="warning-message">
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
