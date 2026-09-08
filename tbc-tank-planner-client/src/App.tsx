import { useMemo, useState } from "react";
import { getItems } from "./api";
import type { ItemSlot, TbcItem } from "./types";
import "./App.css";

interface EquippedSlot {
  slot: ItemSlot;
  label: string;
  item?: TbcItem;
}

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
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [availableItems, setAvailableItems] = useState<TbcItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function openItemPicker(slotIndex: number) {
    const gearSlot = gear[slotIndex];

    setSelectedSlotIndex(slotIndex);
    setAvailableItems([]);
    setError(null);
    setIsLoadingItems(true);

    try {
      const items = await getItems("ProtectionPaladin", gearSlot.slot);
      setAvailableItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setIsLoadingItems(false);
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
          <h2>Gear</h2>

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
              <h2>Select {selectedSlot.label}</h2>
              <button onClick={closeModal}>X</button>
            </div>

            {isLoadingItems && <p>Loading items...</p>}

            {error && <p className="error">{error}</p>}

            {!isLoadingItems && !error && availableItems.length === 0 && (
              <p>No items found for this slot yet.</p>
            )}

            <div className="item-list">
              {availableItems.map((item) => (
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