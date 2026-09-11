import { useEffect, useState } from "react";
import { calculateFinalCharacterStats, calculateGearStats } from "../api";
import type {
  ActiveItemSetBonus,
  CharacterRace,
  CharacterTalentBuild,
  EquippedGearItem,
  FinalCharacterStatsResponse,
  StatBlock,
} from "../types";
import { createEmptyStats } from "../utils/statFormatting";

interface UseTankCalculationsParams {
  equippedGear: EquippedGearItem[];
  selectedTalentBuild: CharacterTalentBuild;
}

export function useTankCalculations({
  equippedGear,
  selectedTalentBuild,
}: UseTankCalculationsParams) {
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

  useEffect(() => {
    let isCurrentRequest = true;

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

        if (!isCurrentRequest) {
          return;
        }

        setGearStatTotals(result.gearStats);
        setCalculationWarnings(result.warnings);
        setActiveGearSetBonuses(result.activeSetBonuses ?? []);
      } catch {
        if (isCurrentRequest) {
          setCalculationWarnings(["Unable to calculate gear stats."]);
        }
      } finally {
        if (isCurrentRequest) {
          setIsCalculatingStats(false);
        }
      }
    }

    void updateGearStats();

    return () => {
      isCurrentRequest = false;
    };
  }, [equippedGear]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function updateFinalCharacterStats() {
      try {
        setIsCalculatingFinalStats(true);
        setFinalStatsError(null);

        const result = await calculateFinalCharacterStats(
          selectedRace,
          equippedGear,
          includeHolyShield,
          selectedTalentBuild
        );

        if (!isCurrentRequest) {
          return;
        }

        setFinalCharacterStats(result);
      } catch {
        if (isCurrentRequest) {
          setFinalStatsError("Unable to calculate final character stats.");
        }
      } finally {
        if (isCurrentRequest) {
          setIsCalculatingFinalStats(false);
        }
      }
    }

    void updateFinalCharacterStats();

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedRace, equippedGear, includeHolyShield, selectedTalentBuild]);

  return {
    gearStatTotals,
    calculationWarnings,
    activeGearSetBonuses,
    isCalculatingStats,

    selectedRace,
    setSelectedRace,
    includeHolyShield,
    setIncludeHolyShield,

    finalCharacterStats,
    isCalculatingFinalStats,
    finalStatsError,
  };
}
