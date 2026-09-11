import type {
  BuildTab,
  BuildTabOption,
  EquippedSlot,
  PhaseFilterOption,
  RaceOption,
} from "../models/plannerModels";

export const phaseOptions: PhaseFilterOption[] = [
  { label: "All TBC", value: undefined },
  { label: "Pre-Raid / Phase 0", value: 0 },
  { label: "Through Phase 1", value: 1 },
  { label: "Through Phase 2", value: 2 },
  { label: "Through Phase 3", value: 3 },
  { label: "Through Phase 4", value: 4 },
  { label: "Through Phase 5", value: 5 },
];

export const raceOptions: RaceOption[] = [
  { label: "Blood Elf", value: "BloodElf" },
  { label: "Draenei", value: "Draenei" },
  { label: "Human", value: "Human" },
  { label: "Dwarf", value: "Dwarf" },
];

export const buildTabOptions: BuildTabOption[] = [
  { id: "gear", label: "Gear" },
  { id: "talents", label: "Talents" },
  { id: "buffs", label: "Buffs", isDisabled: true },
  { id: "encounter", label: "Encounter", isDisabled: true },
  { id: "sim", label: "Sim", isDisabled: true },
  { id: "optimizer", label: "Optimizer", isDisabled: true },
];

export const initialGear: EquippedSlot[] = [
  { slotKey: "Head", slot: "Head", label: "Head" },
  { slotKey: "Neck", slot: "Neck", label: "Neck" },
  { slotKey: "Shoulders", slot: "Shoulders", label: "Shoulders" },
  { slotKey: "Back", slot: "Back", label: "Back" },
  { slotKey: "Chest", slot: "Chest", label: "Chest" },
  { slotKey: "Wrist", slot: "Wrist", label: "Wrist" },
  { slotKey: "Hands", slot: "Hands", label: "Hands" },
  { slotKey: "Waist", slot: "Waist", label: "Waist" },
  { slotKey: "Legs", slot: "Legs", label: "Legs" },
  { slotKey: "Feet", slot: "Feet", label: "Feet" },
  { slotKey: "Ring1", slot: "Ring", label: "Ring 1" },
  { slotKey: "Ring2", slot: "Ring", label: "Ring 2" },
  { slotKey: "Trinket1", slot: "Trinket", label: "Trinket 1" },
  { slotKey: "Trinket2", slot: "Trinket", label: "Trinket 2" },
  { slotKey: "MainHand", slot: "MainHand", label: "Main Hand" },
  { slotKey: "Shield", slot: "Shield", label: "Shield" },
  { slotKey: "Libram", slot: "Libram", label: "Libram" },
];

export function getBuildTabLabel(tabId: BuildTab): string {
  return buildTabOptions.find((tab) => tab.id === tabId)?.label ?? tabId;
}
