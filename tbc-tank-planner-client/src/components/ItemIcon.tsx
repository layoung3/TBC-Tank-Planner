import type { TbcItem } from "../types";

interface ItemIconProps {
  item?: TbcItem;
}

export function ItemIcon({ item }: ItemIconProps) {
  if (item?.iconUrl) {
    return (
      <img
        className="item-icon"
        src={item.iconUrl}
        alt={`${item.name} icon`}
      />
    );
  }

  return <div className="item-icon item-icon-placeholder">?</div>;
}
