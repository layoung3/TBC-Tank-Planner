import type {
  CharacterRace,
  EquippedGearItem,
  FinalCharacterStatsResponse,
  GearStatsResponse,
  ItemSlot,
  SocketColor,
  TankClass,
  TbcEnchant,
  TbcGem,
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

export async function getEnchants(
  slot?: ItemSlot,
  phase?: number
): Promise<TbcEnchant[]> {
  const params = new URLSearchParams();

  if (slot) {
    params.set("slot", slot);
  }

  if (phase !== undefined) {
    params.set("phase", phase.toString());
  }

  const response = await fetch(
    `${API_BASE_URL}/api/enchants?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to load enchants.");
  }

  return response.json();
}

export async function getGems(
  socketColor?: SocketColor,
  phase?: number,
  matchingOnly = false,
  includeEpicGems = true
): Promise<TbcGem[]> {
  const params = new URLSearchParams();

  if (socketColor) {
    params.set("socketColor", socketColor);
  }

  if (phase !== undefined) {
    params.set("phase", phase.toString());
  }

  params.set("matchingOnly", matchingOnly.toString());
  params.set("includeEpicGems", includeEpicGems.toString());

  const response = await fetch(`${API_BASE_URL}/api/gems?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to load gems.");
  }

  return response.json();
}

export async function calculateGearStats(
  equippedGear: EquippedGearItem[]
): Promise<GearStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calculations/gear-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      equippedGear,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to calculate gear stats.");
  }

  return response.json();
}

export async function calculateFinalCharacterStats(
  race: CharacterRace,
  equippedGear: EquippedGearItem[],
  includeHolyShield: boolean
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
        equippedGear,
        includeHolyShield,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to calculate final character stats.");
  }

  return response.json();
}