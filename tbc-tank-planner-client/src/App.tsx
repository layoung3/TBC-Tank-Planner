import { useEffect, useMemo, useState } from "react";
import {
  calculateFinalCharacterStats,
  calculateGearStats,
  getEnchants,
  getGems,
  getItems,
} from "./api";
import type {
  CharacterRace,
  EquippedGearItem,
  ActiveItemSetBonus,
  FinalCharacterStatsResponse,
  ItemSlot,
  SocketColor,
  StatBlock,
  TbcEnchant,
  TbcGem,
  TbcItem,
} from "./types";
import "./App.css";

interface EquippedSlot {
  slotKey: string;
  slot: ItemSlot;
  label: string;
  item?: TbcItem;
  enchant?: TbcEnchant;
  gems?: Array<TbcGem | null>;
}

interface PhaseFilterOption {
  label: string;
  value?: number;
}

const phaseOptions: PhaseFilterOption[] = [
  { label: "All TBC", value: undefined },
  { label: "Pre-Raid / Phase 0", value: 0 },
  { label: "Through Phase 1", value: 1 },
  { label: "Through Phase 2", value: 2 },
  { label: "Through Phase 3", value: 3 },
  { label: "Through Phase 4", value: 4 },
  { label: "Through Phase 5", value: 5 },
];

interface RaceOption {
  label: string;
  value: CharacterRace;
}

const raceOptions: RaceOption[] = [
  { label: "Blood Elf", value: "BloodElf" },
  { label: "Draenei", value: "Draenei" },
  { label: "Human", value: "Human" },
  { label: "Dwarf", value: "Dwarf" },
];

const initialGear: EquippedSlot[] = [
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

function createEmptyStats(): StatBlock {
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

function ItemIcon({ item }: { item?: TbcItem }) {
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

function formatStatSummary(stats: StatBlock): string {
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

function doesGemMatchSocket(
  gem: TbcGem | null | undefined,
  socketColor: SocketColor
): boolean {
  if (!gem) {
    return false;
  }

  if (socketColor === "Meta") {
    return gem.color === "Meta";
  }

  return gem.matchesSocketColors.includes(socketColor);
}

function isSocketBonusActive(
  item: TbcItem,
  gems?: Array<TbcGem | null>
): boolean {
  if (item.sockets.length === 0) {
    return false;
  }

  if (!gems || gems.length < item.sockets.length) {
    return false;
  }

  return item.sockets.every((socketColor, index) =>
    doesGemMatchSocket(gems[index], socketColor)
  );
}

function canGemFitSocket(
  gem: TbcGem,
  socketColor: SocketColor
): boolean {
  if (socketColor === "Meta") {
    return gem.color === "Meta";
  }

  return gem.color !== "Meta";
}

function getValidRegularGemsForMetaRequirements(
  gear: EquippedSlot[]
): TbcGem[] {
  const validRegularGems: TbcGem[] = [];

  gear.forEach((gearSlot) => {
    if (!gearSlot.item || !gearSlot.gems) {
      return;
    }

    const socketCountToCheck = Math.min(
      gearSlot.item.sockets.length,
      gearSlot.gems.length
    );

    for (let index = 0; index < socketCountToCheck; index += 1) {
      const gem = gearSlot.gems[index];
      const socketColor = gearSlot.item.sockets[index];

      if (!gem || gem.color === "Meta") {
        continue;
      }

      if (!canGemFitSocket(gem, socketColor)) {
        continue;
      }

      validRegularGems.push(gem);
    }
  });

  return validRegularGems;
}

function getMetaRequirementProgress(metaGem: TbcGem, gear: EquippedSlot[]) {
  const requirements = metaGem.metaRequirements ?? [];
  const validRegularGems = getValidRegularGemsForMetaRequirements(gear);

  return requirements.map((requirement) => {
    const currentCount = validRegularGems.filter((gem) =>
      gem.matchesSocketColors.includes(requirement.color)
    ).length;

    return {
      color: requirement.color,
      requiredCount: requirement.count,
      currentCount,
      isMet: currentCount >= requirement.count,
    };
  });
}

function isMetaGemActive(metaGem: TbcGem, gear: EquippedSlot[]): boolean {
  if (metaGem.color !== "Meta") {
    return true;
  }

  const progress = getMetaRequirementProgress(metaGem, gear);

  if (progress.length === 0) {
    return true;
  }

  return progress.every((requirement) => requirement.isMet);
}

function formatMetaRequirementProgress(
  metaGem: TbcGem,
  gear: EquippedSlot[]
): string {
  const progress = getMetaRequirementProgress(metaGem, gear);

  if (progress.length === 0) {
    return metaGem.metaRequirementDescription ?? "No requirement listed";
  }

  return progress
    .map(
      (requirement) =>
        `${requirement.currentCount}/${requirement.requiredCount} ${requirement.color}`
    )
    .join(", ");
}

function getSocketDisplayIndexes(sockets: SocketColor[]): number[] {
  return sockets
    .map((_, index) => index)
    .sort((leftIndex, rightIndex) => {
      const leftSocket = sockets[leftIndex];
      const rightSocket = sockets[rightIndex];

      if (leftSocket === "Meta" && rightSocket !== "Meta") {
        return -1;
      }

      if (leftSocket !== "Meta" && rightSocket === "Meta") {
        return 1;
      }

      return leftIndex - rightIndex;
    });
}

function App() {
  const [gear, setGear] = useState<EquippedSlot[]>(initialGear);
  const [selectedPhase, setSelectedPhase] = useState<number | undefined>(undefined);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [availableItems, setAvailableItems] = useState<TbcItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [gearStatTotals, setGearStatTotals] = useState<StatBlock>(
    createEmptyStats()
  );
  const [calculationWarnings, setCalculationWarnings] = useState<string[]>([]);
  const [activeGearSetBonuses, setActiveGearSetBonuses] = useState<ActiveItemSetBonus[]>([]);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);
  const [selectedRace, setSelectedRace] = useState<CharacterRace>("BloodElf");
  const [includeHolyShield, setIncludeHolyShield] = useState(true);

  const [finalCharacterStats, setFinalCharacterStats] =
    useState<FinalCharacterStatsResponse | null>(null);

  const [isCalculatingFinalStats, setIsCalculatingFinalStats] = useState(false);
  const [finalStatsError, setFinalStatsError] = useState<string | null>(null);

  const [selectedEnchantSlotIndex, setSelectedEnchantSlotIndex] = useState<number | null>(null);
  const [availableEnchants, setAvailableEnchants] = useState<TbcEnchant[]>([]);
  const [isLoadingEnchants, setIsLoadingEnchants] = useState(false);
  const [enchantError, setEnchantError] = useState<string | null>(null);
  const [enchantSearchTerm, setEnchantSearchTerm] = useState("");

  const [selectedGemSlotIndex, setSelectedGemSlotIndex] = useState<number | null>(
    null
  );
  const [selectedGemSocketIndex, setSelectedGemSocketIndex] = useState<
    number | null
  >(null);
  const [availableGems, setAvailableGems] = useState<TbcGem[]>([]);
  const [isLoadingGems, setIsLoadingGems] = useState(false);
  const [gemError, setGemError] = useState<string | null>(null);
  const [gemSearchTerm, setGemSearchTerm] = useState("");
  const [includeEpicGems, setIncludeEpicGems] = useState(true);
  

  const selectedSlot =
    selectedSlotIndex !== null ? gear[selectedSlotIndex] : undefined;

  const activeFinalSetBonuses = finalCharacterStats?.activeSetBonuses ?? [];

  const selectedEnchantSlot =
    selectedEnchantSlotIndex !== null ? gear[selectedEnchantSlotIndex] : undefined;

  const selectedGemSlot =
    selectedGemSlotIndex !== null ? gear[selectedGemSlotIndex] : undefined;

  const selectedGemSocketColor: SocketColor | undefined =
    selectedGemSlot &&
    selectedGemSocketIndex !== null &&
    selectedGemSlot.item?.sockets[selectedGemSocketIndex]
      ? selectedGemSlot.item.sockets[selectedGemSocketIndex]
      : undefined;

  const equippedGear = useMemo<EquippedGearItem[]>(
    () =>
      gear
        .filter((gearSlot) => gearSlot.item)
        .map((gearSlot) => ({
          slotKey: gearSlot.slotKey,
          slot: gearSlot.slot,
          itemId: gearSlot.item?.id ?? null,
          enchantId: gearSlot.enchant?.id ?? null,
          gemIds: gearSlot.gems?.map((gem) => gem?.id ?? null) ?? [],
        })),
    [gear]
  );

  useEffect(() => {
    async function updateGearStats() {
      if (equippedGear.length === 0) {
        setGearStatTotals(createEmptyStats());
        setCalculationWarnings([]);
        setActiveGearSetBonuses([]);
        return;
      }

      try {
        setIsCalculatingStats(true);

        const result = await calculateGearStats(equippedGear);

        setGearStatTotals(result.gearStats);
        setCalculationWarnings(result.warnings);
        setActiveGearSetBonuses(result.activeSetBonuses ?? []);
      } catch {
        setCalculationWarnings(["Unable to calculate gear stats."]);
      } finally {
        setIsCalculatingStats(false);
      }
    }

    void updateGearStats();
  }, [equippedGear]);

  useEffect(() => {
    async function updateFinalCharacterStats() {
      try {
        setIsCalculatingFinalStats(true);
        setFinalStatsError(null);

        const result = await calculateFinalCharacterStats(
          selectedRace,
          equippedGear,
          includeHolyShield
        );

        setFinalCharacterStats(result);
      } catch {
        setFinalStatsError("Unable to calculate final character stats.");
      } finally {
        setIsCalculatingFinalStats(false);
      }
    }

    void updateFinalCharacterStats();
  }, [selectedRace, equippedGear, includeHolyShield]);

  const visibleStatRows = [
    { label: "Stamina", value: gearStatTotals.stamina },
    { label: "Strength", value: gearStatTotals.strength },
    { label: "Agility", value: gearStatTotals.agility },
    { label: "Intellect", value: gearStatTotals.intellect },
    { label: "Armor", value: gearStatTotals.armor },
    { label: "Arcane Resistance", value: gearStatTotals.arcaneResistance },
    { label: "Fire Resistance", value: gearStatTotals.fireResistance },
    { label: "Frost Resistance", value: gearStatTotals.frostResistance },
    { label: "Nature Resistance", value: gearStatTotals.natureResistance },
    { label: "Shadow Resistance", value: gearStatTotals.shadowResistance },
    { label: "Defense Rating", value: gearStatTotals.defenseRating },
    { label: "Dodge Rating", value: gearStatTotals.dodgeRating },
    { label: "Parry Rating", value: gearStatTotals.parryRating },
    { label: "Block Rating", value: gearStatTotals.blockRating },
    { label: "Block Value", value: gearStatTotals.blockValue },
    { label: "Resilience Rating", value: gearStatTotals.resilienceRating },
    { label: "Hit Rating", value: gearStatTotals.hitRating },
    { label: "Spell Hit Rating", value: gearStatTotals.spellHitRating },
    { label: "Expertise Rating", value: gearStatTotals.expertiseRating },
    { label: "Attack Power", value: gearStatTotals.attackPower },
    { label: "Spell Power", value: gearStatTotals.spellPower },
    { label: "MP5", value: gearStatTotals.mp5 },
  ].filter((stat) => stat.value !== 0);

  const visibleFinalStatRows = finalCharacterStats
  ? [
      { label: "Stamina", value: finalCharacterStats.finalStats.stamina },
      { label: "Strength", value: finalCharacterStats.finalStats.strength },
      { label: "Agility", value: finalCharacterStats.finalStats.agility },
      { label: "Intellect", value: finalCharacterStats.finalStats.intellect },
      { label: "Armor", value: finalCharacterStats.finalStats.armor },
      {
        label: "Arcane Resistance",
        value: finalCharacterStats.finalStats.arcaneResistance,
      },
      {
        label: "Fire Resistance",
        value: finalCharacterStats.finalStats.fireResistance,
      },
      {
        label: "Frost Resistance",
        value: finalCharacterStats.finalStats.frostResistance,
      },
      {
        label: "Nature Resistance",
        value: finalCharacterStats.finalStats.natureResistance,
      },
      {
        label: "Shadow Resistance",
        value: finalCharacterStats.finalStats.shadowResistance,
      },
      {
        label: "Defense Rating",
        value: finalCharacterStats.finalStats.defenseRating,
      },
      {
        label: "Dodge Rating",
        value: finalCharacterStats.finalStats.dodgeRating,
      },
      {
        label: "Parry Rating",
        value: finalCharacterStats.finalStats.parryRating,
      },
      {
        label: "Block Rating",
        value: finalCharacterStats.finalStats.blockRating,
      },
      {
        label: "Block Value",
        value: finalCharacterStats.finalStats.blockValue,
      },
      {
        label: "Resilience Rating",
        value: finalCharacterStats.finalStats.resilienceRating,
      },
      { label: "Hit Rating", value: finalCharacterStats.finalStats.hitRating },
      {
        label: "Spell Hit Rating",
        value: finalCharacterStats.finalStats.spellHitRating,
      },
      {
        label: "Expertise Rating",
        value: finalCharacterStats.finalStats.expertiseRating,
      },
      {
        label: "Attack Power",
        value: finalCharacterStats.finalStats.attackPower,
      },
      { label: "Spell Power", value: finalCharacterStats.finalStats.spellPower },
      { label: "MP5", value: finalCharacterStats.finalStats.mp5 },
    ].filter((stat) => stat.value !== 0)
  : [];

  const derivedTankStats = finalCharacterStats?.derivedTankStats;
  const physicalMitigationStats = finalCharacterStats?.physicalMitigationStats;
  const magicMitigationStats = finalCharacterStats?.magicMitigationStats;

  const selectedPhaseLabel =
    phaseOptions.find((option) => option.value === selectedPhase)?.label ??
    "All TBC";
  
  const gearColumns = useMemo(() => {
    const gearWithIndexes = gear.map((gearSlot, index) => ({
      gearSlot,
      index,
    }));

    return [
      gearWithIndexes.filter((_, index) => index % 3 === 0),
      gearWithIndexes.filter((_, index) => index % 3 === 1),
      gearWithIndexes.filter((_, index) => index % 3 === 2),
    ];
  }, [gear]);

  const filteredAvailableItems = useMemo(() => {
    const search = itemSearchTerm.trim().toLowerCase();

    if (!search) {
      return availableItems;
    }

    return availableItems.filter((item) => {
      const searchableText = [
        item.name,
        item.source,
        item.quality,
        item.phase.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableItems, itemSearchTerm]);

  const filteredAvailableEnchants = useMemo(() => {
    const search = enchantSearchTerm.trim().toLowerCase();

    if (!search) {
      return availableEnchants;
    }

    return availableEnchants.filter((enchant) => {
      const searchableText = [
        enchant.name,
        enchant.source,
        enchant.phase.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableEnchants, enchantSearchTerm]);

  const filteredAvailableGems = useMemo(() => {
    const search = gemSearchTerm.trim().toLowerCase();

    if (!search) {
      return availableGems;
    }

    return availableGems.filter((gem) => {
      const searchableText = [
        gem.name,
        gem.color,
        gem.quality,
        gem.source,
        gem.phase.toString(),
        gem.effectDescription ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [availableGems, gemSearchTerm]);

  async function loadItemsForSlot(slotIndex: number, phase?: number) {
    const gearSlot = gear[slotIndex];

    setAvailableItems([]);
    setError(null);
    setIsLoadingItems(true);

    try {
      const items = await getItems("ProtectionPaladin", gearSlot.slot, phase);
      setAvailableItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setIsLoadingItems(false);
    }
  }

  async function openItemPicker(slotIndex: number) {
    setSelectedSlotIndex(slotIndex);
    setItemSearchTerm("");

    await loadItemsForSlot(slotIndex, selectedPhase);
  }

  function handlePhaseChange(value: string) {
    const nextPhase = value === "all" ? undefined : Number(value);

    setSelectedPhase(nextPhase);

    if (selectedSlotIndex !== null) {
      void loadItemsForSlot(selectedSlotIndex, nextPhase);
    }
    if (selectedEnchantSlotIndex !== null) {
      void loadEnchantsForSlot(selectedEnchantSlotIndex, nextPhase);
    }
    if (selectedGemSlotIndex !== null && selectedGemSocketIndex !== null) {
      void loadGemsForSocket(selectedGemSlotIndex, selectedGemSocketIndex, nextPhase);
    }
  }

  function equipItem(item: TbcItem) {
    if (selectedSlotIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === selectedSlotIndex
          ? {
            ...gearSlot,
            item,
            gems: item.sockets.map(() => null),
          }
          : gearSlot
      )
    );

    setSelectedSlotIndex(null);
    setAvailableItems([]);
  }

  function closeModal() {
    setSelectedSlotIndex(null);
    setAvailableItems([]);
    setError(null);
    setItemSearchTerm("");
  }

  async function loadEnchantsForSlot(slotIndex: number, phase?: number) {
    const gearSlot = gear[slotIndex];

    setAvailableEnchants([]);
    setEnchantError(null);
    setIsLoadingEnchants(true);

    try {
      const enchants = await getEnchants(gearSlot.slot, phase);
      setAvailableEnchants(enchants);
    } catch (err) {
      setEnchantError(
        err instanceof Error ? err.message : "Failed to load enchants."
      );
    } finally {
      setIsLoadingEnchants(false);
    }
  }

  async function openEnchantPicker(slotIndex: number) {
    setSelectedEnchantSlotIndex(slotIndex);
    setEnchantSearchTerm("");

    await loadEnchantsForSlot(slotIndex, selectedPhase);
  }

  function equipEnchant(enchant: TbcEnchant) {
    if (selectedEnchantSlotIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === selectedEnchantSlotIndex
          ? {
              ...gearSlot,
              enchant,
            }
          : gearSlot
      )
    );

    closeEnchantModal();
  }

  function removeEnchant(slotIndex: number) {
    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === slotIndex
          ? {
              ...gearSlot,
              enchant: undefined,
            }
          : gearSlot
      )
    );
  }

  function closeEnchantModal() {
    setSelectedEnchantSlotIndex(null);
    setAvailableEnchants([]);
    setEnchantError(null);
    setEnchantSearchTerm("");
  }

  async function loadGemsForSocket(
    slotIndex: number,
    socketIndex: number,
    phase?: number,
    includeEpics = includeEpicGems
  ) {
    const gearSlot = gear[slotIndex];
    const socketColor = gearSlot.item?.sockets[socketIndex];

    if (!socketColor) {
      return;
    }

    setAvailableGems([]);
    setGemError(null);
    setIsLoadingGems(true);

    try {
      const gems = await getGems(socketColor, phase, false, includeEpics);
      setAvailableGems(gems);
    } catch (err) {
      setGemError(err instanceof Error ? err.message : "Failed to load gems.");
    } finally {
      setIsLoadingGems(false);
    }
  }

  async function openGemPicker(slotIndex: number, socketIndex: number) {
    setSelectedGemSlotIndex(slotIndex);
    setSelectedGemSocketIndex(socketIndex);
    setGemSearchTerm("");

    await loadGemsForSocket(slotIndex, socketIndex, selectedPhase);
  }

  function equipGem(gem: TbcGem) {
    if (selectedGemSlotIndex === null || selectedGemSocketIndex === null) {
      return;
    }

    setGear((currentGear) =>
      currentGear.map((gearSlot, index) => {
        if (index !== selectedGemSlotIndex || !gearSlot.item) {
          return gearSlot;
        }

        const nextGems =
          gearSlot.gems && gearSlot.gems.length === gearSlot.item.sockets.length
            ? [...gearSlot.gems]
            : gearSlot.item.sockets.map(() => null);

        nextGems[selectedGemSocketIndex] = gem;

        return {
          ...gearSlot,
          gems: nextGems,
        };
      })
    );

    closeGemModal();
  }

  function removeGem(slotIndex: number, socketIndex: number) {
    setGear((currentGear) =>
      currentGear.map((gearSlot, index) => {
        if (index !== slotIndex || !gearSlot.item) {
          return gearSlot;
        }

        const nextGems =
          gearSlot.gems && gearSlot.gems.length === gearSlot.item.sockets.length
            ? [...gearSlot.gems]
            : gearSlot.item.sockets.map(() => null);

        nextGems[socketIndex] = null;

        return {
          ...gearSlot,
          gems: nextGems,
        };
      })
    );
  }

  function closeGemModal() {
    setSelectedGemSlotIndex(null);
    setSelectedGemSocketIndex(null);
    setAvailableGems([]);
    setGemError(null);
    setGemSearchTerm("");
  }

  function handleIncludeEpicGemsChange(checked: boolean) {
    setIncludeEpicGems(checked);

    if (selectedGemSlotIndex !== null && selectedGemSocketIndex !== null) {
      void loadGemsForSocket(
        selectedGemSlotIndex,
        selectedGemSocketIndex,
        selectedPhase,
        checked
      );
    }
  }

  function renderGearCard(gearSlot: EquippedSlot, index: number) {
    const socketBonusSummary = gearSlot.item
      ? formatStatSummary(gearSlot.item.socketBonus)
      : "";

    const socketBonusActive = gearSlot.item
      ? isSocketBonusActive(gearSlot.item, gearSlot.gems)
      : false;

    const metaGems =
      gearSlot.gems?.filter((gem): gem is TbcGem => gem?.color === "Meta") ?? [];

    return (
      <article
        key={gearSlot.slotKey}
        className={`gear-slot-card ${
          gearSlot.item ? "gear-slot-card-equipped" : ""
        }`}
      >
        <button
          className="gear-slot gear-slot-main"
          onClick={() => openItemPicker(index)}
        >
          <span className="gear-slot-topline">
            <span className="gear-slot-label">{gearSlot.label}</span>
            {gearSlot.item && <span className="gear-slot-edit">Change</span>}
          </span>

          <span className="gear-slot-content">
            <ItemIcon item={gearSlot.item} />
            <span className="gear-slot-item">
              {gearSlot.item?.name ?? "Empty"}
            </span>
          </span>
        </button>

        {gearSlot.item && (
          <div className="gear-card-details">
            <div className="gear-detail-row">
              <button
                className={`gear-detail-chip ${
                  gearSlot.enchant ? "gear-detail-chip-filled" : ""
                }`}
                onClick={() => openEnchantPicker(index)}
              >
                <span className="gear-detail-label">Enchant</span>
                <span className="gear-detail-value">
                  {gearSlot.enchant?.name ?? "Add"}
                </span>
              </button>

              {gearSlot.enchant && (
                <button
                  className="compact-remove-button"
                  onClick={() => removeEnchant(index)}
                  aria-label={`Remove enchant from ${gearSlot.label}`}
                >
                  ×
                </button>
              )}
            </div>

            {gearSlot.item.sockets.length > 0 && (
              <div className="socket-chip-list">
                {getSocketDisplayIndexes(gearSlot.item.sockets).map((socketIndex) => {
                  const socketColor = gearSlot.item!.sockets[socketIndex];
                  const selectedGem = gearSlot.gems?.[socketIndex] ?? null;
                  const socketMatches = doesGemMatchSocket(selectedGem, socketColor);

                  return (
                    <div
                      className="socket-chip-row"
                      key={`${gearSlot.slotKey}-${socketIndex}`}
                    >
                      <button
                        className={`socket-chip ${
                          selectedGem ? "socket-chip-filled" : ""
                        } ${selectedGem && socketMatches ? "socket-chip-matched" : ""}`}
                        onClick={() => openGemPicker(index, socketIndex)}
                      >
                        <span className="socket-chip-label">
                          {socketColor}
                          {selectedGem && socketMatches ? " ✓" : ""}
                        </span>
                        <span className="socket-chip-value">
                          {selectedGem?.name ?? "Add Gem"}
                        </span>
                      </button>

                      {selectedGem && (
                        <button
                          className="compact-remove-button"
                          onClick={() => removeGem(index, socketIndex)}
                          aria-label={`Remove gem from ${gearSlot.label}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(socketBonusSummary || metaGems.length > 0) && (
              <div className="gear-status-row">
                {socketBonusSummary && (
                  <span
                    className={`gear-status-pill ${
                      socketBonusActive
                        ? "gear-status-pill-good"
                        : "gear-status-pill-muted"
                    }`}
                  >
                    Bonus {socketBonusActive ? "✓" : "—"} {socketBonusSummary}
                  </span>
                )}

                {metaGems.map((metaGem) => {
                  const metaIsActive = isMetaGemActive(metaGem, gear);

                  return (
                    <span
                      className={`gear-status-pill ${
                        metaIsActive
                          ? "gear-status-pill-good"
                          : "gear-status-pill-warning"
                      }`}
                      key={metaGem.id}
                      title={metaGem.name}
                    >
                      Meta {metaIsActive ? "✓" : "!"}:{" "}
                      {formatMetaRequirementProgress(metaGem, gear)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>TBC Tank Planner</h1>
          <p>Protection Paladin gear optimizer</p>
        </div>

        <div className="class-tabs">
          <button className="active">Protection Paladin</button>
          <button disabled>Feral Druid</button>
          <button disabled>Protection Warrior</button>
        </div>
      </header>

      <main className="main-layout">
        <section className="panel gear-panel">
          <div className="panel-title-row">
            <h2>Gear</h2>

            <label className="phase-filter">
              <span>Available Through</span>
              <select
                value={selectedPhase ?? "all"}
                onChange={(event) => handlePhaseChange(event.target.value)}
              >
                {phaseOptions.map((phaseOption) => (
                  <option
                    key={phaseOption.label}
                    value={phaseOption.value ?? "all"}
                  >
                    {phaseOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="gear-grid">
            {gearColumns.map((gearColumn, columnIndex) => (
              <div className="gear-column" key={`gear-column-${columnIndex}`}>
                {gearColumn.map(({ gearSlot, index }) =>
                  renderGearCard(gearSlot, index)
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel stats-panel">
          <div className="panel-title-row compact-panel-title">
            <h2>Gear Stat Totals</h2>

            <label className="mini-toggle">
              <input
                type="checkbox"
                checked={includeHolyShield}
                onChange={(event) => setIncludeHolyShield(event.target.checked)}
              />
              <span>Holy Shield</span>
            </label>
          </div>

          <p className="panel-caption">
            Gear totals include equipped items, enchants, active gems, and active socket
            bonuses.
          </p>

          {isCalculatingStats && <p className="muted">Calculating...</p>}

          {visibleStatRows.length === 0 ? (
            <p className="muted">Equip gear to see stat totals.</p>
          ) : (
            <div className="compact-stat-grid">
              {visibleStatRows.map((stat) => (
                <div className="compact-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          )}

          {activeGearSetBonuses.length > 0 && (
            <div className="set-bonus-list">
              <h3 className="set-bonus-title">Active Set Bonuses</h3>

              {activeGearSetBonuses.map((bonus) => (
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
          )}

          {calculationWarnings.length > 0 && (
            <div className="warning-list">
              {calculationWarnings.map((warning) => (
                <p key={warning} className="warning-message">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="panel results-panel">
          <div className="panel-title-row">
            <h2>Final Character Stats</h2>

            <label className="race-filter">
              <span>Race</span>
              <select
                value={selectedRace}
                onChange={(event) =>
                  setSelectedRace(event.target.value as CharacterRace)
                }
              >
                {raceOptions.map((raceOption) => (
                  <option key={raceOption.value} value={raceOption.value}>
                    {raceOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isCalculatingFinalStats && <p className="muted">Calculating...</p>}

          {finalStatsError && <p className="error">{finalStatsError}</p>}

          {finalCharacterStats && (
            <>
              <div className="summary-grid">
                <div className="summary-card">
                  <span>Health</span>
                  <strong>{finalCharacterStats.health}</strong>
                </div>

                <div className="summary-card">
                  <span>Mana</span>
                  <strong>{finalCharacterStats.mana}</strong>
                </div>

                {physicalMitigationStats && (
                  <>
                    <div className="summary-card">
                      <span>Physical EHP</span>
                      <strong>
                        {physicalMitigationStats.physicalEffectiveHealth.toLocaleString()}
                      </strong>
                      <small>vs level {physicalMitigationStats.attackerLevel}</small>
                    </div>

                    <div className="summary-card">
                      <span>Armor DR</span>
                      <strong>{physicalMitigationStats.armorDamageReductionPercent}%</strong>
                      <small>
                        {physicalMitigationStats.armorNeededForCap.toLocaleString()} armor to cap
                      </small>
                    </div>
                  </>
                )}

                {magicMitigationStats && (
                  <div className="summary-card">
                    <span>Best Magic EHP</span>
                    <strong>
                      {Math.max(
                        ...magicMitigationStats.schools.map(
                          (school) => school.magicEffectiveHealth
                        )
                      ).toLocaleString()}
                    </strong>
                    <small>Highest current resistance school</small>
                  </div>
                )}

                {derivedTankStats && (
                  <>
                    <div
                      className={`summary-card status-card ${
                        derivedTankStats.isCritImmune ? "status-good" : "status-bad"
                      }`}
                    >
                      <span>Crit Immune</span>
                      <strong>{derivedTankStats.isCritImmune ? "Yes" : "No"}</strong>
                      <small>
                        {derivedTankStats.isCritImmune
                          ? `${derivedTankStats.totalCritReductionPercent}% reduction`
                          : `${derivedTankStats.critReductionNeededPercent}% short`}
                      </small>
                    </div>

                    <div
                      className={`summary-card status-card ${
                        derivedTankStats.isUncrushable ? "status-good" : "status-bad"
                      }`}
                    >
                      <span>Uncrushable</span>
                      <strong>{derivedTankStats.isUncrushable ? "Yes" : "No"}</strong>
                      <small>
                        {derivedTankStats.isUncrushable
                          ? `${derivedTankStats.avoidanceWithBlockPercent}% table coverage`
                          : `${derivedTankStats.crushAvoidanceNeededPercent}% short`}
                      </small>
                    </div>
                  </>
                )}
              </div>

              <h3 className="subsection-title">Core Stats</h3>

              <div className="compact-stat-grid">
                {visibleFinalStatRows.map((stat) => (
                  <div className="compact-stat" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              {activeFinalSetBonuses.length > 0 && (
                <>
                  <h3 className="subsection-title">Set Bonuses</h3>

                  <div className="set-bonus-list compact-set-bonus-list">
                    {activeFinalSetBonuses.map((bonus) => (
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
              )}

              {physicalMitigationStats && (
                <>
                  <h3 className="subsection-title">Mitigation</h3>

                  <div className="compact-stat-grid">
                    <div className="compact-stat">
                      <span>Physical EHP</span>
                      <strong>
                        {physicalMitigationStats.physicalEffectiveHealth.toLocaleString()}
                      </strong>
                    </div>

                    <div className="compact-stat">
                      <span>Armor DR</span>
                      <strong>{physicalMitigationStats.armorDamageReductionPercent}%</strong>
                    </div>

                    <div className="compact-stat">
                      <span>Armor Cap</span>
                      <strong>{physicalMitigationStats.armorCap.toLocaleString()}</strong>
                    </div>

                    <div className="compact-stat">
                      <span>Armor to Cap</span>
                      <strong>
                        {physicalMitigationStats.armorNeededForCap.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </>
              )}

              {magicMitigationStats && (
                <>
                  <h3 className="subsection-title">Resistance EHP</h3>

                  <div className="compact-stat-grid">
                    {magicMitigationStats.schools.map((school) => (
                      <div className="compact-stat" key={school.school}>
                        <span>
                          {school.school} — {school.resistance}/{school.resistanceCap}
                        </span>
                        <strong>{school.magicEffectiveHealth.toLocaleString()}</strong>
                        <small>
                          {school.averageDamageReductionPercent}% avg reduction •{" "}
                          {school.resistanceNeededForCap} to cap
                        </small>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {derivedTankStats && (
                <>
                  <h3 className="subsection-title">Tank Table</h3>

                  <div className="compact-stat-grid tank-table-grid">
                    <div className="stat-row">
                      <span>Defense Skill</span>
                      <strong>{derivedTankStats.defenseSkill}</strong>
                    </div>

                    <div className="stat-row">
                      <span>Crit Reduction</span>
                      <strong>{derivedTankStats.totalCritReductionPercent}%</strong>
                    </div>

                    <div className="stat-row">
                      <span>Miss</span>
                      <strong>{derivedTankStats.missPercent}%</strong>
                    </div>

                    <div className="stat-row">
                      <span>Dodge</span>
                      <strong>{derivedTankStats.dodgePercent}%</strong>
                    </div>

                    <div className="stat-row">
                      <span>Parry</span>
                      <strong>{derivedTankStats.parryPercent}%</strong>
                    </div>

                    <div className="stat-row">
                      <span>Block</span>
                      <strong>{derivedTankStats.blockPercent}%</strong>
                    </div>

                    <div className="stat-row">
                      <span>Holy Shield</span>
                      <strong>
                        {derivedTankStats.isHolyShieldIncluded
                          ? `+${derivedTankStats.holyShieldBlockChancePercent}% Block`
                          : "Not Included"}
                      </strong>
                    </div>

                    <div className="stat-row">
                      <span>Avoidance + Block</span>
                      <strong>{derivedTankStats.avoidanceWithBlockPercent}%</strong>
                    </div>
                  </div>
                </>
              )}

              <p className="stat-note">
                Final stats include base level 70 Protection Paladin stats plus equipped
                gear, enchants, active gems, and active socket bonuses. Talents, buffs, EHP,
                and encounter settings will be added later.
              </p>
            </>
          )}
        </section>
      </main>

      {selectedSlot && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select {selectedSlot.label}</h2>
                <p className="modal-subtitle">
                  Filter: {selectedPhaseLabel}
                </p>
              </div>

              <button onClick={closeModal}>X</button>
            </div>

            <div className="picker-toolbar">
              <label className="picker-search">
                <span>Search Items</span>
                <input
                  value={itemSearchTerm}
                  onChange={(event) => setItemSearchTerm(event.target.value)}
                  placeholder="Search by name, source, quality..."
                />
              </label>

              <label className="phase-filter">
                <span>Available Through</span>
                <select
                  value={selectedPhase ?? "all"}
                  onChange={(event) => handlePhaseChange(event.target.value)}
                >
                  {phaseOptions.map((phaseOption) => (
                    <option
                      key={phaseOption.label}
                      value={phaseOption.value ?? "all"}
                    >
                      {phaseOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoadingItems && <p>Loading items...</p>}

            {error && <p className="error">{error}</p>}

            {!isLoadingItems && !error && filteredAvailableItems.length === 0 && (
              <p className="muted">
                {availableItems.length === 0
                  ? "No items found for this slot and phase yet."
                  : "No items match your search."}
              </p>
            )}

            <div className="item-list">
              {filteredAvailableItems.map((item) => (
                <button
                  key={item.id}
                  className="item-row"
                  onClick={() => equipItem(item)}
                >
                  <div>
                    <div className="item-main">
                      <ItemIcon item={item} />

                      <div>
                        <span className="item-name">{item.name}</span>
                        <span className="item-details">
                          {item.quality} • Phase {item.phase} • {item.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="item-stats">
                    {item.stats.stamina > 0 && `+${item.stats.stamina} Stam `}
                    {item.stats.defenseRating > 0 &&
                      `+${item.stats.defenseRating} Def `}
                    {item.stats.dodgeRating > 0 &&
                      `+${item.stats.dodgeRating} Dodge `}
                    {item.stats.spellPower > 0 &&
                      `+${item.stats.spellPower} SP`}
                    {item.stats.fireResistance > 0 && `+${item.stats.fireResistance} Fire Res `}
                    {item.stats.frostResistance > 0 && `+${item.stats.frostResistance} Frost Res `}
                    {item.stats.natureResistance > 0 && `+${item.stats.natureResistance} Nature Res `}
                    {item.stats.shadowResistance > 0 && `+${item.stats.shadowResistance} Shadow Res `}
                    {item.stats.arcaneResistance > 0 && `+${item.stats.arcaneResistance} Arcane Res `}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedEnchantSlot && (
        <div className="modal-backdrop" onClick={closeEnchantModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select Enchant</h2>
                <p className="modal-subtitle">
                  {selectedEnchantSlot.label} • Filter: {selectedPhaseLabel}
                </p>
              </div>

              <button onClick={closeEnchantModal}>X</button>
            </div>

            <div className="picker-toolbar">
              <label className="picker-search">
                <span>Search Enchants</span>
                <input
                  value={enchantSearchTerm}
                  onChange={(event) => setEnchantSearchTerm(event.target.value)}
                  placeholder="Search by name or source..."
                />
              </label>

              <label className="phase-filter">
                <span>Available Through</span>
                <select
                  value={selectedPhase ?? "all"}
                  onChange={(event) => handlePhaseChange(event.target.value)}
                >
                  {phaseOptions.map((phaseOption) => (
                    <option key={phaseOption.label} value={phaseOption.value ?? "all"}>
                      {phaseOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoadingEnchants && <p>Loading enchants...</p>}

            {enchantError && <p className="error">{enchantError}</p>}

            {!isLoadingEnchants &&
              !enchantError &&
              filteredAvailableEnchants.length === 0 && (
                <p className="muted">
                  {availableEnchants.length === 0
                    ? "No enchants found for this slot and phase yet."
                    : "No enchants match your search."}
                </p>
              )}

            <div className="item-list">
              {filteredAvailableEnchants.map((enchant) => (
                <button
                  key={enchant.id}
                  className="item-row"
                  onClick={() => equipEnchant(enchant)}
                >
                  <div>
                    <span className="item-name">{enchant.name}</span>
                    <span className="item-details">
                      Phase {enchant.phase} • {enchant.source}
                    </span>
                  </div>

                  <span className="item-stats">
                    {enchant.stats.stamina > 0 && `+${enchant.stats.stamina} Stam `}
                    {enchant.stats.defenseRating > 0 &&
                      `+${enchant.stats.defenseRating} Def `}
                    {enchant.stats.dodgeRating > 0 &&
                      `+${enchant.stats.dodgeRating} Dodge `}
                    {enchant.stats.blockValue > 0 &&
                      `+${enchant.stats.blockValue} Block Value `}
                    {enchant.stats.spellPower > 0 &&
                      `+${enchant.stats.spellPower} SP`}
                    {enchant.stats.fireResistance > 0 && `+${enchant.stats.fireResistance} Fire Res `}
                    {enchant.stats.frostResistance > 0 && `+${enchant.stats.frostResistance} Frost Res `}
                    {enchant.stats.natureResistance > 0 && `+${enchant.stats.natureResistance} Nature Res `}
                    {enchant.stats.shadowResistance > 0 && `+${enchant.stats.shadowResistance} Shadow Res `}
                    {enchant.stats.arcaneResistance > 0 && `+${enchant.stats.arcaneResistance} Arcane Res `}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedGemSlot && selectedGemSocketColor && (
        <div className="modal-backdrop" onClick={closeGemModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Select Gem</h2>
                <p className="modal-subtitle">
                  {selectedGemSlot.label} • {selectedGemSocketColor} Socket • Filter:{" "}
                  {selectedPhaseLabel}
                </p>
              </div>

              <button onClick={closeGemModal}>X</button>
            </div>

            <div className="picker-toolbar">
              <label className="picker-search">
                <span>Search Gems</span>
                <input
                  value={gemSearchTerm}
                  onChange={(event) => setGemSearchTerm(event.target.value)}
                  placeholder="Search by name, color, source..."
                />
              </label>

              <label className="phase-filter">
                <span>Available Through</span>
                <select
                  value={selectedPhase ?? "all"}
                  onChange={(event) => handlePhaseChange(event.target.value)}
                >
                  {phaseOptions.map((phaseOption) => (
                    <option key={phaseOption.label} value={phaseOption.value ?? "all"}>
                      {phaseOption.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="effect-toggle gem-toggle">
              <input
                type="checkbox"
                checked={includeEpicGems}
                onChange={(event) => handleIncludeEpicGemsChange(event.target.checked)}
              />
              <span>Include Epic Gems</span>
            </label>

            {isLoadingGems && <p>Loading gems...</p>}

            {gemError && <p className="error">{gemError}</p>}

            {!isLoadingGems && !gemError && filteredAvailableGems.length === 0 && (
              <p className="muted">
                {availableGems.length === 0
                  ? "No gems found for this socket and phase yet."
                  : "No gems match your search."}
              </p>
            )}

            <div className="item-list">
              {filteredAvailableGems.map((gem) => (
                <button
                  key={gem.id}
                  className="item-row"
                  onClick={() => equipGem(gem)}
                >
                  <div>
                    <span className="item-name">{gem.name}</span>
                    <span className="item-details">
                      {gem.quality} • {gem.color} • Phase {gem.phase} • {gem.source}
                    </span>
                    {gem.effectDescription && (
                      <span className="item-details">{gem.effectDescription}</span>
                    )}
                    {gem.metaRequirementDescription && (
                      <span className="item-details">{gem.metaRequirementDescription}</span>
                    )}
                  </div>

                  <span className="item-stats">
                    {gem.stats.stamina > 0 && `+${gem.stats.stamina} Stam `}
                    {gem.stats.defenseRating > 0 &&
                      `+${gem.stats.defenseRating} Def `}
                    {gem.stats.resilienceRating > 0 &&
                      `+${gem.stats.resilienceRating} Resil `}
                    {gem.stats.agility > 0 && `+${gem.stats.agility} Agi `}
                    {gem.stats.dodgeRating > 0 && `+${gem.stats.dodgeRating} Dodge `}
                    {gem.stats.spellPower > 0 && `+${gem.stats.spellPower} SP`}
                    {gem.stats.fireResistance > 0 && `+${gem.stats.fireResistance} Fire Res `}
                    {gem.stats.frostResistance > 0 && `+${gem.stats.frostResistance} Frost Res `}
                    {gem.stats.natureResistance > 0 && `+${gem.stats.natureResistance} Nature Res `}
                    {gem.stats.shadowResistance > 0 && `+${gem.stats.shadowResistance} Shadow Res `}
                    {gem.stats.arcaneResistance > 0 && `+${gem.stats.arcaneResistance} Arcane Res `}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;