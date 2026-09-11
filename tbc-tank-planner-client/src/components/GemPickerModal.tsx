import { useMemo } from "react";
import type { PhaseFilterOption, EquippedSlot } from "../models/plannerModels";
import type { SocketColor, TbcGem } from "../types";
import { formatStatSummary } from "../utils/statFormatting";

interface GemPickerModalProps {
  selectedSlot: EquippedSlot;
  selectedSocketColor: SocketColor;
  selectedPhase: number | undefined;
  selectedPhaseLabel: string;
  phaseOptions: PhaseFilterOption[];
  availableGems: TbcGem[];
  isLoadingGems: boolean;
  error: string | null;
  searchTerm: string;
  includeEpicGems: boolean;
  onSearchTermChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onIncludeEpicGemsChange: (checked: boolean) => void;
  onSelectGem: (gem: TbcGem) => void;
  onClose: () => void;
}

export function GemPickerModal({
  selectedSlot,
  selectedSocketColor,
  selectedPhase,
  selectedPhaseLabel,
  phaseOptions,
  availableGems,
  isLoadingGems,
  error,
  searchTerm,
  includeEpicGems,
  onSearchTermChange,
  onPhaseChange,
  onIncludeEpicGemsChange,
  onSelectGem,
  onClose,
}: GemPickerModalProps) {
  const filteredAvailableGems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return availableGems;
    }

    return availableGems.filter((gem) => {
      const searchableText = [
        gem.name,
        gem.color,
        gem.quality,
        gem.source,
        gem.phase.toString(),
        gem.effectDescription ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableGems, searchTerm]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Select Gem</h2>
            <p className="modal-subtitle">
              {selectedSlot.label} • {selectedSocketColor} Socket • Filter:{" "}
              {selectedPhaseLabel}
            </p>
          </div>

          <button onClick={onClose}>X</button>
        </div>

        <div className="picker-toolbar">
          <label className="picker-search">
            <span>Search Gems</span>
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by name, color, source..."
            />
          </label>

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

        <label className="effect-toggle gem-toggle">
          <input
            type="checkbox"
            checked={includeEpicGems}
            onChange={(event) => onIncludeEpicGemsChange(event.target.checked)}
          />
          <span>Include Epic Gems</span>
        </label>

        {isLoadingGems && <p>Loading gems...</p>}

        {error && <p className="error">{error}</p>}

        {!isLoadingGems && !error && filteredAvailableGems.length === 0 && (
          <p className="muted">
            {availableGems.length === 0
              ? "No gems found for this socket and phase yet."
              : "No gems match your search."}
          </p>
        )}

        <div className="item-list">
          {filteredAvailableGems.map((gem) => (
            <button
              key={gem.id}
              className="item-row"
              onClick={() => onSelectGem(gem)}
            >
              <div>
                <span className="item-name">{gem.name}</span>
                <span className="item-details">
                  {gem.quality} • {gem.color} • Phase {gem.phase} • {gem.source}
                </span>
                {gem.effectDescription && (
                  <span className="item-details">{gem.effectDescription}</span>
                )}
                {gem.metaRequirementDescription && (
                  <span className="item-details">
                    {gem.metaRequirementDescription}
                  </span>
                )}
              </div>

              <span className="item-stats">{formatStatSummary(gem.stats)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
