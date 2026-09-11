import type { EquippedSlot } from "../models/plannerModels";
import type { SocketColor, TbcGem, TbcItem } from "../types";

export function doesGemMatchSocket(
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

export function isSocketBonusActive(
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

export function canGemFitSocket(
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

export function isMetaGemActive(metaGem: TbcGem, gear: EquippedSlot[]): boolean {
  if (metaGem.color !== "Meta") {
    return true;
  }

  const progress = getMetaRequirementProgress(metaGem, gear);

  if (progress.length === 0) {
    return true;
  }

  return progress.every((requirement) => requirement.isMet);
}

export function formatMetaRequirementProgress(
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

export function getSocketDisplayIndexes(sockets: SocketColor[]): number[] {
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
