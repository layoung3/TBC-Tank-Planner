export type ItemSlot =
  | "Head"
  | "Neck"
  | "Shoulders"
  | "Back"
  | "Chest"
  | "Wrist"
  | "Hands"
  | "Waist"
  | "Legs"
  | "Feet"
  | "Ring"
  | "Trinket"
  | "MainHand"
  | "Shield"
  | "Libram";

export type TankClass =
  | "ProtectionPaladin"
  | "FeralDruid"
  | "ProtectionWarrior";

export type SocketColor =
  | "Red"
  | "Yellow"
  | "Blue"
  | "Meta"
  | "Prismatic";

export type CharacterRace =
  | "BloodElf"
  | "Draenei"
  | "Human"
  | "Dwarf";

export interface StatBlock {
  stamina: number;
  strength: number;
  agility: number;
  intellect: number;
  armor: number;
  defenseRating: number;
  dodgeRating: number;
  parryRating: number;
  blockRating: number;
  blockValue: number;
  resilienceRating: number;
  hitRating: number;
  spellHitRating: number;
  expertiseRating: number;
  attackPower: number;
  spellPower: number;
  mp5: number;
}

export interface TbcItem {
  id: number;
  name: string;
  iconUrl?: string | null;
  slot: ItemSlot;
  allowedClasses: TankClass[];
  phase: number;
  source: string;
  quality: string;
  stats: StatBlock;
  sockets: SocketColor[];
  socketBonus: StatBlock;
  isCustom: boolean;
}

export interface GearStatsRequest {
  equippedItemIds: number[];
}

export interface GearStatsResponse {
  gearStats: StatBlock;
  warnings: string[];
}

export interface CharacterBaseStats {
  race: CharacterRace;
  baseHealth: number;
  baseMana: number;
  stats: StatBlock;
}

export interface FinalCharacterStatsRequest {
  race: CharacterRace;
  equippedItemIds: number[];
}

export interface FinalCharacterStatsResponse {
  race: CharacterRace;
  health: number;
  mana: number;
  baseStats: CharacterBaseStats;
  gearStats: StatBlock;
  finalStats: StatBlock;
  warnings: string[];
}
