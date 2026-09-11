import { useEffect, useMemo, useState } from "react";
import { getTalents } from "../api";
import type { CharacterTalentBuild, TalentTreeDefinition } from "../types";

export function useTalentPlannerState() {
  const [talentTrees, setTalentTrees] = useState<TalentTreeDefinition[]>([]);
  const [talentRanks, setTalentRanks] = useState<Record<string, number>>({});
  const [isLoadingTalents, setIsLoadingTalents] = useState(false);
  const [talentError, setTalentError] = useState<string | null>(null);

  const selectedTalentBuild = useMemo<CharacterTalentBuild>(
    () => ({
      class: "ProtectionPaladin",
      talentRanks,
    }),
    [talentRanks]
  );

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

  return {
    talentTrees,
    talentRanks,
    selectedTalentBuild,
    isLoadingTalents,
    talentError,
    updateTalentRank,
    clearTalents,
  };
}
