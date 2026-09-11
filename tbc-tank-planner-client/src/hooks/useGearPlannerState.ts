import { useMemo, useState } from "react";
import { getEnchants, getGems, getItems } from "../api";
import { initialGear, phaseOptions } from "../config/plannerOptions";
import type { EquippedSlot } from "../models/plannerModels";
import type {
  EquippedGearItem,
  SocketColor,
  TbcEnchant,
  TbcGem,
  TbcItem,
} from "../types";

export function useGearPlannerState() {
  const [gear, setGear] = useState<EquippedSlot[]>(initialGear);
  const [selectedPhase, setSelectedPhase] = useState<number | undefined>(
    undefined
  );

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
    null
  );
  const [availableItems, setAvailableItems] = useState<TbcItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState("");

  const [selectedEnchantSlotIndex, setSelectedEnchantSlotIndex] = useState<
    number | null
  >(null);
  const [availableEnchants, setAvailableEnchants] = useState<TbcEnchant[]>([]);
  const [isLoadingEnchants, setIsLoadingEnchants] = useState(false);
  const [enchantError, setEnchantError] = useState<string | null>(null);
  const [enchantSearchTerm, setEnchantSearchTerm] = useState("");

  const [selectedGemSlotIndex, setSelectedGemSlotIndex] = useState<
    number | null
  >(null);
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

  const selectedPhaseLabel =
    phaseOptions.find((option) => option.value === selectedPhase)?.label ??
    "All TBC";

  async function loadItemsForSlot(slotIndex: number, phase?: number) {
    const gearSlot = gear[slotIndex];

    setAvailableItems([]);
    setItemError(null);
    setIsLoadingItems(true);

    try {
      const items = await getItems("ProtectionPaladin", gearSlot.slot, phase);
      setAvailableItems(items);
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setIsLoadingItems(false);
    }
  }

  async function openItemPicker(slotIndex: number) {
    setSelectedSlotIndex(slotIndex);
    setItemSearchTerm("");

    await loadItemsForSlot(slotIndex, selectedPhase);
  }

  function closeItemModal() {
    setSelectedSlotIndex(null);
    setAvailableItems([]);
    setItemError(null);
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

  function closeGemModal() {
    setSelectedGemSlotIndex(null);
    setSelectedGemSocketIndex(null);
    setAvailableGems([]);
    setGemError(null);
    setGemSearchTerm("");
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
      void loadGemsForSocket(
        selectedGemSlotIndex,
        selectedGemSocketIndex,
        nextPhase
      );
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
              enchant: undefined,
              gems: item.sockets.map(() => null),
            }
          : gearSlot
      )
    );

    setSelectedSlotIndex(null);
    setAvailableItems([]);
  }

  function unequipItem(slotIndex: number) {
    setGear((currentGear) =>
      currentGear.map((gearSlot, index) =>
        index === slotIndex
          ? {
              ...gearSlot,
              item: undefined,
              enchant: undefined,
              gems: undefined,
            }
          : gearSlot
      )
    );

    if (selectedSlotIndex === slotIndex) {
      closeItemModal();
    }

    if (selectedEnchantSlotIndex === slotIndex) {
      closeEnchantModal();
    }

    if (selectedGemSlotIndex === slotIndex) {
      closeGemModal();
    }
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

  return {
    gear,
    selectedPhase,
    selectedPhaseLabel,
    selectedSlot,
    selectedEnchantSlot,
    selectedGemSlot,
    selectedGemSocketColor,
    equippedGear,

    availableItems,
    isLoadingItems,
    itemError,
    itemSearchTerm,
    setItemSearchTerm,
    openItemPicker,
    equipItem,
    unequipItem,
    closeItemModal,

    availableEnchants,
    isLoadingEnchants,
    enchantError,
    enchantSearchTerm,
    setEnchantSearchTerm,
    openEnchantPicker,
    equipEnchant,
    removeEnchant,
    closeEnchantModal,

    availableGems,
    isLoadingGems,
    gemError,
    gemSearchTerm,
    includeEpicGems,
    setGemSearchTerm,
    openGemPicker,
    equipGem,
    removeGem,
    closeGemModal,
    handleIncludeEpicGemsChange,

    handlePhaseChange,
  };
}
