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
import { ItemPickerModal } from "./components/ItemPickerModal";
import { EnchantPickerModal } from "./components/EnchantPickerModal";
import { GemPickerModal } from "./components/GemPickerModal";
import { GearStatsPanel } from "./components/GearStatsPanel";
import { FinalStatsPanel } from "./components/FinalStatsPanel";
import { GearTab } from "./components/GearTab";
import { TalentsTab } from "./components/TalentsTab";
import {
  getBuildTabLabel,
  initialGear,
  phaseOptions,
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

        <GearStatsPanel
          gearStats={gearStatTotals}
          activeSetBonuses={activeGearSetBonuses}
          warnings={calculationWarnings}
          isCalculating={isCalculatingStats}
          includeHolyShield={includeHolyShield}
          onIncludeHolyShieldChange={setIncludeHolyShield}
        />

        <FinalStatsPanel
          selectedRace={selectedRace}
          finalCharacterStats={finalCharacterStats}
          isCalculating={isCalculatingFinalStats}
          error={finalStatsError}
          onRaceChange={setSelectedRace}
        />
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