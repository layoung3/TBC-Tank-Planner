import { useEffect, useMemo, useState } from "react";
import {
  calculateFinalCharacterStats,
  calculateGearStats,
  getEnchants,
  getItems,
} from "./api";
import type {
  CharacterRace,
  EquippedGearItem,
  FinalCharacterStatsResponse,
  ItemSlot,
  StatBlock,
  TbcEnchant,
  TbcItem,
} from "./types";
import "./App.css";

interface EquippedSlot {
  slotKey: string;
  slot: ItemSlot;
  label: string;
  item?: TbcItem;
  enchant?: TbcEnchant;
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

interface RaceOption {
  label: string;
  value: CharacterRace;
}

const raceOptions: RaceOption[] = [
  { label: "Blood Elf", value: "BloodElf" },
  { label: "Draenei", value: "Draenei" },
  { label: "Human", value: "Human" },
  { label: "Dwarf", value: "Dwarf" },
];

const initialGear: EquippedSlot[] = [
  { slotKey: "Head", slot: "Head", label: "Head" },
  { slotKey: "Neck", slot: "Neck", label: "Neck" },
  { slotKey: "Shoulders", slot: "Shoulders", label: "Shoulders" },
  { slotKey: "Back", slot: "Back", label: "Back" },
  { slotKey: "Chest", slot: "Chest", label: "Chest" },
  { slotKey: "Wrist", slot: "Wrist", label: "Wrist" },
  { slotKey: "Hands", slot: "Hands", label: "Hands" },
  { slotKey: "Waist", slot: "Waist", label: "Waist" },
  { slotKey: "Legs", slot: "Legs", label: "Legs" },
  { slotKey: "Feet", slot: "Feet", label: "Feet" },
  { slotKey: "Ring1", slot: "Ring", label: "Ring 1" },
  { slotKey: "Ring2", slot: "Ring", label: "Ring 2" },
  { slotKey: "Trinket1", slot: "Trinket", label: "Trinket 1" },
  { slotKey: "Trinket2", slot: "Trinket", label: "Trinket 2" },
  { slotKey: "MainHand", slot: "MainHand", label: "Main Hand" },
  { slotKey: "Shield", slot: "Shield", label: "Shield" },
  { slotKey: "Libram", slot: "Libram", label: "Libram" },
];

function createEmptyStats(): StatBlock {
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
  const [gearStatTotals, setGearStatTotals] = useState<StatBlock>(
    createEmptyStats()
  );
  const [calculationWarnings, setCalculationWarnings] = useState<string[]>([]);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);
  const [selectedRace, setSelectedRace] = useState<CharacterRace>("BloodElf");
  const [includeHolyShield, setIncludeHolyShield] = useState(true);

  const [finalCharacterStats, setFinalCharacterStats] =
    useState<FinalCharacterStatsResponse | null>(null);

  const [isCalculatingFinalStats, setIsCalculatingFinalStats] = useState(false);
  const [finalStatsError, setFinalStatsError] = useState<string | null>(null);

  const [selectedEnchantSlotIndex, setSelectedEnchantSlotIndex] = useState<number | null>(null);
  const [availableEnchants, setAvailableEnchants] = useState<TbcEnchant[]>([]);
  const [isLoadingEnchants, setIsLoadingEnchants] = useState(false);
  const [enchantError, setEnchantError] = useState<string | null>(null);
  const [enchantSearchTerm, setEnchantSearchTerm] = useState("");
  

  const selectedSlot =
    selectedSlotIndex !== null ? gear[selectedSlotIndex] : undefined;

  const selectedEnchantSlot =
    selectedEnchantSlotIndex !== null ? gear[selectedEnchantSlotIndex] : undefined;

  const equippedGear = useMemo<EquippedGearItem[]>(
    () =>
      gear
        .filter((gearSlot) => gearSlot.item)
        .map((gearSlot) => ({
          slotKey: gearSlot.slotKey,
          slot: gearSlot.slot,
          itemId: gearSlot.item?.id ?? null,
          enchantId: gearSlot.enchant?.id ?? null,
          gemIds: [],
        })),
    [gear]
  );

  useEffect(() => {
    async function updateGearStats() {
      if (equippedGear.length === 0) {
        setGearStatTotals(createEmptyStats());
        setCalculationWarnings([]);
        return;
      }

      try {
        setIsCalculatingStats(true);

        const result = await calculateGearStats(equippedGear);

        setGearStatTotals(result.gearStats);
        setCalculationWarnings(result.warnings);
      } catch {
        setCalculationWarnings(["Unable to calculate gear stats."]);
      } finally {
        setIsCalculatingStats(false);
      }
    }

    void updateGearStats();
  }, [equippedGear]);

  useEffect(() => {
    async function updateFinalCharacterStats() {
      try {
        setIsCalculatingFinalStats(true);
        setFinalStatsError(null);

        const result = await calculateFinalCharacterStats(
          selectedRace,
          equippedGear,
          includeHolyShield
        );

        setFinalCharacterStats(result);
      } catch {
        setFinalStatsError("Unable to calculate final character stats.");
      } finally {
        setIsCalculatingFinalStats(false);
      }
    }

    void updateFinalCharacterStats();
  }, [selectedRace, equippedGear, includeHolyShield]);

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

  const visibleFinalStatRows = finalCharacterStats
  ? [
      { label: "Stamina", value: finalCharacterStats.finalStats.stamina },
      { label: "Strength", value: finalCharacterStats.finalStats.strength },
      { label: "Agility", value: finalCharacterStats.finalStats.agility },
      { label: "Intellect", value: finalCharacterStats.finalStats.intellect },
      { label: "Armor", value: finalCharacterStats.finalStats.armor },
      {
        label: "Defense Rating",
        value: finalCharacterStats.finalStats.defenseRating,
      },
      {
        label: "Dodge Rating",
        value: finalCharacterStats.finalStats.dodgeRating,
      },
      {
        label: "Parry Rating",
        value: finalCharacterStats.finalStats.parryRating,
      },
      {
        label: "Block Rating",
        value: finalCharacterStats.finalStats.blockRating,
      },
      {
        label: "Block Value",
        value: finalCharacterStats.finalStats.blockValue,
      },
      {
        label: "Resilience Rating",
        value: finalCharacterStats.finalStats.resilienceRating,
      },
      { label: "Hit Rating", value: finalCharacterStats.finalStats.hitRating },
      {
        label: "Spell Hit Rating",
        value: finalCharacterStats.finalStats.spellHitRating,
      },
      {
        label: "Expertise Rating",
        value: finalCharacterStats.finalStats.expertiseRating,
      },
      {
        label: "Attack Power",
        value: finalCharacterStats.finalStats.attackPower,
      },
      { label: "Spell Power", value: finalCharacterStats.finalStats.spellPower },
      { label: "MP5", value: finalCharacterStats.finalStats.mp5 },
    ].filter((stat) => stat.value !== 0)
  : [];

  const derivedTankStats = finalCharacterStats?.derivedTankStats;

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

  const filteredAvailableEnchants = useMemo(() => {
    const search = enchantSearchTerm.trim().toLowerCase();

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
  }, [availableEnchants, enchantSearchTerm]);

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
    if (selectedEnchantSlotIndex !== null) {
      void loadEnchantsForSlot(selectedEnchantSlotIndex, nextPhase);
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

  async function loadEnchantsForSlot(slotIndex: number, phase?: number) {
    const gearSlot = gear[slotIndex];

    setAvailableEnchants([]);
    setEnchantError(null);
    setIsLoadingEnchants(true);

    try {
      const enchants = await getEnchants(gearSlot.slot, phase);
      setAvailableEnchants(enchants);
    } catch (err) {
      setEnchantError(
        err instanceof Error ? err.message : "Failed to load enchants."
      );
    } finally {
      setIsLoadingEnchants(false);
    }
  }

  async function openEnchantPicker(slotIndex: number) {
    setSelectedEnchantSlotIndex(slotIndex);
    setEnchantSearchTerm("");

    await loadEnchantsForSlot(slotIndex, selectedPhase);
  }

  function equipEnchant(enchant: TbcEnchant) {
    if (selectedEnchantSlotIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === selectedEnchantSlotIndex
          ? {
              ...gearSlot,
              enchant,
            }
          : gearSlot
      )
    );

    closeEnchantModal();
  }

  function removeEnchant(slotIndex: number) {
    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === slotIndex
          ? {
              ...gearSlot,
              enchant: undefined,
            }
          : gearSlot
      )
    );
  }

  function closeEnchantModal() {
    setSelectedEnchantSlotIndex(null);
    setAvailableEnchants([]);
    setEnchantError(null);
    setEnchantSearchTerm("");
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
              <div key={`${gearSlot.label}-${index}`} className="gear-slot-card">
                <button className="gear-slot gear-slot-main" onClick={() => openItemPicker(index)}>
                  <span className="gear-slot-label">{gearSlot.label}</span>

                  <span className="gear-slot-content">
                    <ItemIcon item={gearSlot.item} />
                    <span className="gear-slot-item">{gearSlot.item?.name ?? "Empty"}</span>
                  </span>
                </button>

                {gearSlot.item && (
                  <div className="gear-slot-actions">
                    <button
                      className="enchant-button"
                      onClick={() => openEnchantPicker(index)}
                    >
                      {gearSlot.enchant ? gearSlot.enchant.name : "Add Enchant"}
                    </button>

                    {gearSlot.enchant && (
                      <button
                        className="remove-enchant-button"
                        onClick={() => removeEnchant(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel stats-panel">
          <h2>Gear Stat Totals</h2>

          <div className="effect-toggle-row">
            <label className="effect-toggle">
              <input
                type="checkbox"
                checked={includeHolyShield}
                onChange={(event) => setIncludeHolyShield(event.target.checked)}
              />
              <span>Include Holy Shield</span>
            </label>

            <span className="effect-note">
              Adds +30% block chance to the crush table while active.
            </span>
          </div>

          {isCalculatingStats && <p className="muted">Calculating...</p>}

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

          {calculationWarnings.length > 0 && (
            <div className="warning-list">
              {calculationWarnings.map((warning) => (
                <p key={warning} className="warning-message">
                  {warning}
                </p>
              ))}
            </div>
          )}

          <p className="stat-note">
            Gear only. Gems, enchants, socket bonuses, talents, buffs, and base character stats will be added later.
          </p>
        </section>

        <section className="panel results-panel">
          <div className="panel-title-row">
            <h2>Final Character Stats</h2>

            <label className="race-filter">
              <span>Race</span>
              <select
                value={selectedRace}
                onChange={(event) =>
                  setSelectedRace(event.target.value as CharacterRace)
                }
              >
                {raceOptions.map((raceOption) => (
                  <option key={raceOption.value} value={raceOption.value}>
                    {raceOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isCalculatingFinalStats && <p className="muted">Calculating...</p>}

          {finalStatsError && <p className="error">{finalStatsError}</p>}

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

              <div className="stat-list">
                {visibleFinalStatRows.map((stat) => (
                  <div className="stat-row" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              {derivedTankStats && (
                <>
                  <h3 className="subsection-title">Tank Table</h3>

                  <div className="stat-list">
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
                Final stats currently include base level 70 Protection Paladin stats
                plus equipped gear. Gems, enchants, socket bonuses, talents, and buffs
                will be added later.
              </p>
            </>
          )}
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
      {selectedEnchantSlot && (
        <div className="modal-backdrop" onClick={closeEnchantModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select Enchant</h2>
                <p className="modal-subtitle">
                  {selectedEnchantSlot.label} • Filter: {selectedPhaseLabel}
                </p>
              </div>

              <button onClick={closeEnchantModal}>X</button>
            </div>

            <div className="picker-toolbar">
              <label className="picker-search">
                <span>Search Enchants</span>
                <input
                  value={enchantSearchTerm}
                  onChange={(event) => setEnchantSearchTerm(event.target.value)}
                  placeholder="Search by name or source..."
                />
              </label>

              <label className="phase-filter">
                <span>Available Through</span>
                <select
                  value={selectedPhase ?? "all"}
                  onChange={(event) => handlePhaseChange(event.target.value)}
                >
                  {phaseOptions.map((phaseOption) => (
                    <option key={phaseOption.label} value={phaseOption.value ?? "all"}>
                      {phaseOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoadingEnchants && <p>Loading enchants...</p>}

            {enchantError && <p className="error">{enchantError}</p>}

            {!isLoadingEnchants &&
              !enchantError &&
              filteredAvailableEnchants.length === 0 && (
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
                  onClick={() => equipEnchant(enchant)}
                >
                  <div>
                    <span className="item-name">{enchant.name}</span>
                    <span className="item-details">
                      Phase {enchant.phase} • {enchant.source}
                    </span>
                  </div>

                  <span className="item-stats">
                    {enchant.stats.stamina > 0 && `+${enchant.stats.stamina} Stam `}
                    {enchant.stats.defenseRating > 0 &&
                      `+${enchant.stats.defenseRating} Def `}
                    {enchant.stats.dodgeRating > 0 &&
                      `+${enchant.stats.dodgeRating} Dodge `}
                    {enchant.stats.blockValue > 0 &&
                      `+${enchant.stats.blockValue} Block Value `}
                    {enchant.stats.spellPower > 0 &&
                      `+${enchant.stats.spellPower} SP`}
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