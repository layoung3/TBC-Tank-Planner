import type { ItemSlot, TankClass, TbcItem } from "./types";

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