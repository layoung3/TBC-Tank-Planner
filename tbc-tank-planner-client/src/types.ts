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
  | "Prismatic"
  | "Orange"
  | "Green"
  | "Purple";

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
  arcaneResistance: number;
  fireResistance: number;
  frostResistance: number;
  natureResistance: number;
  shadowResistance: number;
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

export interface EquippedGearItem {
  slotKey: string;
  slot: ItemSlot;
  itemId: number | null;
  enchantId: number | null;
  gemIds: Array<number | null>;
}

export interface ActiveItemSetBonus {
  setId: number;
  setName: string;
  piecesEquipped: number;
  piecesRequired: number;
  description: string;
  stats: StatBlock;
  effectKeys: string[];
}

export interface TalentRankEffect {
  rank: number;
  description: string;
}

export interface TalentDefinition {
  key: string;
  name: string;
  iconUrl?: string | null;
  treeKey: string;
  row: number;
  column: number;
  maxRank: number;
  description: string;
  effectKeys: string[];
  rankEffects: TalentRankEffect[];
}

export interface TalentTreeDefinition {
  class: TankClass;
  treeKey: string;
  name: string;
  talents: TalentDefinition[];
}

export interface CharacterTalentBuild {
  class: TankClass;
  talentRanks: Record<string, number>;
}

export interface ActiveTalentEffect {
  key: string;
  name: string;
  treeKey: string;
  rank: number;
  maxRank: number;
  description: string;
  effectKeys: string[];
  appliesTo: string[];
}

export interface TbcEnchant {
  id: number;
  name: string;
  allowedSlots: ItemSlot[];
  phase: number;
  source: string;
  stats: StatBlock;
  isCustom: boolean;
}

export interface TbcGem {
  id: number;
  name: string;
  iconUrl?: string | null;
  color: SocketColor;
  matchesSocketColors: SocketColor[];
  phase: number;
  quality: string;
  source: string;
  stats: StatBlock;
  effectDescription?: string | null;
  metaRequirementDescription?: string | null;
  metaRequirements?: GemColorRequirement[];
  isCustom: boolean;
}

export interface GemColorRequirement {
  color: SocketColor;
  count: number;
}

export interface GearStatsRequest {
  equippedGear: EquippedGearItem[];
}

export interface GearStatsResponse {
  activeSetBonuses: ActiveItemSetBonus[];
  gearStats: StatBlock;
  warnings: string[];
}

export interface CharacterBaseStats {
  race: CharacterRace;
  baseHealth: number;
  baseMana: number;
  stats: StatBlock;
}

export interface PhysicalMitigationStats {
  attackerLevel: number;
  armor: number;
  armorDamageReductionPercent: number;
  damageTakenMultiplier: number;
  physicalEffectiveHealth: number;
  armorCap: number;
  armorNeededForCap: number;
}

export interface ResistanceMitigationStats {
  school: string;
  resistance: number;
  resistanceCap: number;
  resistanceNeededForCap: number;
  averageDamageReductionPercent: number;
  damageTakenMultiplier: number;
  magicEffectiveHealth: number;
}

export interface MagicMitigationStats {
  attackerLevel: number;
  schools: ResistanceMitigationStats[];
}

export interface FinalCharacterStatsRequest {
  race: CharacterRace;
  equippedGear: EquippedGearItem[];
  talentBuild: CharacterTalentBuild;
  includeHolyShield: boolean;
}

export interface FinalCharacterStatsResponse {
  race: CharacterRace;
  health: number;
  mana: number;
  activeSetBonuses: ActiveItemSetBonus[];
  activeTalentEffects: ActiveTalentEffect[];
  talentWarnings: string[];
  baseStats: CharacterBaseStats;
  gearStats: StatBlock;
  finalStats: StatBlock;
  derivedTankStats: DerivedTankStats;
  physicalMitigationStats: PhysicalMitigationStats;
  magicMitigationStats: MagicMitigationStats;
  warnings: string[];
}

export interface DerivedTankStats {
  defenseSkill: number;

  critReductionTargetPercent: number;
  critReductionFromDefensePercent: number;
  critReductionFromResiliencePercent: number;
  critReductionFromTalentsPercent: number;
  totalCritReductionPercent: number;
  critReductionNeededPercent: number;
  isCritImmune: boolean;

  missPercent: number;
  dodgePercent: number;
  parryPercent: number;
  blockPercent: number;

  isHolyShieldIncluded: boolean;
  holyShieldBlockChancePercent: number;

  avoidanceWithBlockPercent: number;
  crushAvoidanceTargetPercent: number;
  crushAvoidanceNeededPercent: number;
  isUncrushable: boolean;
}
