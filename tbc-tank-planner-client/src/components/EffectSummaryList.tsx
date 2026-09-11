import type { ActiveEffectSummary } from "../types";

interface EffectSummaryListProps {
  title: string;
  effects: ActiveEffectSummary[];
  emptyMessage?: string;
}

function getEffectSubtitle(effect: ActiveEffectSummary): string {
  const titleParts = [effect.treeKey ?? effect.categoryLabel, effect.sourceLabel]
    .filter(Boolean)
    .join(" • ");

  if (effect.rank !== undefined && effect.maxRank !== undefined) {
    const rankText = `Rank ${effect.rank}/${effect.maxRank}`;

    return titleParts ? `${titleParts} • ${rankText}` : rankText;
  }

  return titleParts;
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

      {effects.map((effect) => {
        const subtitle = getEffectSubtitle(effect);

        return (
          <article className="effect-card" key={effect.key}>
            <div className="effect-card-heading">
              <div>
                <strong>{effect.name}</strong>
                {subtitle && <span>{subtitle}</span>}
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
        );
      })}
    </div>
  );
}
