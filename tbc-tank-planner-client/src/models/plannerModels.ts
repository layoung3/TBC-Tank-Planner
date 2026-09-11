import type {
  CharacterRace,
  ItemSlot,
  TbcEnchant,
  TbcGem,
  TbcItem,
} from "../types";

export interface EquippedSlot {
  slotKey: string;
  slot: ItemSlot;
  label: string;
  item?: TbcItem;
  enchant?: TbcEnchant;
  gems?: Array<TbcGem | null>;
}

export interface PhaseFilterOption {
  label: string;
  value?: number;
}

export interface RaceOption {
  label: string;
  value: CharacterRace;
}

export type BuildTab =
  | "gear"
  | "talents"
  | "buffs"
  | "encounter"
  | "sim"
  | "optimizer";

export interface BuildTabOption {
  id: BuildTab;
  label: string;
  isDisabled?: boolean;
}
