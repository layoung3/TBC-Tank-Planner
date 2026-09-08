import { useMemo, useState } from "react";
import { getItems } from "./api";
import type { ItemSlot, TbcItem } from "./types";
import "./App.css";

interface EquippedSlot {
  slot: ItemSlot;
  label: string;
  item?: TbcItem;
}

interface PhaseFilterOption {
  label: string;
  value?: number;
}

const phaseOptions: PhaseFilterOption[] = [
  { label: "All TBC", value: undefined },
  { label: "Pre-Raid / Phase 0", value: 0 },
  { label: "Through Phase 1", value: 1 },
  { label: "Through Phase 2", value: 2 },
  { label: "Through Phase 3", value: 3 },
  { label: "Through Phase 4", value: 4 },
  { label: "Through Phase 5", value: 5 },
];

const initialGear: EquippedSlot[] = [
  { slot: "Head", label: "Head" },
  { slot: "Neck", label: "Neck" },
  { slot: "Shoulders", label: "Shoulders" },
  { slot: "Back", label: "Back" },
  { slot: "Chest", label: "Chest" },
  { slot: "Wrist", label: "Wrist" },
  { slot: "Hands", label: "Hands" },
  { slot: "Waist", label: "Waist" },
  { slot: "Legs", label: "Legs" },
  { slot: "Feet", label: "Feet" },
  { slot: "Ring", label: "Ring 1" },
  { slot: "Ring", label: "Ring 2" },
  { slot: "Trinket", label: "Trinket 1" },
  { slot: "Trinket", label: "Trinket 2" },
  { slot: "MainHand", label: "Main Hand" },
  { slot: "Shield", label: "Shield" },
  { slot: "Libram", label: "Libram" },
];

function createEmptyStats() {
  return {
    stamina: 0,
    strength: 0,
    agility: 0,
    intellect: 0,
    armor: 0,
    defenseRating: 0,
    dodgeRating: 0,
    parryRating: 0,
    blockRating: 0,
    blockValue: 0,
    resilienceRating: 0,
    hitRating: 0,
    spellHitRating: 0,
    expertiseRating: 0,
    attackPower: 0,
    spellPower: 0,
    mp5: 0,
  };
}

function addStats(total: ReturnType<typeof createEmptyStats>, itemStats?: Partial<ReturnType<typeof createEmptyStats>>) {
  if (!itemStats) {
    return;
  }

  total.stamina += itemStats.stamina ?? 0;
  total.strength += itemStats.strength ?? 0;
  total.agility += itemStats.agility ?? 0;
  total.intellect += itemStats.intellect ?? 0;
  total.armor += itemStats.armor ?? 0;

  total.defenseRating += itemStats.defenseRating ?? 0;
  total.dodgeRating += itemStats.dodgeRating ?? 0;
  total.parryRating += itemStats.parryRating ?? 0;
  total.blockRating += itemStats.blockRating ?? 0;
  total.blockValue += itemStats.blockValue ?? 0;

  total.resilienceRating += itemStats.resilienceRating ?? 0;

  total.hitRating += itemStats.hitRating ?? 0;
  total.spellHitRating += itemStats.spellHitRating ?? 0;
  total.expertiseRating += itemStats.expertiseRating ?? 0;

  total.attackPower += itemStats.attackPower ?? 0;
  total.spellPower += itemStats.spellPower ?? 0;
  total.mp5 += itemStats.mp5 ?? 0;
}

function ItemIcon({ item }: { item?: TbcItem }) {
  if (item?.iconUrl) {
    return (
      <img
        className="item-icon"
        src={item.iconUrl}
        alt={`${item.name} icon`}
      />
    );
  }

  return <div className="item-icon item-icon-placeholder">?</div>;
}

function App() {
  const [gear, setGear] = useState<EquippedSlot[]>(initialGear);
  const [selectedPhase, setSelectedPhase] = useState<number | undefined>(undefined);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [availableItems, setAvailableItems] = useState<TbcItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  

  const selectedSlot =
    selectedSlotIndex !== null ? gear[selectedSlotIndex] : undefined;

  const gearStatTotals = useMemo(() => {
    const totals = createEmptyStats();

    gear.forEach((gearSlot) => {
      if (gearSlot.item) {
        addStats(totals, gearSlot.item.stats);
      }
    });

    return totals;
  }, [gear]);

  const visibleStatRows = [
    { label: "Stamina", value: gearStatTotals.stamina },
    { label: "Strength", value: gearStatTotals.strength },
    { label: "Agility", value: gearStatTotals.agility },
    { label: "Intellect", value: gearStatTotals.intellect },
    { label: "Armor", value: gearStatTotals.armor },
    { label: "Defense Rating", value: gearStatTotals.defenseRating },
    { label: "Dodge Rating", value: gearStatTotals.dodgeRating },
    { label: "Parry Rating", value: gearStatTotals.parryRating },
    { label: "Block Rating", value: gearStatTotals.blockRating },
    { label: "Block Value", value: gearStatTotals.blockValue },
    { label: "Resilience Rating", value: gearStatTotals.resilienceRating },
    { label: "Hit Rating", value: gearStatTotals.hitRating },
    { label: "Spell Hit Rating", value: gearStatTotals.spellHitRating },
    { label: "Expertise Rating", value: gearStatTotals.expertiseRating },
    { label: "Attack Power", value: gearStatTotals.attackPower },
    { label: "Spell Power", value: gearStatTotals.spellPower },
    { label: "MP5", value: gearStatTotals.mp5 },
  ].filter((stat) => stat.value !== 0);

  const selectedPhaseLabel =
  phaseOptions.find((option) => option.value === selectedPhase)?.label ??
  "All TBC";

  const filteredAvailableItems = useMemo(() => {
    const search = itemSearchTerm.trim().toLowerCase();

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
  }, [availableItems, itemSearchTerm]);

  async function loadItemsForSlot(slotIndex: number, phase?: number) {
    const gearSlot = gear[slotIndex];

    setAvailableItems([]);
    setError(null);
    setIsLoadingItems(true);

    try {
      const items = await getItems("ProtectionPaladin", gearSlot.slot, phase);
      setAvailableItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setIsLoadingItems(false);
    }
  }

  async function openItemPicker(slotIndex: number) {
    setSelectedSlotIndex(slotIndex);
    setItemSearchTerm("");

    await loadItemsForSlot(slotIndex, selectedPhase);
  }

  function handlePhaseChange(value: string) {
    const nextPhase = value === "all" ? undefined : Number(value);

    setSelectedPhase(nextPhase);

    if (selectedSlotIndex !== null) {
      void loadItemsForSlot(selectedSlotIndex, nextPhase);
    }
  }

  function equipItem(item: TbcItem) {
    if (selectedSlotIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === selectedSlotIndex
          ? {
              ...gearSlot,
              item,
            }
          : gearSlot
      )
    );

    setSelectedSlotIndex(null);
    setAvailableItems([]);
  }

  function closeModal() {
    setSelectedSlotIndex(null);
    setAvailableItems([]);
    setError(null);
    setItemSearchTerm("");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>TBC Tank Planner</h1>
          <p>Protection Paladin gear optimizer</p>
        </div>

        <div className="class-tabs">
          <button className="active">Protection Paladin</button>
          <button disabled>Feral Druid</button>
          <button disabled>Protection Warrior</button>
        </div>
      </header>

      <main className="main-layout">
        <section className="panel gear-panel">
          <div className="panel-title-row">
            <h2>Gear</h2>

            <label className="phase-filter">
              <span>Available Through</span>
              <select
                value={selectedPhase ?? "all"}
                onChange={(event) => handlePhaseChange(event.target.value)}
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
            {gear.map((gearSlot, index) => (
              <button
                key={`${gearSlot.label}-${index}`}
                className="gear-slot"
                onClick={() => openItemPicker(index)}
              >
                <span className="gear-slot-label">{gearSlot.label}</span>

                <span className="gear-slot-content">
                  <ItemIcon item={gearSlot.item} />
                  <span className="gear-slot-item">
                    {gearSlot.item?.name ?? "Empty"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel stats-panel">
          <h2>Gear Stat Totals</h2>

          {visibleStatRows.length === 0 ? (
            <p className="muted">Equip gear to see stat totals.</p>
          ) : (
            <div className="stat-list">
              {visibleStatRows.map((stat) => (
                <div className="stat-row" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          )}

          <p className="stat-note">
            Gear only. Gems, enchants, socket bonuses, talents, buffs, and base character stats will be added later.
          </p>
        </section>

        <section className="panel results-panel">
          <h2>Results</h2>
          <p className="muted">
            Crit immune, crush immune, EHP, DTPS, and TPS calculations will go here.
          </p>
        </section>
      </main>

      {selectedSlot && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select {selectedSlot.label}</h2>
                <p className="modal-subtitle">
                  Filter: {selectedPhaseLabel}
                </p>
              </div>

              <button onClick={closeModal}>X</button>
            </div>

            <div className="picker-toolbar">
              <label className="picker-search">
                <span>Search Items</span>
                <input
                  value={itemSearchTerm}
                  onChange={(event) => setItemSearchTerm(event.target.value)}
                  placeholder="Search by name, source, quality..."
                />
              </label>

              <label className="phase-filter">
                <span>Available Through</span>
                <select
                  value={selectedPhase ?? "all"}
                  onChange={(event) => handlePhaseChange(event.target.value)}
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
                  onClick={() => equipItem(item)}
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

                  <span className="item-stats">
                    {item.stats.stamina > 0 && `+${item.stats.stamina} Stam `}
                    {item.stats.defenseRating > 0 &&
                      `+${item.stats.defenseRating} Def `}
                    {item.stats.dodgeRating > 0 &&
                      `+${item.stats.dodgeRating} Dodge `}
                    {item.stats.spellPower > 0 &&
                      `+${item.stats.spellPower} SP`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;