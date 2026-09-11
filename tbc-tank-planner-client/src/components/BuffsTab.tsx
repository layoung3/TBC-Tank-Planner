import { useMemo } from "react";
import type {
  ActiveBuffEffect,
  ActiveBuffSelection,
  BuffDefinition,
  BuffCategory,
} from "../types";
import { formatStatSummary } from "../utils/statFormatting";
import { EffectSummaryList } from "./EffectSummaryList";

interface BuffsTabProps {
  buffs: BuffDefinition[];
  activeBuffSelections: ActiveBuffSelection[];
  activeBuffEffects: ActiveBuffEffect[];
  onBuffActiveChange: (buffId: string, isActive: boolean) => void;
  onBuffVariantChange: (buffId: string, variantId: string) => void;
  onClearBuffs: () => void;
}

const categoryOrder: BuffCategory[] = [
  "Blessing",
  "Raid",
  "Aura",
  "Consumable",
  "Weapon",
  "Temporary",
];

function getActiveSelection(
  activeBuffSelections: ActiveBuffSelection[],
  buffId: string
) {
  return activeBuffSelections.find((selection) => selection.buffId === buffId);
}

function getSelectedStats(buff: BuffDefinition, selection?: ActiveBuffSelection) {
  const selectedVariant = selection?.variantId
    ? buff.variants?.find((variant) => variant.id === selection.variantId)
    : undefined;

  return selectedVariant?.stats ?? buff.stats;
}

function getBuffTitle(buff: BuffDefinition) {
  return [buff.name, buff.source, buff.description].filter(Boolean).join("\n");
}

export function BuffsTab({
  buffs,
  activeBuffSelections,
  activeBuffEffects,
  onBuffActiveChange,
  onBuffVariantChange,
  onClearBuffs,
}: BuffsTabProps) {
  const buffsByCategory = useMemo(() => {
    return categoryOrder
      .map((category) => ({
        category,
        buffs: buffs.filter((buff) => buff.category === category),
      }))
      .filter((group) => group.buffs.length > 0);
  }, [buffs]);

  return (
    <div className="buff-tab-content">
      <div className="buff-toolbar">
        <div>
          <h2>Buffs</h2>
          <p className="panel-caption">
            Select all buffs available to this build. Blessings are not mutually
            exclusive because multiple paladins can cover multiple blessings.
            Improved versions can be selected per buff where supported.
          </p>
        </div>

        <button className="secondary-button" onClick={onClearBuffs}>
          Clear Buffs
        </button>
      </div>

      <div className="buff-group-list">
        {buffsByCategory.map((group) => (
          <section className="buff-group" key={group.category}>
            <h3>{group.category}</h3>

            <div className="buff-option-list">
              {group.buffs.map((buff) => {
                const activeSelection = getActiveSelection(
                  activeBuffSelections,
                  buff.id
                );
                const isActive = Boolean(activeSelection);
                const statSummary = formatStatSummary(
                  getSelectedStats(buff, activeSelection)
                );

                return (
                  <article
                    className={`buff-option ${isActive ? "buff-option-active" : ""}`}
                    key={buff.id}
                    title={getBuffTitle(buff)}
                  >
                    <label className="buff-option-toggle">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(event) =>
                          onBuffActiveChange(buff.id, event.target.checked)
                        }
                      />

                      <span className="buff-option-name">
                        {buff.shortName ?? buff.name}
                      </span>
                    </label>

                    <div className="buff-option-meta-row">
                      <span>{buff.source}</span>
                      {statSummary && <span>{statSummary}</span>}
                    </div>

                    {isActive && buff.variants && buff.variants.length > 0 && (
                      <select
                        className="buff-variant-select"
                        value={activeSelection?.variantId ?? buff.variants[0].id}
                        onChange={(event) =>
                          onBuffVariantChange(buff.id, event.target.value)
                        }
                        aria-label={`${buff.name} version`}
                      >
                        {buff.variants.map((variant) => (
                          <option value={variant.id} key={variant.id}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <EffectSummaryList
        title="Active Buff Overview"
        effects={activeBuffEffects}
        emptyMessage="No buffs selected."
      />
    </div>
  );
}
