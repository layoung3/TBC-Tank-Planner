import type { StatBlock } from "../types";

export interface StatRow {
  label: string;
  value: number;
}

export function createEmptyStats(): StatBlock {
  return {
    stamina: 0,
    strength: 0,
    agility: 0,
    intellect: 0,
    armor: 0,
    arcaneResistance: 0,
    fireResistance: 0,
    frostResistance: 0,
    natureResistance: 0,
    shadowResistance: 0,
    defenseRating: 0,
    dodgeRating: 0,
    parryRating: 0,
    blockRating: 0,
    blockValue: 0,
    resilienceRating: 0,
    hitRating: 0,
    spellHitRating: 0,
    expertiseRating: 0,
    attackPower: 0,
    spellPower: 0,
    mp5: 0,
  };
}

export function getVisibleStatRows(stats: StatBlock): StatRow[] {
  return [
    { label: "Stamina", value: stats.stamina },
    { label: "Strength", value: stats.strength },
    { label: "Agility", value: stats.agility },
    { label: "Intellect", value: stats.intellect },
    { label: "Armor", value: stats.armor },
    { label: "Arcane Resistance", value: stats.arcaneResistance },
    { label: "Fire Resistance", value: stats.fireResistance },
    { label: "Frost Resistance", value: stats.frostResistance },
    { label: "Nature Resistance", value: stats.natureResistance },
    { label: "Shadow Resistance", value: stats.shadowResistance },
    { label: "Defense Rating", value: stats.defenseRating },
    { label: "Dodge Rating", value: stats.dodgeRating },
    { label: "Parry Rating", value: stats.parryRating },
    { label: "Block Rating", value: stats.blockRating },
    { label: "Block Value", value: stats.blockValue },
    { label: "Resilience Rating", value: stats.resilienceRating },
    { label: "Hit Rating", value: stats.hitRating },
    { label: "Spell Hit Rating", value: stats.spellHitRating },
    { label: "Expertise Rating", value: stats.expertiseRating },
    { label: "Attack Power", value: stats.attackPower },
    { label: "Spell Power", value: stats.spellPower },
    { label: "MP5", value: stats.mp5 },
  ].filter((stat) => stat.value !== 0);
}

export function formatStatSummary(stats: StatBlock): string {
  const statEntries: Array<[string, number]> = [
    ["Stam", stats.stamina],
    ["Str", stats.strength],
    ["Agi", stats.agility],
    ["Int", stats.intellect],
    ["Armor", stats.armor],
    ["Arcane Res", stats.arcaneResistance],
    ["Fire Res", stats.fireResistance],
    ["Frost Res", stats.frostResistance],
    ["Nature Res", stats.natureResistance],
    ["Shadow Res", stats.shadowResistance],
    ["Def", stats.defenseRating],
    ["Dodge", stats.dodgeRating],
    ["Parry", stats.parryRating],
    ["Block", stats.blockRating],
    ["Block Value", stats.blockValue],
    ["Resil", stats.resilienceRating],
    ["Hit", stats.hitRating],
    ["Spell Hit", stats.spellHitRating],
    ["Expertise", stats.expertiseRating],
    ["AP", stats.attackPower],
    ["SP", stats.spellPower],
    ["MP5", stats.mp5],
  ];

  return statEntries
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `+${value} ${label}`)
    .join(", ");
}
