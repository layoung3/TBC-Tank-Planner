import type { ActiveItemSetBonus } from "../types";

interface SetBonusListProps {
  bonuses: ActiveItemSetBonus[];
  title?: string;
  titleClassName?: string;
  compact?: boolean;
}

export function SetBonusList({
  bonuses,
  title,
  titleClassName = "set-bonus-title",
  compact = false,
}: SetBonusListProps) {
  if (bonuses.length === 0) {
    return null;
  }

  return (
    <>
      {title && <h3 className={titleClassName}>{title}</h3>}

      <div className={`set-bonus-list ${compact ? "compact-set-bonus-list" : ""}`}>
        {bonuses.map((bonus) => (
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
  );
}
