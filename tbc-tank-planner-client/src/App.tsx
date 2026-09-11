import { useEffect, useMemo, useState } from "react";
import {
  calculateFinalCharacterStats,
  calculateGearStats,
  getEnchants,
  getGems,
  getItems,
  getTalents,
} from "./api";
import { BuildTabs } from "./components/BuildTabs";
import { EffectSummaryList } from "./components/EffectSummaryList";
import { ItemPickerModal } from "./components/ItemPickerModal";
import { EnchantPickerModal } from "./components/EnchantPickerModal";
import { GemPickerModal } from "./components/GemPickerModal";
import { GearTab } from "./components/GearTab";
import { TalentsTab } from "./components/TalentsTab";
import {
  getBuildTabLabel,
  initialGear,
  phaseOptions,
  raceOptions,
} from "./config/plannerOptions";
import type { BuildTab, EquippedSlot } from "./models/plannerModels";
import type {
  CharacterRace,
  CharacterTalentBuild,
  EquippedGearItem,
  ActiveItemSetBonus,
  FinalCharacterStatsResponse,
  SocketColor,
  StatBlock,
  TalentTreeDefinition,
  TbcEnchant,
  TbcGem,
  TbcItem,
} from "./types";
import { createEmptyStats } from "./utils/statFormatting";
import "./App.css";

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
  const [activeGearSetBonuses, setActiveGearSetBonuses] = useState<ActiveItemSetBonus[]>([]);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);
  const [selectedRace, setSelectedRace] = useState<CharacterRace>("BloodElf");
  const [includeHolyShield, setIncludeHolyShield] = useState(true);

  const [finalCharacterStats, setFinalCharacterStats] =
    useState<FinalCharacterStatsResponse | null>(null);

  const [isCalculatingFinalStats, setIsCalculatingFinalStats] = useState(false);
  const [finalStatsError, setFinalStatsError] = useState<string | null>(null);

  const [talentTrees, setTalentTrees] = useState<TalentTreeDefinition[]>([]);
  const [talentRanks, setTalentRanks] = useState<Record<string, number>>({});
  const [isLoadingTalents, setIsLoadingTalents] = useState(false);
  const [talentError, setTalentError] = useState<string | null>(null);

  const [selectedEnchantSlotIndex, setSelectedEnchantSlotIndex] = useState<number | null>(null);
  const [availableEnchants, setAvailableEnchants] = useState<TbcEnchant[]>([]);
  const [isLoadingEnchants, setIsLoadingEnchants] = useState(false);
  const [enchantError, setEnchantError] = useState<string | null>(null);
  const [enchantSearchTerm, setEnchantSearchTerm] = useState("");

  const [selectedGemSlotIndex, setSelectedGemSlotIndex] = useState<number | null>(
    null
  );
  const [selectedGemSocketIndex, setSelectedGemSocketIndex] = useState<
    number | null
  >(null);
  const [availableGems, setAvailableGems] = useState<TbcGem[]>([]);
  const [isLoadingGems, setIsLoadingGems] = useState(false);
  const [gemError, setGemError] = useState<string | null>(null);
  const [gemSearchTerm, setGemSearchTerm] = useState("");
  const [includeEpicGems, setIncludeEpicGems] = useState(true);
  const [activeBuildTab, setActiveBuildTab] = useState<BuildTab>("gear");

  const selectedTalentBuild = useMemo<CharacterTalentBuild>(
    () => ({
      class: "ProtectionPaladin",
      talentRanks,
    }),
    [talentRanks]
  );


  const selectedSlot =
    selectedSlotIndex !== null ? gear[selectedSlotIndex] : undefined;

  const activeFinalSetBonuses = finalCharacterStats?.activeSetBonuses ?? [];

  const activeTalentEffects = finalCharacterStats?.activeTalentEffects ?? [];
  const talentWarnings = finalCharacterStats?.talentWarnings ?? [];

  const selectedEnchantSlot =
    selectedEnchantSlotIndex !== null ? gear[selectedEnchantSlotIndex] : undefined;

  const selectedGemSlot =
    selectedGemSlotIndex !== null ? gear[selectedGemSlotIndex] : undefined;

  const selectedGemSocketColor: SocketColor | undefined =
    selectedGemSlot &&
    selectedGemSocketIndex !== null &&
    selectedGemSlot.item?.sockets[selectedGemSocketIndex]
      ? selectedGemSlot.item.sockets[selectedGemSocketIndex]
      : undefined;

  const equippedGear = useMemo<EquippedGearItem[]>(
    () =>
      gear
        .filter((gearSlot) => gearSlot.item)
        .map((gearSlot) => ({
          slotKey: gearSlot.slotKey,
          slot: gearSlot.slot,
          itemId: gearSlot.item?.id ?? null,
          enchantId: gearSlot.enchant?.id ?? null,
          gemIds: gearSlot.gems?.map((gem) => gem?.id ?? null) ?? [],
        })),
    [gear]
  );

  useEffect(() => {
    async function updateGearStats() {
      if (equippedGear.length === 0) {
        setGearStatTotals(createEmptyStats());
        setCalculationWarnings([]);
        setActiveGearSetBonuses([]);
        return;
      }

      try {
        setIsCalculatingStats(true);

        const result = await calculateGearStats(equippedGear);

        setGearStatTotals(result.gearStats);
        setCalculationWarnings(result.warnings);
        setActiveGearSetBonuses(result.activeSetBonuses ?? []);
      } catch {
        setCalculationWarnings(["Unable to calculate gear stats."]);
      } finally {
        setIsCalculatingStats(false);
      }
    }

    void updateGearStats();
  }, [equippedGear]);

  useEffect(() => {
    async function loadTalents() {
      try {
        setIsLoadingTalents(true);
        setTalentError(null);

        const result = await getTalents("ProtectionPaladin");

        setTalentTrees(result);
      } catch {
        setTalentError("Unable to load talents.");
      } finally {
        setIsLoadingTalents(false);
      }
    }

    void loadTalents();
  }, []);

  useEffect(() => {
    async function updateFinalCharacterStats() {
      try {
        setIsCalculatingFinalStats(true);
        setFinalStatsError(null);

        const result = await calculateFinalCharacterStats(
          selectedRace,
          equippedGear,
          includeHolyShield,
          selectedTalentBuild,
        );

        setFinalCharacterStats(result);
      } catch {
        setFinalStatsError("Unable to calculate final character stats.");
      } finally {
        setIsCalculatingFinalStats(false);
      }
    }

    void updateFinalCharacterStats();
  }, [selectedRace, equippedGear, includeHolyShield, selectedTalentBuild]);

  
  const visibleStatRows = [
    { label: "Stamina", value: gearStatTotals.stamina },
    { label: "Strength", value: gearStatTotals.strength },
    { label: "Agility", value: gearStatTotals.agility },
    { label: "Intellect", value: gearStatTotals.intellect },
    { label: "Armor", value: gearStatTotals.armor },
    { label: "Arcane Resistance", value: gearStatTotals.arcaneResistance },
    { label: "Fire Resistance", value: gearStatTotals.fireResistance },
    { label: "Frost Resistance", value: gearStatTotals.frostResistance },
    { label: "Nature Resistance", value: gearStatTotals.natureResistance },
    { label: "Shadow Resistance", value: gearStatTotals.shadowResistance },
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
        label: "Arcane Resistance",
        value: finalCharacterStats.finalStats.arcaneResistance,
      },
      {
        label: "Fire Resistance",
        value: finalCharacterStats.finalStats.fireResistance,
      },
      {
        label: "Frost Resistance",
        value: finalCharacterStats.finalStats.frostResistance,
      },
      {
        label: "Nature Resistance",
        value: finalCharacterStats.finalStats.natureResistance,
      },
      {
        label: "Shadow Resistance",
        value: finalCharacterStats.finalStats.shadowResistance,
      },
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
  const physicalMitigationStats = finalCharacterStats?.physicalMitigationStats;
  const magicMitigationStats = finalCharacterStats?.magicMitigationStats;

  const selectedPhaseLabel =
    phaseOptions.find((option) => option.value === selectedPhase)?.label ??
    "All TBC";

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
    if (selectedGemSlotIndex !== null && selectedGemSocketIndex !== null) {
      void loadGemsForSocket(selectedGemSlotIndex, selectedGemSocketIndex, nextPhase);
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
            gems: item.sockets.map(() => null),
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

  async function loadGemsForSocket(
    slotIndex: number,
    socketIndex: number,
    phase?: number,
    includeEpics = includeEpicGems
  ) {
    const gearSlot = gear[slotIndex];
    const socketColor = gearSlot.item?.sockets[socketIndex];

    if (!socketColor) {
      return;
    }

    setAvailableGems([]);
    setGemError(null);
    setIsLoadingGems(true);

    try {
      const gems = await getGems(socketColor, phase, false, includeEpics);
      setAvailableGems(gems);
    } catch (err) {
      setGemError(err instanceof Error ? err.message : "Failed to load gems.");
    } finally {
      setIsLoadingGems(false);
    }
  }

  async function openGemPicker(slotIndex: number, socketIndex: number) {
    setSelectedGemSlotIndex(slotIndex);
    setSelectedGemSocketIndex(socketIndex);
    setGemSearchTerm("");

    await loadGemsForSocket(slotIndex, socketIndex, selectedPhase);
  }

  function equipGem(gem: TbcGem) {
    if (selectedGemSlotIndex === null || selectedGemSocketIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) => {
        if (index !== selectedGemSlotIndex || !gearSlot.item) {
          return gearSlot;
        }

        const nextGems =
          gearSlot.gems && gearSlot.gems.length === gearSlot.item.sockets.length
            ? [...gearSlot.gems]
            : gearSlot.item.sockets.map(() => null);

        nextGems[selectedGemSocketIndex] = gem;

        return {
          ...gearSlot,
          gems: nextGems,
        };
      })
    );

    closeGemModal();
  }

  function removeGem(slotIndex: number, socketIndex: number) {
    setGear((currentGear) =>
      currentGear.map((gearSlot, index) => {
        if (index !== slotIndex || !gearSlot.item) {
          return gearSlot;
        }

        const nextGems =
          gearSlot.gems && gearSlot.gems.length === gearSlot.item.sockets.length
            ? [...gearSlot.gems]
            : gearSlot.item.sockets.map(() => null);

        nextGems[socketIndex] = null;

        return {
          ...gearSlot,
          gems: nextGems,
        };
      })
    );
  }

  function closeGemModal() {
    setSelectedGemSlotIndex(null);
    setSelectedGemSocketIndex(null);
    setAvailableGems([]);
    setGemError(null);
    setGemSearchTerm("");
  }

  function handleIncludeEpicGemsChange(checked: boolean) {
    setIncludeEpicGems(checked);

    if (selectedGemSlotIndex !== null && selectedGemSocketIndex !== null) {
      void loadGemsForSocket(
        selectedGemSlotIndex,
        selectedGemSocketIndex,
        selectedPhase,
        checked
      );
    }
  }

  function updateTalentRank(talentKey: string, nextRank: number) {
    setTalentRanks((currentRanks) => {
      const nextRanks = { ...currentRanks };

      if (nextRank <= 0) {
        delete nextRanks[talentKey];
      } else {
        nextRanks[talentKey] = nextRank;
      }

      return nextRanks;
    });
  }

  function clearTalents() {
    setTalentRanks({});
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
        <section className="panel build-panel">
          <BuildTabs
            activeTab={activeBuildTab}
            onTabChange={setActiveBuildTab}
          />

          {activeBuildTab === "gear" && (
            <GearTab
              gear={gear}
              selectedPhase={selectedPhase}
              phaseOptions={phaseOptions}
              onPhaseChange={handlePhaseChange}
              onOpenItemPicker={openItemPicker}
              onOpenEnchantPicker={openEnchantPicker}
              onRemoveEnchant={removeEnchant}
              onOpenGemPicker={openGemPicker}
              onRemoveGem={removeGem}
            />
          )}

          {activeBuildTab === "talents" && (
            <TalentsTab
              talentTrees={talentTrees}
              talentRanks={talentRanks}
              isLoadingTalents={isLoadingTalents}
              talentError={talentError}
              onTalentRankChange={updateTalentRank}
              onClearTalents={clearTalents}
            />
          )}

          {activeBuildTab !== "gear" && activeBuildTab !== "talents" && (
            <div className="placeholder-panel">
              <h2>
                {getBuildTabLabel(activeBuildTab)}
              </h2>
              <p className="muted">This section will be added later.</p>
            </div>
          )}
        </section>

        <section className="panel stats-panel">
          <div className="panel-title-row compact-panel-title">
            <h2>Gear Stat Totals</h2>

            <label className="mini-toggle">
              <input
                type="checkbox"
                checked={includeHolyShield}
                onChange={(event) => setIncludeHolyShield(event.target.checked)}
              />
              <span>Holy Shield</span>
            </label>
          </div>

          <p className="panel-caption">
            Gear totals include equipped items, enchants, active gems, and active socket
            bonuses.
          </p>

          {isCalculatingStats && <p className="muted">Calculating...</p>}

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

          {activeGearSetBonuses.length > 0 && (
            <div className="set-bonus-list">
              <h3 className="set-bonus-title">Active Set Bonuses</h3>

              {activeGearSetBonuses.map((bonus) => (
                <div
                  className="set-bonus-card"
                  key={`${bonus.setId}-${bonus.piecesRequired}`}
                >
                  <div className="set-bonus-heading">
                    <strong>{bonus.setName}</strong>
                    <span>
                      {bonus.piecesRequired}pc active ({bonus.piecesEquipped} equipped)
                    </span>
                  </div>

                  <p>{bonus.description}</p>
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

              {activeFinalSetBonuses.length > 0 && (
                <>
                  <h3 className="subsection-title">Set Bonuses</h3>

                  <div className="set-bonus-list compact-set-bonus-list">
                    {activeFinalSetBonuses.map((bonus) => (
                      <div
                        className="set-bonus-card"
                        key={`${bonus.setId}-${bonus.piecesRequired}`}
                      >
                        <div className="set-bonus-heading">
                          <strong>{bonus.setName}</strong>
                          <span>
                            {bonus.piecesRequired}pc active ({bonus.piecesEquipped} equipped)
                          </span>
                        </div>

                        <p>{bonus.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

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
                          {school.averageDamageReductionPercent}% avg reduction •{" "}
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
      </main>

      {selectedSlot && (
        <ItemPickerModal
          selectedSlot={selectedSlot}
          selectedPhase={selectedPhase}
          selectedPhaseLabel={selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableItems={availableItems}
          isLoadingItems={isLoadingItems}
          error={error}
          searchTerm={itemSearchTerm}
          onSearchTermChange={setItemSearchTerm}
          onPhaseChange={handlePhaseChange}
          onSelectItem={equipItem}
          onClose={closeModal}
        />
      )}

      {selectedEnchantSlot && (
        <EnchantPickerModal
          selectedSlot={selectedEnchantSlot}
          selectedPhase={selectedPhase}
          selectedPhaseLabel={selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableEnchants={availableEnchants}
          isLoadingEnchants={isLoadingEnchants}
          error={enchantError}
          searchTerm={enchantSearchTerm}
          onSearchTermChange={setEnchantSearchTerm}
          onPhaseChange={handlePhaseChange}
          onSelectEnchant={equipEnchant}
          onClose={closeEnchantModal}
        />
      )}

      {selectedGemSlot && selectedGemSocketColor && (
        <GemPickerModal
          selectedSlot={selectedGemSlot}
          selectedSocketColor={selectedGemSocketColor}
          selectedPhase={selectedPhase}
          selectedPhaseLabel={selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableGems={availableGems}
          isLoadingGems={isLoadingGems}
          error={gemError}
          searchTerm={gemSearchTerm}
          includeEpicGems={includeEpicGems}
          onSearchTermChange={setGemSearchTerm}
          onPhaseChange={handlePhaseChange}
          onIncludeEpicGemsChange={handleIncludeEpicGemsChange}
          onSelectGem={equipGem}
          onClose={closeGemModal}
        />
      )}

    </div>
  );
}

export default App;