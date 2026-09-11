import { useMemo, useState } from "react";
import { protectionPaladinBuffs } from "../data/protectionPaladinBuffs";
import type {
  ActiveBuffEffect,
  ActiveBuffSelection,
  BuffDefinition,
  BuffVariant,
  CharacterBuffSelection,
} from "../types";
import { formatStatSummary } from "../utils/statFormatting";

function getDefaultVariantId(buff: BuffDefinition): string | null {
  return buff.variants?.[0]?.id ?? null;
}

function getSelectedVariant(
  buff: BuffDefinition,
  selection?: ActiveBuffSelection
): BuffVariant | undefined {
  if (!selection?.variantId) {
    return undefined;
  }

  return buff.variants?.find((variant) => variant.id === selection.variantId);
}

function getEffectiveStats(buff: BuffDefinition, variant?: BuffVariant) {
  return variant?.stats ?? buff.stats;
}

function getEffectiveEffectKeys(buff: BuffDefinition, variant?: BuffVariant) {
  return variant && variant.effectKeys.length > 0
    ? variant.effectKeys
    : buff.effectKeys;
}

function getEffectiveScopes(buff: BuffDefinition, variant?: BuffVariant) {
  return variant && variant.appliesTo.length > 0 ? variant.appliesTo : buff.appliesTo;
}

function buildBuffEffect(
  buff: BuffDefinition,
  selection?: ActiveBuffSelection
): ActiveBuffEffect {
  const variant = getSelectedVariant(buff, selection);
  const effectiveStats = getEffectiveStats(buff, variant);
  const statSummary = formatStatSummary(effectiveStats);
  const baseDescription = variant?.description ?? buff.description;
  const description = statSummary
    ? `${baseDescription} (${statSummary})`
    : baseDescription;

  return {
    key: buff.id,
    name:
      variant && variant.id !== "standard"
        ? `${buff.name} (${variant.label})`
        : buff.name,
    categoryLabel: buff.category,
    sourceLabel: buff.source,
    description,
    effectKeys: getEffectiveEffectKeys(buff, variant),
    appliesTo: getEffectiveScopes(buff, variant),
    stats: effectiveStats,
    variantId: variant?.id ?? null,
    variantLabel: variant?.label ?? null,
  };
}

export function useBuffPlannerState() {
  const [activeBuffSelections, setActiveBuffSelections] = useState<
    ActiveBuffSelection[]
  >([]);

  const buffs = protectionPaladinBuffs;

  const activeBuffIds = useMemo(
    () => activeBuffSelections.map((selection) => selection.buffId),
    [activeBuffSelections]
  );

  const selectedBuffs = useMemo(
    () =>
      activeBuffSelections
        .map((selection) => buffs.find((buff) => buff.id === selection.buffId))
        .filter((buff): buff is BuffDefinition => Boolean(buff)),
    [activeBuffSelections, buffs]
  );

  const activeBuffEffects = useMemo(
    () =>
      activeBuffSelections
        .map((selection) => {
          const buff = buffs.find((candidateBuff) => candidateBuff.id === selection.buffId);

          return buff ? buildBuffEffect(buff, selection) : null;
        })
        .filter((effect): effect is ActiveBuffEffect => Boolean(effect)),
    [activeBuffSelections, buffs]
  );

  const buffSelection = useMemo<CharacterBuffSelection>(
    () => ({
      activeBuffIds,
      activeBuffs: activeBuffSelections,
    }),
    [activeBuffIds, activeBuffSelections]
  );

  function setBuffActive(buffId: string, isActive: boolean) {
    setActiveBuffSelections((currentSelections) => {
      const buff = buffs.find((candidateBuff) => candidateBuff.id === buffId);

      if (!buff) {
        return currentSelections;
      }

      if (!isActive) {
        return currentSelections.filter(
          (currentSelection) => currentSelection.buffId !== buffId
        );
      }

      const nextSelections = buff.exclusiveGroup
        ? currentSelections.filter((currentSelection) => {
            const currentBuff = buffs.find(
              (candidateBuff) => candidateBuff.id === currentSelection.buffId
            );

            return currentBuff?.exclusiveGroup !== buff.exclusiveGroup;
          })
        : [...currentSelections];

      if (!nextSelections.some((selection) => selection.buffId === buffId)) {
        nextSelections.push({
          buffId,
          variantId: getDefaultVariantId(buff),
        });
      }

      return nextSelections;
    });
  }

  function setBuffVariant(buffId: string, variantId: string) {
    setActiveBuffSelections((currentSelections) => {
      const buff = buffs.find((candidateBuff) => candidateBuff.id === buffId);

      if (!buff || !buff.variants?.some((variant) => variant.id === variantId)) {
        return currentSelections;
      }

      if (!currentSelections.some((selection) => selection.buffId === buffId)) {
        return [
          ...currentSelections,
          {
            buffId,
            variantId,
          },
        ];
      }

      return currentSelections.map((selection) =>
        selection.buffId === buffId
          ? {
              ...selection,
              variantId,
            }
          : selection
      );
    });
  }

  function clearBuffs() {
    setActiveBuffSelections([]);
  }

  return {
    buffs,
    activeBuffIds,
    activeBuffSelections,
    selectedBuffs,
    activeBuffEffects,
    buffSelection,
    setBuffActive,
    setBuffVariant,
    clearBuffs,
  };
}
