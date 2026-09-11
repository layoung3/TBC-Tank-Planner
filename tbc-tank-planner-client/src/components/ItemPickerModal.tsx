import { useMemo } from "react";
import type { PhaseFilterOption, EquippedSlot } from "../models/plannerModels";
import type { TbcItem } from "../types";
import { formatStatSummary } from "../utils/statFormatting";
import { ItemIcon } from "./ItemIcon";

interface ItemPickerModalProps {
  selectedSlot: EquippedSlot;
  selectedPhase: number | undefined;
  selectedPhaseLabel: string;
  phaseOptions: PhaseFilterOption[];
  availableItems: TbcItem[];
  isLoadingItems: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onPhaseChange: (value: string) => void;
  onSelectItem: (item: TbcItem) => void;
  onClose: () => void;
}

export function ItemPickerModal({
  selectedSlot,
  selectedPhase,
  selectedPhaseLabel,
  phaseOptions,
  availableItems,
  isLoadingItems,
  error,
  searchTerm,
  onSearchTermChange,
  onPhaseChange,
  onSelectItem,
  onClose,
}: ItemPickerModalProps) {
  const filteredAvailableItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return availableItems;
    }

    return availableItems.filter((item) => {
      const searchableText = [
        item.name,
        item.source,
        item.quality,
        item.phase.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableItems, searchTerm]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Select {selectedSlot.label}</h2>
            <p className="modal-subtitle">Filter: {selectedPhaseLabel}</p>
          </div>

          <button onClick={onClose}>X</button>
        </div>

        <div className="picker-toolbar">
          <label className="picker-search">
            <span>Search Items</span>
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by name, source, quality..."
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

        {isLoadingItems && <p>Loading items...</p>}

        {error && <p className="error">{error}</p>}

        {!isLoadingItems && !error && filteredAvailableItems.length === 0 && (
          <p className="muted">
            {availableItems.length === 0
              ? "No items found for this slot and phase yet."
              : "No items match your search."}
          </p>
        )}

        <div className="item-list">
          {filteredAvailableItems.map((item) => (
            <button
              key={item.id}
              className="item-row"
              onClick={() => onSelectItem(item)}
            >
              <div>
                <div className="item-main">
                  <ItemIcon item={item} />

                  <div>
                    <span className="item-name">{item.name}</span>
                    <span className="item-details">
                      {item.quality} • Phase {item.phase} • {item.source}
                    </span>
                  </div>
                </div>
              </div>

              <span className="item-stats">{formatStatSummary(item.stats)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
