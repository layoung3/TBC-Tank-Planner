import { raceOptions } from "../config/plannerOptions";
import type { CharacterRace, FinalCharacterStatsResponse } from "../types";
import { getVisibleStatRows } from "../utils/statFormatting";
import { EffectSummaryList } from "./EffectSummaryList";
import { SetBonusList } from "./SetBonusList";

interface FinalStatsPanelProps {
  selectedRace: CharacterRace;
  finalCharacterStats: FinalCharacterStatsResponse | null;
  isCalculating: boolean;
  error: string | null;
  onRaceChange: (race: CharacterRace) => void;
}

export function FinalStatsPanel({
  selectedRace,
  finalCharacterStats,
  isCalculating,
  error,
  onRaceChange,
}: FinalStatsPanelProps) {
  const visibleFinalStatRows = finalCharacterStats
    ? getVisibleStatRows(finalCharacterStats.finalStats)
    : [];

  const derivedTankStats = finalCharacterStats?.derivedTankStats;
  const physicalMitigationStats = finalCharacterStats?.physicalMitigationStats;
  const magicMitigationStats = finalCharacterStats?.magicMitigationStats;
  const activeFinalSetBonuses = finalCharacterStats?.activeSetBonuses ?? [];
  const activeTalentEffects = finalCharacterStats?.activeTalentEffects ?? [];
  const talentWarnings = finalCharacterStats?.talentWarnings ?? [];

  return (
    <section className="panel results-panel">
      <div className="panel-title-row">
        <h2>Final Character Stats</h2>

        <label className="race-filter">
          <span>Race</span>
          <select
            value={selectedRace}
            onChange={(event) => onRaceChange(event.target.value as CharacterRace)}
          >
            {raceOptions.map((raceOption) => (
              <option key={raceOption.value} value={raceOption.value}>
                {raceOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isCalculating && <p className="muted">Calculating...</p>}

      {error && <p className="error">{error}</p>}

      {finalCharacterStats && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Health</span>
              <strong>{finalCharacterStats.health}</strong>
            </div>

            <div className="summary-card">
              <span>Mana</span>
              <strong>{finalCharacterStats.mana}</strong>
            </div>

            {physicalMitigationStats && (
              <>
                <div className="summary-card">
                  <span>Physical EHP</span>
                  <strong>
                    {physicalMitigationStats.physicalEffectiveHealth.toLocaleString()}
                  </strong>
                  <small>vs level {physicalMitigationStats.attackerLevel}</small>
                </div>

                <div className="summary-card">
                  <span>Armor DR</span>
                  <strong>{physicalMitigationStats.armorDamageReductionPercent}%</strong>
                  <small>
                    {physicalMitigationStats.armorNeededForCap.toLocaleString()} armor to cap
                  </small>
                </div>
              </>
            )}

            {magicMitigationStats && (
              <div className="summary-card">
                <span>Best Magic EHP</span>
                <strong>
                  {Math.max(
                    ...magicMitigationStats.schools.map(
                      (school) => school.magicEffectiveHealth
                    )
                  ).toLocaleString()}
                </strong>
                <small>Highest current resistance school</small>
              </div>
            )}

            {derivedTankStats && (
              <>
                <div
                  className={`summary-card status-card ${
                    derivedTankStats.isCritImmune ? "status-good" : "status-bad"
                  }`}
                >
                  <span>Crit Immune</span>
                  <strong>{derivedTankStats.isCritImmune ? "Yes" : "No"}</strong>
                  <small>
                    {derivedTankStats.isCritImmune
                      ? `${derivedTankStats.totalCritReductionPercent}% reduction`
                      : `${derivedTankStats.critReductionNeededPercent}% short`}
                  </small>
                </div>

                <div
                  className={`summary-card status-card ${
                    derivedTankStats.isUncrushable ? "status-good" : "status-bad"
                  }`}
                >
                  <span>Uncrushable</span>
                  <strong>{derivedTankStats.isUncrushable ? "Yes" : "No"}</strong>
                  <small>
                    {derivedTankStats.isUncrushable
                      ? `${derivedTankStats.avoidanceWithBlockPercent}% table coverage`
                      : `${derivedTankStats.crushAvoidanceNeededPercent}% short`}
                  </small>
                </div>
              </>
            )}
          </div>

          <h3 className="subsection-title">Core Stats</h3>

          <div className="compact-stat-grid">
            {visibleFinalStatRows.map((stat) => (
              <div className="compact-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <SetBonusList
            bonuses={activeFinalSetBonuses}
            title="Set Bonuses"
            titleClassName="subsection-title"
            compact
          />

          <EffectSummaryList
            title="Active Talent Effects"
            effects={activeTalentEffects}
            emptyMessage="No active talent effects."
          />

          {talentWarnings.length > 0 && (
            <div className="warning-list">
              {talentWarnings.map((warning) => (
                <p key={warning} className="warning-message">
                  {warning}
                </p>
              ))}
            </div>
          )}

          {physicalMitigationStats && (
            <>
              <h3 className="subsection-title">Mitigation</h3>

              <div className="compact-stat-grid">
                <div className="compact-stat">
                  <span>Physical EHP</span>
                  <strong>
                    {physicalMitigationStats.physicalEffectiveHealth.toLocaleString()}
                  </strong>
                </div>

                <div className="compact-stat">
                  <span>Armor DR</span>
                  <strong>{physicalMitigationStats.armorDamageReductionPercent}%</strong>
                </div>

                <div className="compact-stat">
                  <span>Armor Cap</span>
                  <strong>{physicalMitigationStats.armorCap.toLocaleString()}</strong>
                </div>

                <div className="compact-stat">
                  <span>Armor to Cap</span>
                  <strong>
                    {physicalMitigationStats.armorNeededForCap.toLocaleString()}
                  </strong>
                </div>
              </div>
            </>
          )}

          {magicMitigationStats && (
            <>
              <h3 className="subsection-title">Resistance EHP</h3>

              <div className="compact-stat-grid">
                {magicMitigationStats.schools.map((school) => (
                  <div className="compact-stat" key={school.school}>
                    <span>
                      {school.school} — {school.resistance}/{school.resistanceCap}
                    </span>
                    <strong>{school.magicEffectiveHealth.toLocaleString()}</strong>
                    <small>
                      {school.averageDamageReductionPercent}% avg reduction • {" "}
                      {school.resistanceNeededForCap} to cap
                    </small>
                  </div>
                ))}
              </div>
            </>
          )}

          {derivedTankStats && (
            <>
              <h3 className="subsection-title">Tank Table</h3>

              <div className="compact-stat-grid tank-table-grid">
                <div className="stat-row">
                  <span>Defense Skill</span>
                  <strong>{derivedTankStats.defenseSkill}</strong>
                </div>

                <div className="stat-row">
                  <span>Crit Reduction</span>
                  <strong>{derivedTankStats.totalCritReductionPercent}%</strong>
                </div>

                <div className="stat-row">
                  <span>Miss</span>
                  <strong>{derivedTankStats.missPercent}%</strong>
                </div>

                <div className="stat-row">
                  <span>Dodge</span>
                  <strong>{derivedTankStats.dodgePercent}%</strong>
                </div>

                <div className="stat-row">
                  <span>Parry</span>
                  <strong>{derivedTankStats.parryPercent}%</strong>
                </div>

                <div className="stat-row">
                  <span>Block</span>
                  <strong>{derivedTankStats.blockPercent}%</strong>
                </div>

                <div className="stat-row">
                  <span>Holy Shield</span>
                  <strong>
                    {derivedTankStats.isHolyShieldIncluded
                      ? `+${derivedTankStats.holyShieldBlockChancePercent}% Block`
                      : "Not Included"}
                  </strong>
                </div>

                <div className="stat-row">
                  <span>Avoidance + Block</span>
                  <strong>{derivedTankStats.avoidanceWithBlockPercent}%</strong>
                </div>
              </div>
            </>
          )}

          <p className="stat-note">
            Final stats include base level 70 Protection Paladin stats plus equipped
            gear, enchants, active gems, and active socket bonuses. Talents, buffs, EHP,
            and encounter settings will be added later.
          </p>
        </>
      )}
    </section>
  );
}
