using TbcTankPlanner.Domain.Calculations;
using TbcTankPlanner.Domain.Characters;
using TbcTankPlanner.Domain.Gems;
using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Domain.ItemSets;
using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Services;

public class CalculationService
{
    private readonly ItemDataService _itemDataService;
    private readonly EnchantDataService _enchantDataService;
    private readonly GemDataService _gemDataService;

    private readonly ItemSetDataService _itemSetDataService;

    public CalculationService(
    ItemDataService itemDataService,
    EnchantDataService enchantDataService,
    GemDataService gemDataService, ItemSetDataService itemSetDataService
    )
    {
        _itemDataService = itemDataService;
        _enchantDataService = enchantDataService;
        _gemDataService = gemDataService;
        _itemSetDataService = itemSetDataService;
    }

    public async Task<GearStatsResponse> CalculateGearStatsAsync(GearStatsRequest request)
    {
        var allItems = await _itemDataService.GetAllItemsAsync();
        var itemLookup = allItems.ToDictionary(item => item.Id);

        var allEnchants = await _enchantDataService.GetAllEnchantsAsync();
        var enchantLookup = allEnchants.ToDictionary(enchant => enchant.Id);

        var allGems = await _gemDataService.GetAllGemsAsync();
        var gemLookup = allGems.ToDictionary(gem => gem.Id);

        var allItemSets = await _itemSetDataService.GetAllItemSetsAsync();
        var itemSetLookup = allItemSets.ToDictionary(itemSet => itemSet.Id);

        var equippedItemsForSetBonuses = new List<TbcItem>();

        var response = new GearStatsResponse();

        if (request.EquippedGear.Count > 0)
        {
            var validRegularGemsForMetaRequirements = GetValidRegularGemsForMetaRequirements(
                request.EquippedGear,
                itemLookup,
                gemLookup
            );
            foreach (var gearItem in request.EquippedGear)
            {
                TbcItem? equippedItem = null;

                if (gearItem.ItemId.HasValue)
                {
                    if (itemLookup.TryGetValue(gearItem.ItemId.Value, out var item))
                    {
                        equippedItem = item;
                        equippedItemsForSetBonuses.Add(item);
                        AddStats(response.GearStats, item.Stats);
                    }
                    else
                    {
                        response.Warnings.Add($"Item ID {gearItem.ItemId.Value} was not found.");
                    }
                }

                if (gearItem.EnchantId.HasValue)
                {
                    if (enchantLookup.TryGetValue(gearItem.EnchantId.Value, out var enchant))
                    {
                        if (!enchant.AllowedSlots.Contains(gearItem.Slot))
                        {
                            response.Warnings.Add(
                                $"{enchant.Name} cannot be applied to {gearItem.Slot}."
                            );
                        }
                        else
                        {
                            AddStats(response.GearStats, enchant.Stats);
                        }
                    }
                    else
                    {
                        response.Warnings.Add($"Enchant ID {gearItem.EnchantId.Value} was not found.");
                    }
                }

                ApplyGemStats(
                    response,
                    gearItem,
                    equippedItem,
                    gemLookup,
                    validRegularGemsForMetaRequirements
                );
            }

            ApplySetBonuses(
                response,
                equippedItemsForSetBonuses,
                itemSetLookup
            );

            return response;
        }

        // Legacy support for old request shape.
        foreach (var itemId in request.EquippedItemIds)
        {
            if (!itemLookup.TryGetValue(itemId, out var item))
            {
                response.Warnings.Add($"Item ID {itemId} was not found.");
                continue;
            }
            equippedItemsForSetBonuses.Add(item);

            AddStats(response.GearStats, item.Stats);
        }

        ApplySetBonuses(
            response,
            equippedItemsForSetBonuses,
            itemSetLookup
        );

        return response;
    }

    private static void AddStats(StatBlock total, StatBlock stats)
    {
        total.Stamina += stats.Stamina;
        total.Strength += stats.Strength;
        total.Agility += stats.Agility;
        total.Intellect += stats.Intellect;

        total.Armor += stats.Armor;

        total.ArcaneResistance += stats.ArcaneResistance;
        total.FireResistance += stats.FireResistance;
        total.FrostResistance += stats.FrostResistance;
        total.NatureResistance += stats.NatureResistance;
        total.ShadowResistance += stats.ShadowResistance;

        total.DefenseRating += stats.DefenseRating;
        total.DodgeRating += stats.DodgeRating;
        total.ParryRating += stats.ParryRating;
        total.BlockRating += stats.BlockRating;
        total.BlockValue += stats.BlockValue;

        total.ResilienceRating += stats.ResilienceRating;

        total.HitRating += stats.HitRating;
        total.SpellHitRating += stats.SpellHitRating;
        total.ExpertiseRating += stats.ExpertiseRating;

        total.AttackPower += stats.AttackPower;
        total.SpellPower += stats.SpellPower;

        total.Mp5 += stats.Mp5;
    }

    public async Task<FinalCharacterStatsResponse> CalculateFinalCharacterStatsAsync(
    FinalCharacterStatsRequest request
    )
    {
        var gearStatsResponse = await CalculateGearStatsAsync(
            new GearStatsRequest
            {
                EquippedGear = request.EquippedGear,
                EquippedItemIds = request.EquippedItemIds
            }
        );

        var baseStats = GetProtectionPaladinBaseStats(request.Race);

        var rawFinalStats = new StatBlock();

        AddStats(rawFinalStats, baseStats.Stats);
        AddStats(rawFinalStats, gearStatsResponse.GearStats);

        var convertedStats = ApplyStatConversions(
            baseStats,
            rawFinalStats,
            new StatConversionModifiers()
        );

        var derivedTankStats = CalculateDerivedTankStats(
            convertedStats.Stats,
            request.IncludeHolyShield
        );

        var physicalMitigationStats = CalculatePhysicalMitigationStats(
            convertedStats.Health,
            convertedStats.Stats,
            request.Encounter.AttackerLevel
        );

        var magicMitigationStats = CalculateMagicMitigationStats(
            convertedStats.Health,
            convertedStats.Stats,
            request.Encounter.AttackerLevel
        );

        var response = new FinalCharacterStatsResponse
        {
            Race = request.Race,
            ActiveSetBonuses = gearStatsResponse.ActiveSetBonuses,
            BaseStats = baseStats,
            GearStats = gearStatsResponse.GearStats,
            FinalStats = convertedStats.Stats,
            ConvertedStats = convertedStats,
            DerivedTankStats = derivedTankStats,
            Health = convertedStats.Health,
            Mana = convertedStats.Mana,
            PhysicalMitigationStats = physicalMitigationStats,
            MagicMitigationStats = magicMitigationStats,
            Warnings = gearStatsResponse.Warnings
        };

        return response;
    }

    private static CharacterBaseStats GetProtectionPaladinBaseStats(CharacterRace race)
    {
        return race switch
        {
            CharacterRace.BloodElf => new CharacterBaseStats
            {
                Race = CharacterRace.BloodElf,
                BaseHealth = 3197,
                BaseMana = 2953,
                Stats = new StatBlock
                {
                    Stamina = 118,
                    Intellect = 87,
                    Strength = 123,
                    Agility = 79,
                    AttackPower = 190
                }
            },

            CharacterRace.Draenei => new CharacterBaseStats
            {
                Race = CharacterRace.Draenei,
                BaseHealth = 3197,
                BaseMana = 2953,
                Stats = new StatBlock
                {
                    Stamina = 119,
                    Intellect = 84,
                    Strength = 127,
                    Agility = 74,
                    AttackPower = 190
                }
            },

            CharacterRace.Human => new CharacterBaseStats
            {
                Race = CharacterRace.Human,
                BaseHealth = 3197,
                BaseMana = 2953,
                Stats = new StatBlock
                {
                    Stamina = 120,
                    Intellect = 83,
                    Strength = 126,
                    Agility = 77,
                    AttackPower = 190
                }
            },

            CharacterRace.Dwarf => new CharacterBaseStats
            {
                Race = CharacterRace.Dwarf,
                BaseHealth = 3197,
                BaseMana = 2953,
                Stats = new StatBlock
                {
                    Stamina = 123,
                    Intellect = 82,
                    Strength = 128,
                    Agility = 73,
                    AttackPower = 190
                }
            },

            _ => throw new ArgumentOutOfRangeException(nameof(race), race, null)
        };
    }

    private static DerivedTankStats CalculateDerivedTankStats(
    StatBlock finalStats, bool includeHolyShield
    ){
        const decimal baseDefenseSkill = 350m;
        const decimal defenseRatingPerSkill = 2.3654m;

        const decimal critReductionTarget = 5.6m;
        const decimal crushAvoidanceTarget = 102.4m;

        const decimal resilienceRatingPerCritReduction = 39.4m;

        const decimal dodgeRatingPerPercent = 18.9231m;
        const decimal parryRatingPerPercent = 31.536m;
        const decimal blockRatingPerPercent = 7.8846m;
        const decimal agilityPerDodgePercent = 25m;
        const decimal holyShieldBlockChance = 30.0m;

        // Starter baselines. These will be refined later with talents, race/class base values,
        // buffs, Holy Shield, Redoubt, and gear-specific effects.
        const decimal baseMissVsBoss = 5.0m;
        const decimal baseDodge = 0.0m;
        const decimal baseParry = 5.0m;
        const decimal baseBlock = 5.0m;

        var defenseSkillFromRating = Math.Floor(finalStats.DefenseRating / defenseRatingPerSkill);
        var defenseSkill = baseDefenseSkill + defenseSkillFromRating;

        var defenseBonusSkill = defenseSkill - baseDefenseSkill;

        // Each defense skill above base gives 0.04% reduced chance to be crit.
        // It also contributes to miss/dodge/parry/block table values.
        var defenseAvoidanceBonusPercent = defenseBonusSkill * 0.04m;

        var critReductionFromDefense = defenseBonusSkill * 0.04m;
        var critReductionFromResilience =
            finalStats.ResilienceRating / resilienceRatingPerCritReduction;

        // Paladin has no passive crit-immunity talent like feral druid.
        // Keep this field now because we will need it for druids later.
        const decimal critReductionFromTalents = 0m;

        var totalCritReduction =
            critReductionFromDefense +
            critReductionFromResilience +
            critReductionFromTalents;

        var missPercent = baseMissVsBoss + defenseAvoidanceBonusPercent;
        var dodgeFromAgility = finalStats.Agility / agilityPerDodgePercent;

        var dodgePercent =
            baseDodge +
            dodgeFromAgility +
            defenseAvoidanceBonusPercent +
            finalStats.DodgeRating / dodgeRatingPerPercent;

        var parryPercent =
            baseParry +
            defenseAvoidanceBonusPercent +
            finalStats.ParryRating / parryRatingPerPercent;

        var blockPercent =
            baseBlock +
            defenseAvoidanceBonusPercent +
            finalStats.BlockRating / blockRatingPerPercent;

        if (includeHolyShield)
        {
            blockPercent += holyShieldBlockChance;
        }

        var avoidanceWithBlock =
            missPercent +
            dodgePercent +
            parryPercent +
            blockPercent;

        return new DerivedTankStats
        {
            DefenseSkill = (int)defenseSkill,

            CritReductionTargetPercent = critReductionTarget,
            CritReductionFromDefensePercent = RoundPercent(critReductionFromDefense),
            CritReductionFromResiliencePercent = RoundPercent(critReductionFromResilience),
            CritReductionFromTalentsPercent = RoundPercent(critReductionFromTalents),
            TotalCritReductionPercent = RoundPercent(totalCritReduction),

            CritReductionNeededPercent =
                RoundPercent(Math.Max(0, critReductionTarget - totalCritReduction)),

            IsCritImmune = totalCritReduction >= critReductionTarget,

            MissPercent = RoundPercent(missPercent),
            DodgePercent = RoundPercent(dodgePercent),
            ParryPercent = RoundPercent(parryPercent),
            BlockPercent = RoundPercent(blockPercent),

            IsHolyShieldIncluded = includeHolyShield,
            HolyShieldBlockChancePercent = includeHolyShield ? holyShieldBlockChance : 0m,

            AvoidanceWithBlockPercent = RoundPercent(avoidanceWithBlock),
            CrushAvoidanceTargetPercent = crushAvoidanceTarget,
            CrushAvoidanceNeededPercent =
                RoundPercent(Math.Max(0, crushAvoidanceTarget - avoidanceWithBlock)),

            IsUncrushable = avoidanceWithBlock >= crushAvoidanceTarget
        };
    }

    private static ConvertedCharacterStats ApplyStatConversions(
        CharacterBaseStats baseStats,
        StatBlock rawStats,
        StatConversionModifiers modifiers
    )
    {
        var modifiedStats = ApplyPrimaryStatMultipliers(rawStats, modifiers);

        const int healthPerStamina = 10;
        const int manaPerIntellect = 15;
        const int armorPerAgility = 2;
        const decimal agilityPerDodgePercent = 25m;
        const decimal strengthPerBlockValue = 20m;

        var bonusStamina = modifiedStats.Stamina - baseStats.Stats.Stamina;
        var bonusIntellect = modifiedStats.Intellect - baseStats.Stats.Intellect;

        var healthFromBonusStamina = bonusStamina * healthPerStamina;
        var manaFromBonusIntellect = bonusIntellect * manaPerIntellect;

        var armorFromAgility = modifiedStats.Agility * armorPerAgility;
        var dodgeFromAgilityPercent = modifiedStats.Agility / agilityPerDodgePercent;

        var blockValueFromStrength =
            (int)Math.Floor(modifiedStats.Strength / strengthPerBlockValue);

        // Base attack power already exists in the base stats data.
        // Only add attack power from strength gained above the naked base value.
        var attackPowerFromStrength =
            (modifiedStats.Strength - baseStats.Stats.Strength) * 2;

        modifiedStats.Armor =
            ApplyMultiplier(
                modifiedStats.Armor + armorFromAgility + modifiers.FlatArmorBonus,
                modifiers.ArmorMultiplier
            );

        modifiedStats.BlockValue += blockValueFromStrength;
        modifiedStats.AttackPower += attackPowerFromStrength;

        var healthBeforeMultiplier =
            baseStats.BaseHealth +
            healthFromBonusStamina +
            modifiers.FlatHealthBonus;

        var manaBeforeMultiplier =
            baseStats.BaseMana +
            manaFromBonusIntellect +
            modifiers.FlatManaBonus;

        return new ConvertedCharacterStats
        {
            Stats = modifiedStats,

            Health = ApplyMultiplier(healthBeforeMultiplier, modifiers.HealthMultiplier),
            Mana = ApplyMultiplier(manaBeforeMultiplier, modifiers.ManaMultiplier),

            HealthFromBonusStamina = healthFromBonusStamina,
            ManaFromBonusIntellect = manaFromBonusIntellect,

            ArmorFromAgility = armorFromAgility,
            DodgeFromAgilityPercent = RoundPercent(dodgeFromAgilityPercent),

            BlockValueFromStrength = blockValueFromStrength,
            AttackPowerFromStrength = attackPowerFromStrength
        };
    }

    private static StatBlock ApplyPrimaryStatMultipliers(
        StatBlock stats,
        StatConversionModifiers modifiers
    )
    {
        return new StatBlock
        {
            Stamina = ApplyMultiplier(stats.Stamina, modifiers.StaminaMultiplier),
            Strength = ApplyMultiplier(stats.Strength, modifiers.StrengthMultiplier),
            Agility = ApplyMultiplier(stats.Agility, modifiers.AgilityMultiplier),
            Intellect = ApplyMultiplier(stats.Intellect, modifiers.IntellectMultiplier),

            Armor = stats.Armor,

            ArcaneResistance = stats.ArcaneResistance,
            FireResistance = stats.FireResistance,
            FrostResistance = stats.FrostResistance,
            NatureResistance = stats.NatureResistance,
            ShadowResistance = stats.ShadowResistance,

            DefenseRating = stats.DefenseRating,
            DodgeRating = stats.DodgeRating,
            ParryRating = stats.ParryRating,
            BlockRating = stats.BlockRating,
            BlockValue = stats.BlockValue,

            ResilienceRating = stats.ResilienceRating,

            HitRating = stats.HitRating,
            SpellHitRating = stats.SpellHitRating,
            ExpertiseRating = stats.ExpertiseRating,

            AttackPower = stats.AttackPower,
            SpellPower = stats.SpellPower,

            Mp5 = stats.Mp5
        };
    }

    private static void ApplyGemStats(
        GearStatsResponse response,
        EquippedGearItem gearItem,
        TbcItem? equippedItem,
        Dictionary<int, TbcGem> gemLookup,
        IReadOnlyList<TbcGem> validRegularGemsForMetaRequirements
    )
    {
        if (gearItem.GemIds.Count == 0)
        {
            return;
        }

        if (equippedItem is null)
        {
            response.Warnings.Add(
                $"Gems could not be applied to {gearItem.SlotKey} because no valid item is equipped."
            );
            return;
        }

        if (equippedItem.Sockets.Count == 0)
        {
            response.Warnings.Add($"{equippedItem.Name} does not have gem sockets.");
            return;
        }

        if (gearItem.GemIds.Count > equippedItem.Sockets.Count)
        {
            response.Warnings.Add(
                $"{equippedItem.Name} has {equippedItem.Sockets.Count} sockets, but {gearItem.GemIds.Count} gems were provided."
            );
        }

        var gemCountToApply = Math.Min(gearItem.GemIds.Count, equippedItem.Sockets.Count);

        var socketBonusIsActive = equippedItem.Sockets.Count > 0 &&
                                  gearItem.GemIds.Count >= equippedItem.Sockets.Count;

        for (var index = 0; index < gemCountToApply; index++)
        {
            var gemId = gearItem.GemIds[index];
            var socketColor = equippedItem.Sockets[index];

            if (!gemId.HasValue)
            {
                socketBonusIsActive = false;
                continue;
            }

            if (!gemLookup.TryGetValue(gemId.Value, out var gem))
            {
                response.Warnings.Add($"Gem ID {gemId.Value} was not found.");
                socketBonusIsActive = false;
                continue;
            }

            if (!CanGemFitSocket(gem, socketColor))
            {
                response.Warnings.Add(
                    $"{gem.Name} cannot be placed into a {socketColor} socket on {equippedItem.Name}."
                );
                socketBonusIsActive = false;
                continue;
            }

            var gemStatsAreActive = true;

            if (gem.Color == SocketColor.Meta &&
                !AreMetaRequirementsMet(gem, validRegularGemsForMetaRequirements))
            {
                gemStatsAreActive = false;

                response.Warnings.Add(
                    $"{gem.Name} is socketed, but its meta requirements are not met: {GetMetaRequirementSummary(gem)}."
                );
            }

            if (gemStatsAreActive)
            {
                AddStats(response.GearStats, gem.Stats);
            }

            if (!DoesGemMatchSocket(gem, socketColor))
            {
                socketBonusIsActive = false;
            }
        }

        if (socketBonusIsActive)
        {
            AddStats(response.GearStats, equippedItem.SocketBonus);
        }
    }

    private static bool CanGemFitSocket(TbcGem gem, SocketColor socketColor)
    {
        if (socketColor == SocketColor.Meta)
        {
            return gem.Color == SocketColor.Meta;
        }

        return gem.Color != SocketColor.Meta;
    }

    private static bool DoesGemMatchSocket(TbcGem gem, SocketColor socketColor)
    {
        if (socketColor == SocketColor.Meta)
        {
            return gem.Color == SocketColor.Meta;
        }

        return gem.MatchesSocketColors.Contains(socketColor);
    }

    private static List<TbcGem> GetValidRegularGemsForMetaRequirements(
        IReadOnlyList<EquippedGearItem> equippedGear,
        Dictionary<int, TbcItem> itemLookup,
        Dictionary<int, TbcGem> gemLookup
    )
    {
        var validRegularGems = new List<TbcGem>();

        foreach (var gearItem in equippedGear)
        {
            if (!gearItem.ItemId.HasValue ||
                !itemLookup.TryGetValue(gearItem.ItemId.Value, out var equippedItem))
            {
                continue;
            }

            if (equippedItem.Sockets.Count == 0 || gearItem.GemIds.Count == 0)
            {
                continue;
            }

            var gemCountToCheck = Math.Min(
                gearItem.GemIds.Count,
                equippedItem.Sockets.Count
            );

            for (var index = 0; index < gemCountToCheck; index++)
            {
                var gemId = gearItem.GemIds[index];

                if (!gemId.HasValue)
                {
                    continue;
                }

                if (!gemLookup.TryGetValue(gemId.Value, out var gem))
                {
                    continue;
                }

                if (gem.Color == SocketColor.Meta)
                {
                    continue;
                }

                var socketColor = equippedItem.Sockets[index];

                if (!CanGemFitSocket(gem, socketColor))
                {
                    continue;
                }

                validRegularGems.Add(gem);
            }
        }

        return validRegularGems;
    }

    private static bool AreMetaRequirementsMet(
        TbcGem metaGem,
        IReadOnlyList<TbcGem> validRegularGems
    )
    {
        if (metaGem.Color != SocketColor.Meta)
        {
            return true;
        }

        if (metaGem.MetaRequirements.Count == 0)
        {
            return true;
        }

        return metaGem.MetaRequirements.All(requirement =>
            validRegularGems.Count(gem =>
                gem.MatchesSocketColors.Contains(requirement.Color)
            ) >= requirement.Count
        );
    }

    private static string GetMetaRequirementSummary(TbcGem metaGem)
    {
        if (metaGem.MetaRequirements.Count == 0)
        {
            return metaGem.MetaRequirementDescription ?? "No requirement listed";
        }

        return string.Join(
            ", ",
            metaGem.MetaRequirements.Select(requirement =>
                $"{requirement.Count} {requirement.Color} gem(s)"
            )
        );
    }

    private static int ApplyMultiplier(int value, decimal multiplier)
    {
        return (int)Math.Floor(value * multiplier);
    }

    private static decimal RoundPercent(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    private static List<int> GetEquippedItemIds(GearStatsRequest request)
    {
        if (request.EquippedGear.Count > 0)
        {
            return request.EquippedGear
                .Where(gearItem => gearItem.ItemId.HasValue)
                .Select(gearItem => gearItem.ItemId!.Value)
                .ToList();
        }

        return request.EquippedItemIds;
    }

    private static void ApplySetBonuses(
        GearStatsResponse response,
        IReadOnlyList<TbcItem> equippedItems,
        Dictionary<int, TbcItemSet> itemSetLookup
    )
    {
        var equippedSetGroups = equippedItems
            .Where(item => item.SetId.HasValue)
            .GroupBy(item => item.SetId!.Value);

        foreach (var setGroup in equippedSetGroups)
        {
            var setId = setGroup.Key;

            if (!itemSetLookup.TryGetValue(setId, out var itemSet))
            {
                response.Warnings.Add($"Item set ID {setId} was not found.");
                continue;
            }

            var piecesEquipped = setGroup
                .Select(item => item.Id)
                .Distinct()
                .Count();

            var activeBonuses = itemSet.Bonuses
                .Where(bonus => bonus.PiecesRequired <= piecesEquipped)
                .OrderBy(bonus => bonus.PiecesRequired);

            foreach (var bonus in activeBonuses)
            {
                AddStats(response.GearStats, bonus.Stats);

                response.ActiveSetBonuses.Add(new ActiveItemSetBonus
                {
                    SetId = itemSet.Id,
                    SetName = itemSet.Name,
                    PiecesEquipped = piecesEquipped,
                    PiecesRequired = bonus.PiecesRequired,
                    Description = bonus.Description,
                    Stats = bonus.Stats,
                    EffectKeys = bonus.EffectKeys
                });
            }
        }
    }

    private static PhysicalMitigationStats CalculatePhysicalMitigationStats(
        int health,
        StatBlock finalStats,
        int attackerLevel
    )
    {
        const decimal maxArmorDamageReductionPercent = 75m;

        var armor = Math.Max(finalStats.Armor, 0);
        var armorConstant = GetArmorConstant(attackerLevel);

        var armorDamageReductionPercent = 0m;

        if (armor > 0 && armorConstant > 0)
        {
            armorDamageReductionPercent =
                armor / (armor + armorConstant) * 100m;
        }

        armorDamageReductionPercent = Math.Min(
            armorDamageReductionPercent,
            maxArmorDamageReductionPercent
        );

        armorDamageReductionPercent = Math.Max(armorDamageReductionPercent, 0m);

        var damageTakenMultiplier = 1m - armorDamageReductionPercent / 100m;

        var physicalEffectiveHealth =
            damageTakenMultiplier > 0
                ? (int)Math.Floor(health / damageTakenMultiplier)
                : health;

        var armorCap = (int)Math.Ceiling(GetArmorNeededForMitigationPercent(
            maxArmorDamageReductionPercent,
            armorConstant
        ));

        return new PhysicalMitigationStats
        {
            AttackerLevel = attackerLevel,
            Armor = armor,
            ArmorDamageReductionPercent = RoundPercent(armorDamageReductionPercent),
            DamageTakenMultiplier = RoundPercent(damageTakenMultiplier),
            PhysicalEffectiveHealth = physicalEffectiveHealth,
            ArmorCap = armorCap,
            ArmorNeededForCap = Math.Max(armorCap - armor, 0)
        };
    }

    private static MagicMitigationStats CalculateMagicMitigationStats(
        int health,
        StatBlock finalStats,
        int attackerLevel
    )
    {
        return new MagicMitigationStats
        {
            AttackerLevel = attackerLevel,
            Schools =
            [
                CalculateResistanceMitigationStats(
                "Arcane",
                finalStats.ArcaneResistance,
                health,
                attackerLevel
            ),
            CalculateResistanceMitigationStats(
                "Fire",
                finalStats.FireResistance,
                health,
                attackerLevel
            ),
            CalculateResistanceMitigationStats(
                "Frost",
                finalStats.FrostResistance,
                health,
                attackerLevel
            ),
            CalculateResistanceMitigationStats(
                "Nature",
                finalStats.NatureResistance,
                health,
                attackerLevel
            ),
            CalculateResistanceMitigationStats(
                "Shadow",
                finalStats.ShadowResistance,
                health,
                attackerLevel
            )
            ]
        };
    }

    private static ResistanceMitigationStats CalculateResistanceMitigationStats(
        string school,
        int resistance,
        int health,
        int attackerLevel
    )
    {
        const decimal maxAverageDamageReductionPercent = 75m;

        var resistanceCap = Math.Max(attackerLevel * 5, 0);
        var cappedResistance = Math.Clamp(resistance, 0, resistanceCap);

        var averageDamageReductionPercent = 0m;

        if (resistanceCap > 0)
        {
            averageDamageReductionPercent =
                cappedResistance / (decimal)resistanceCap *
                maxAverageDamageReductionPercent;
        }

        averageDamageReductionPercent = Math.Min(
            averageDamageReductionPercent,
            maxAverageDamageReductionPercent
        );

        var damageTakenMultiplier = 1m - averageDamageReductionPercent / 100m;

        var magicEffectiveHealth =
            damageTakenMultiplier > 0
                ? (int)Math.Floor(health / damageTakenMultiplier)
                : health;

        return new ResistanceMitigationStats
        {
            School = school,
            Resistance = resistance,
            ResistanceCap = resistanceCap,
            ResistanceNeededForCap = Math.Max(resistanceCap - resistance, 0),
            AverageDamageReductionPercent = RoundPercent(averageDamageReductionPercent),
            DamageTakenMultiplier = RoundPercent(damageTakenMultiplier),
            MagicEffectiveHealth = magicEffectiveHealth
        };
    }

    private static decimal GetArmorConstant(int attackerLevel)
    {
        // TBC level 60+ armor constant.
        // Level 73 raid boss: 467.5 * 73 - 22167.5 = 11960.
        return 467.5m * attackerLevel - 22167.5m;
    }

    private static decimal GetArmorNeededForMitigationPercent(
        decimal mitigationPercent,
        decimal armorConstant
    )
    {
        var mitigation = mitigationPercent / 100m;

        if (mitigation <= 0m || mitigation >= 1m)
        {
            return 0m;
        }

        return mitigation * armorConstant / (1m - mitigation);
    }
}