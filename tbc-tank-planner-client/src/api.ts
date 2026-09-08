import type {
  CharacterRace,
  FinalCharacterStatsResponse,
  GearStatsResponse,
  ItemSlot,
  TankClass,
  TbcItem,
} from "./types";

const API_BASE_URL = "https://localhost:7045";

export async function getItems(
  tankClass: TankClass,
  slot?: ItemSlot,
  phase?: number
): Promise<TbcItem[]> {
  const params = new URLSearchParams();

  params.set("tankClass", tankClass);

  if (slot) {
    params.set("slot", slot);
  }

  if (phase !== undefined) {
    params.set("phase", phase.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/items?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to load items.");
  }

  return response.json();
}

export async function calculateGearStats(
  equippedItemIds: number[]
): Promise<GearStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calculations/gear-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      equippedItemIds,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to calculate gear stats.");
  }

  return response.json();
}

export async function calculateFinalCharacterStats(
  race: CharacterRace,
  equippedItemIds: number[]
): Promise<FinalCharacterStatsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/calculations/final-character-stats`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        race,
        equippedItemIds,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to calculate final character stats.");
  }

  return response.json();
}