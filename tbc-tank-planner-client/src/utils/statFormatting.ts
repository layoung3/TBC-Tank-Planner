import type { StatBlock } from "../types";

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
