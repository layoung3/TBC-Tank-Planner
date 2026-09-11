import type { TalentDefinition, TalentTreeDefinition } from "../types";

interface TalentsTabProps {
  talentTrees: TalentTreeDefinition[];
  talentRanks: Record<string, number>;
  isLoadingTalents: boolean;
  talentError: string | null;
  onTalentRankChange: (talentKey: string, nextRank: number) => void;
  onClearTalents: () => void;
}

export function TalentsTab({
  talentTrees,
  talentRanks,
  isLoadingTalents,
  talentError,
  onTalentRankChange,
  onClearTalents,
}: TalentsTabProps) {
  function getTalentRank(talent: TalentDefinition): number {
    return talentRanks[talent.key] ?? 0;
  }

  function setTalentRank(talent: TalentDefinition, nextRank: number) {
    const clampedRank = Math.max(0, Math.min(nextRank, talent.maxRank));
    onTalentRankChange(talent.key, clampedRank);
  }

  function addTalentRank(talent: TalentDefinition) {
    setTalentRank(talent, getTalentRank(talent) + 1);
  }

  function removeTalentRank(talent: TalentDefinition) {
    setTalentRank(talent, getTalentRank(talent) - 1);
  }

  function getTalentTooltip(talent: TalentDefinition): string {
    const rank = getTalentRank(talent);

    const currentRankDescription =
      rank > 0
        ? talent.rankEffects.find((rankEffect) => rankEffect.rank === rank)
            ?.description
        : undefined;

    const nextRankDescription =
      rank < talent.maxRank
        ? talent.rankEffects.find((rankEffect) => rankEffect.rank === rank + 1)
            ?.description
        : undefined;

    return [
      talent.name,
      `Rank ${rank}/${talent.maxRank}`,
      currentRankDescription
        ? `Current: ${currentRankDescription}`
        : talent.description,
      nextRankDescription ? `Next: ${nextRankDescription}` : undefined,
      "Left click to add. Right click to remove.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="talent-tab-content">
      <div className="talent-toolbar">
        <div>
          <h2>Talents</h2>
          <p className="panel-caption">
            Left click to add a point. Right click to remove a point.
          </p>
        </div>

        <button className="secondary-button" onClick={onClearTalents}>
          Clear Talents
        </button>
      </div>

      {isLoadingTalents && <p className="muted">Loading talents...</p>}

      {talentError && <p className="error">{talentError}</p>}

      {!isLoadingTalents && !talentError && talentTrees.length === 0 && (
        <p className="muted">No talents found.</p>
      )}

      <div className="wow-talent-tree-list">
        {talentTrees.map((tree) => (
          <div className="wow-talent-tree" key={tree.treeKey}>
            <h3>{tree.name}</h3>

            <div className="wow-talent-grid">
              {tree.talents.map((talent) => {
                const rank = getTalentRank(talent);

                return (
                  <button
                    key={talent.key}
                    className={`wow-talent-icon ${
                      rank > 0 ? "wow-talent-icon-active" : ""
                    }`}
                    style={{
                      gridRow: talent.row,
                      gridColumn: talent.column,
                    }}
                    title={getTalentTooltip(talent)}
                    onClick={() => addTalentRank(talent)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      removeTalentRank(talent);
                    }}
                  >
                    {talent.iconUrl ? (
                      <img src={talent.iconUrl} alt={talent.name} />
                    ) : (
                      <span className="wow-talent-placeholder">
                        {talent.name.slice(0, 2)}
                      </span>
                    )}

                    <span className="wow-talent-rank">
                      {rank}/{talent.maxRank}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
