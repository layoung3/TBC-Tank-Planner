import { useMemo } from "react";
import type { PhaseFilterOption, EquippedSlot } from "../models/plannerModels";
import type { TbcEnchant } from "../types";
import { formatStatSummary } from "../utils/statFormatting";

interface EnchantPickerModalProps {
  selectedSlot: EquippedSlot;
  selectedPhase: number | undefined;
  selectedPhaseLabel: string;
  phaseOptions: PhaseFilterOption[];
  availableEnchants: TbcEnchant[];
  isLoadingEnchants: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onSelectEnchant: (enchant: TbcEnchant) => void;
  onClose: () => void;
}

export function EnchantPickerModal({
  selectedSlot,
  selectedPhase,
  selectedPhaseLabel,
  phaseOptions,
  availableEnchants,
  isLoadingEnchants,
  error,
  searchTerm,
  onSearchTermChange,
  onPhaseChange,
  onSelectEnchant,
  onClose,
}: EnchantPickerModalProps) {
  const filteredAvailableEnchants = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return availableEnchants;
    }

    return availableEnchants.filter((enchant) => {
      const searchableText = [
        enchant.name,
        enchant.source,
        enchant.phase.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableEnchants, searchTerm]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Select Enchant</h2>
            <p className="modal-subtitle">
              {selectedSlot.label} • Filter: {selectedPhaseLabel}
            </p>
          </div>

          <button onClick={onClose}>X</button>
        </div>

        <div className="picker-toolbar">
          <label className="picker-search">
            <span>Search Enchants</span>
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by name or source..."
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

        {isLoadingEnchants && <p>Loading enchants...</p>}

        {error && <p className="error">{error}</p>}

        {!isLoadingEnchants && !error && filteredAvailableEnchants.length === 0 && (
          <p className="muted">
            {availableEnchants.length === 0
              ? "No enchants found for this slot and phase yet."
              : "No enchants match your search."}
          </p>
        )}

        <div className="item-list">
          {filteredAvailableEnchants.map((enchant) => (
            <button
              key={enchant.id}
              className="item-row"
              onClick={() => onSelectEnchant(enchant)}
            >
              <div>
                <span className="item-name">{enchant.name}</span>
                <span className="item-details">
                  Phase {enchant.phase} • {enchant.source}
                </span>
              </div>

              <span className="item-stats">{formatStatSummary(enchant.stats)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
