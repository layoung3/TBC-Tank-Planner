import { useEffect, useState } from "react";
import { calculateFinalCharacterStats, calculateGearStats } from "./api";
import { BuildTabs } from "./components/BuildTabs";
import { ItemPickerModal } from "./components/ItemPickerModal";
import { EnchantPickerModal } from "./components/EnchantPickerModal";
import { GemPickerModal } from "./components/GemPickerModal";
import { GearStatsPanel } from "./components/GearStatsPanel";
import { FinalStatsPanel } from "./components/FinalStatsPanel";
import { GearTab } from "./components/GearTab";
import { TalentsTab } from "./components/TalentsTab";
import { getBuildTabLabel, phaseOptions } from "./config/plannerOptions";
import { useGearPlannerState } from "./hooks/useGearPlannerState";
import { useTalentPlannerState } from "./hooks/useTalentPlannerState";
import type { BuildTab } from "./models/plannerModels";
import type {
  CharacterRace,
  ActiveItemSetBonus,
  FinalCharacterStatsResponse,
  StatBlock,
} from "./types";
import { createEmptyStats } from "./utils/statFormatting";
import "./App.css";

function App() {
  const gearPlanner = useGearPlannerState();
  const talentPlanner = useTalentPlannerState();

  const [gearStatTotals, setGearStatTotals] = useState<StatBlock>(
    createEmptyStats()
  );
  const [calculationWarnings, setCalculationWarnings] = useState<string[]>([]);
  const [activeGearSetBonuses, setActiveGearSetBonuses] = useState<
    ActiveItemSetBonus[]
  >([]);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);
  const [selectedRace, setSelectedRace] = useState<CharacterRace>("BloodElf");
  const [includeHolyShield, setIncludeHolyShield] = useState(true);

  const [finalCharacterStats, setFinalCharacterStats] =
    useState<FinalCharacterStatsResponse | null>(null);

  const [isCalculatingFinalStats, setIsCalculatingFinalStats] = useState(false);
  const [finalStatsError, setFinalStatsError] = useState<string | null>(null);

  const [activeBuildTab, setActiveBuildTab] = useState<BuildTab>("gear");

  useEffect(() => {
    async function updateGearStats() {
      if (gearPlanner.equippedGear.length === 0) {
        setGearStatTotals(createEmptyStats());
        setCalculationWarnings([]);
        setActiveGearSetBonuses([]);
        return;
      }

      try {
        setIsCalculatingStats(true);

        const result = await calculateGearStats(gearPlanner.equippedGear);

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
  }, [gearPlanner.equippedGear]);

  useEffect(() => {
    async function updateFinalCharacterStats() {
      try {
        setIsCalculatingFinalStats(true);
        setFinalStatsError(null);

        const result = await calculateFinalCharacterStats(
          selectedRace,
          gearPlanner.equippedGear,
          includeHolyShield,
          talentPlanner.selectedTalentBuild
        );

        setFinalCharacterStats(result);
      } catch {
        setFinalStatsError("Unable to calculate final character stats.");
      } finally {
        setIsCalculatingFinalStats(false);
      }
    }

    void updateFinalCharacterStats();
  }, [
    selectedRace,
    gearPlanner.equippedGear,
    includeHolyShield,
    talentPlanner.selectedTalentBuild,
  ]);

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
              gear={gearPlanner.gear}
              selectedPhase={gearPlanner.selectedPhase}
              phaseOptions={phaseOptions}
              onPhaseChange={gearPlanner.handlePhaseChange}
              onOpenItemPicker={gearPlanner.openItemPicker}
              onUnequipItem={gearPlanner.unequipItem}
              onOpenEnchantPicker={gearPlanner.openEnchantPicker}
              onRemoveEnchant={gearPlanner.removeEnchant}
              onOpenGemPicker={gearPlanner.openGemPicker}
              onRemoveGem={gearPlanner.removeGem}
            />
          )}

          {activeBuildTab === "talents" && (
            <TalentsTab
              talentTrees={talentPlanner.talentTrees}
              talentRanks={talentPlanner.talentRanks}
              isLoadingTalents={talentPlanner.isLoadingTalents}
              talentError={talentPlanner.talentError}
              onTalentRankChange={talentPlanner.updateTalentRank}
              onClearTalents={talentPlanner.clearTalents}
            />
          )}

          {activeBuildTab !== "gear" && activeBuildTab !== "talents" && (
            <div className="placeholder-panel">
              <h2>{getBuildTabLabel(activeBuildTab)}</h2>
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

      {gearPlanner.selectedSlot && (
        <ItemPickerModal
          selectedSlot={gearPlanner.selectedSlot}
          selectedPhase={gearPlanner.selectedPhase}
          selectedPhaseLabel={gearPlanner.selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableItems={gearPlanner.availableItems}
          isLoadingItems={gearPlanner.isLoadingItems}
          error={gearPlanner.itemError}
          searchTerm={gearPlanner.itemSearchTerm}
          onSearchTermChange={gearPlanner.setItemSearchTerm}
          onPhaseChange={gearPlanner.handlePhaseChange}
          onSelectItem={gearPlanner.equipItem}
          onClose={gearPlanner.closeItemModal}
        />
      )}

      {gearPlanner.selectedEnchantSlot && (
        <EnchantPickerModal
          selectedSlot={gearPlanner.selectedEnchantSlot}
          selectedPhase={gearPlanner.selectedPhase}
          selectedPhaseLabel={gearPlanner.selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableEnchants={gearPlanner.availableEnchants}
          isLoadingEnchants={gearPlanner.isLoadingEnchants}
          error={gearPlanner.enchantError}
          searchTerm={gearPlanner.enchantSearchTerm}
          onSearchTermChange={gearPlanner.setEnchantSearchTerm}
          onPhaseChange={gearPlanner.handlePhaseChange}
          onSelectEnchant={gearPlanner.equipEnchant}
          onClose={gearPlanner.closeEnchantModal}
        />
      )}

      {gearPlanner.selectedGemSlot && gearPlanner.selectedGemSocketColor && (
        <GemPickerModal
          selectedSlot={gearPlanner.selectedGemSlot}
          selectedSocketColor={gearPlanner.selectedGemSocketColor}
          selectedPhase={gearPlanner.selectedPhase}
          selectedPhaseLabel={gearPlanner.selectedPhaseLabel}
          phaseOptions={phaseOptions}
          availableGems={gearPlanner.availableGems}
          isLoadingGems={gearPlanner.isLoadingGems}
          error={gearPlanner.gemError}
          searchTerm={gearPlanner.gemSearchTerm}
          includeEpicGems={gearPlanner.includeEpicGems}
          onSearchTermChange={gearPlanner.setGemSearchTerm}
          onPhaseChange={gearPlanner.handlePhaseChange}
          onIncludeEpicGemsChange={gearPlanner.handleIncludeEpicGemsChange}
          onSelectGem={gearPlanner.equipGem}
          onClose={gearPlanner.closeGemModal}
        />
      )}
    </div>
  );
}

export default App;
