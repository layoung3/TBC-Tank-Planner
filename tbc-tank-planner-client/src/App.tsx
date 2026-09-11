import { useState } from "react";
import { BuildTabs } from "./components/BuildTabs";
import { ItemPickerModal } from "./components/ItemPickerModal";
import { EnchantPickerModal } from "./components/EnchantPickerModal";
import { GemPickerModal } from "./components/GemPickerModal";
import { GearStatsPanel } from "./components/GearStatsPanel";
import { FinalStatsPanel } from "./components/FinalStatsPanel";
import { GearTab } from "./components/GearTab";
import { TalentsTab } from "./components/TalentsTab";
import { BuffsTab } from "./components/BuffsTab";
import { getBuildTabLabel, phaseOptions } from "./config/plannerOptions";
import { useGearPlannerState } from "./hooks/useGearPlannerState";
import { useTalentPlannerState } from "./hooks/useTalentPlannerState";
import { useBuffPlannerState } from "./hooks/useBuffPlannerState";
import { useTankCalculations } from "./hooks/useTankCalculations";
import type { BuildTab } from "./models/plannerModels";
import "./App.css";

function App() {
  const gearPlanner = useGearPlannerState();
  const talentPlanner = useTalentPlannerState();
  const buffPlanner = useBuffPlannerState();
  const tankCalculations = useTankCalculations({
    equippedGear: gearPlanner.equippedGear,
    selectedTalentBuild: talentPlanner.selectedTalentBuild,
    buffSelection: buffPlanner.buffSelection,
  });

  const [activeBuildTab, setActiveBuildTab] = useState<BuildTab>("gear");

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

          {activeBuildTab === "buffs" && (
            <BuffsTab
              buffs={buffPlanner.buffs}
              activeBuffSelections={buffPlanner.activeBuffSelections}
              activeBuffEffects={buffPlanner.activeBuffEffects}
              onBuffActiveChange={buffPlanner.setBuffActive}
              onBuffVariantChange={buffPlanner.setBuffVariant}
              onClearBuffs={buffPlanner.clearBuffs}
            />
          )}

          {activeBuildTab !== "gear" &&
            activeBuildTab !== "talents" &&
            activeBuildTab !== "buffs" && (
            <div className="placeholder-panel">
              <h2>{getBuildTabLabel(activeBuildTab)}</h2>
              <p className="muted">This section will be added later.</p>
            </div>
          )}
        </section>

        <GearStatsPanel
          gearStats={tankCalculations.gearStatTotals}
          activeSetBonuses={tankCalculations.activeGearSetBonuses}
          warnings={tankCalculations.calculationWarnings}
          isCalculating={tankCalculations.isCalculatingStats}
          includeHolyShield={tankCalculations.includeHolyShield}
          onIncludeHolyShieldChange={tankCalculations.setIncludeHolyShield}
        />

        <FinalStatsPanel
          selectedRace={tankCalculations.selectedRace}
          finalCharacterStats={tankCalculations.finalCharacterStats}
          isCalculating={tankCalculations.isCalculatingFinalStats}
          error={tankCalculations.finalStatsError}
          onRaceChange={tankCalculations.setSelectedRace}
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
