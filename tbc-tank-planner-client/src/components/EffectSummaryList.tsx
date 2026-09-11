import type { ActiveTalentEffect } from "../types";

interface EffectSummaryListProps {
  title: string;
  effects: ActiveTalentEffect[];
  emptyMessage?: string;
}

export function EffectSummaryList({
  title,
  effects,
  emptyMessage,
}: EffectSummaryListProps) {
  if (effects.length === 0) {
    return emptyMessage ? <p className="muted">{emptyMessage}</p> : null;
  }

  return (
    <div className="effect-list">
      <h3 className="section-title">{title}</h3>

      {effects.map((effect) => (
        <article className="effect-card" key={effect.key}>
          <div className="effect-card-heading">
            <div>
              <strong>{effect.name}</strong>
              <span>
                {effect.treeKey} • Rank {effect.rank}/{effect.maxRank}
              </span>
            </div>

            <div className="tag-list">
              {effect.appliesTo.map((scope) => (
                <span className="tag" key={`${effect.key}-${scope}`}>
                  {scope}
                </span>
              ))}
            </div>
          </div>

          <p>{effect.description}</p>
        </article>
      ))}
    </div>
  );
}
