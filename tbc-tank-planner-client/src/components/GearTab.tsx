import { ItemIcon } from "./ItemIcon";
import type { EquippedSlot, PhaseFilterOption } from "../models/plannerModels";
import type { TbcGem } from "../types";
import { formatStatSummary } from "../utils/statFormatting";
import {
  doesGemMatchSocket,
  formatMetaRequirementProgress,
  getSocketDisplayIndexes,
  isMetaGemActive,
  isSocketBonusActive,
} from "../utils/gemRules";

interface GearTabProps {
  gear: EquippedSlot[];
  selectedPhase?: number;
  phaseOptions: PhaseFilterOption[];
  onPhaseChange: (value: string) => void;
  onOpenItemPicker: (slotIndex: number) => void;
  onOpenEnchantPicker: (slotIndex: number) => void;
  onRemoveEnchant: (slotIndex: number) => void;
  onOpenGemPicker: (slotIndex: number, socketIndex: number) => void;
  onRemoveGem: (slotIndex: number, socketIndex: number) => void;
}

export function GearTab({
  gear,
  selectedPhase,
  phaseOptions,
  onPhaseChange,
  onOpenItemPicker,
  onOpenEnchantPicker,
  onRemoveEnchant,
  onOpenGemPicker,
  onRemoveGem,
}: GearTabProps) {
  const gearWithIndexes = gear.map((gearSlot, index) => ({
    gearSlot,
    index,
  }));

  const gearColumns = [
    gearWithIndexes.filter((_, index) => index % 3 === 0),
    gearWithIndexes.filter((_, index) => index % 3 === 1),
    gearWithIndexes.filter((_, index) => index % 3 === 2),
  ];

  function renderGearCard(gearSlot: EquippedSlot, index: number) {
    const socketBonusSummary = gearSlot.item
      ? formatStatSummary(gearSlot.item.socketBonus)
      : "";

    const socketBonusActive = gearSlot.item
      ? isSocketBonusActive(gearSlot.item, gearSlot.gems)
      : false;

    const metaGems =
      gearSlot.gems?.filter((gem): gem is TbcGem => gem?.color === "Meta") ?? [];

    return (
      <article
        key={gearSlot.slotKey}
        className={`gear-slot-card ${
          gearSlot.item ? "gear-slot-card-equipped" : ""
        }`}
      >
        <button
          className="gear-slot gear-slot-main"
          onClick={() => onOpenItemPicker(index)}
        >
          <span className="gear-slot-topline">
            <span className="gear-slot-label">{gearSlot.label}</span>
            {gearSlot.item && <span className="gear-slot-edit">Change</span>}
          </span>

          <span className="gear-slot-content">
            <ItemIcon item={gearSlot.item} />
            <span className="gear-slot-item">
              {gearSlot.item?.name ?? "Empty"}
            </span>
          </span>
        </button>

        {gearSlot.item && (
          <div className="gear-card-details">
            <div className="gear-detail-row">
              <button
                className={`gear-detail-chip ${
                  gearSlot.enchant ? "gear-detail-chip-filled" : ""
                }`}
                onClick={() => onOpenEnchantPicker(index)}
              >
                <span className="gear-detail-label">Enchant</span>
                <span className="gear-detail-value">
                  {gearSlot.enchant?.name ?? "Add"}
                </span>
              </button>

              {gearSlot.enchant && (
                <button
                  className="compact-remove-button"
                  onClick={() => onRemoveEnchant(index)}
                  aria-label={`Remove enchant from ${gearSlot.label}`}
                >
                  ×
                </button>
              )}
            </div>

            {gearSlot.item.sockets.length > 0 && (
              <div className="socket-chip-list">
                {getSocketDisplayIndexes(gearSlot.item.sockets).map((socketIndex) => {
                  const socketColor = gearSlot.item!.sockets[socketIndex];
                  const selectedGem = gearSlot.gems?.[socketIndex] ?? null;
                  const socketMatches = doesGemMatchSocket(selectedGem, socketColor);

                  return (
                    <div
                      className="socket-chip-row"
                      key={`${gearSlot.slotKey}-${socketIndex}`}
                    >
                      <button
                        className={`socket-chip ${
                          selectedGem ? "socket-chip-filled" : ""
                        } ${selectedGem && socketMatches ? "socket-chip-matched" : ""}`}
                        onClick={() => onOpenGemPicker(index, socketIndex)}
                      >
                        <span className="socket-chip-label">
                          {socketColor}
                          {selectedGem && socketMatches ? " ✓" : ""}
                        </span>
                        <span className="socket-chip-value">
                          {selectedGem?.name ?? "Add Gem"}
                        </span>
                      </button>

                      {selectedGem && (
                        <button
                          className="compact-remove-button"
                          onClick={() => onRemoveGem(index, socketIndex)}
                          aria-label={`Remove gem from ${gearSlot.label}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(socketBonusSummary || metaGems.length > 0) && (
              <div className="gear-status-row">
                {socketBonusSummary && (
                  <span
                    className={`gear-status-pill ${
                      socketBonusActive
                        ? "gear-status-pill-good"
                        : "gear-status-pill-muted"
                    }`}
                  >
                    Bonus {socketBonusActive ? "✓" : "—"} {socketBonusSummary}
                  </span>
                )}

                {metaGems.map((metaGem) => {
                  const metaIsActive = isMetaGemActive(metaGem, gear);

                  return (
                    <span
                      className={`gear-status-pill ${
                        metaIsActive
                          ? "gear-status-pill-good"
                          : "gear-status-pill-warning"
                      }`}
                      key={metaGem.id}
                      title={metaGem.name}
                    >
                      Meta {metaIsActive ? "✓" : "!"}: {" "}
                      {formatMetaRequirementProgress(metaGem, gear)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <>
      <div className="panel-title-row">
        <h2>Gear</h2>

        <label className="phase-filter">
          <span>Available Through</span>
          <select
            value={selectedPhase ?? "all"}
            onChange={(event) => onPhaseChange(event.target.value)}
          >
            {phaseOptions.map((phaseOption) => (
              <option
                key={phaseOption.label}
                value={phaseOption.value ?? "all"}
              >
                {phaseOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="gear-grid">
        {gearColumns.map((gearColumn, columnIndex) => (
          <div className="gear-column" key={`gear-column-${columnIndex}`}>
            {gearColumn.map(({ gearSlot, index }) =>
              renderGearCard(gearSlot, index)
            )}
          </div>
        ))}
      </div>
    </>
  );
}
