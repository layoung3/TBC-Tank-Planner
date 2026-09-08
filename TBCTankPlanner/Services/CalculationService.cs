using TbcTankPlanner.Domain.Calculations;
using TbcTankPlanner.Domain.Stats;
using TbcTankPlanner.Domain.Characters;

namespace TbcTankPlanner.Services;

public class CalculationService
{
    private readonly ItemDataService _itemDataService;

    public CalculationService(ItemDataService itemDataService)
    {
        _itemDataService = itemDataService;
    }

    public async Task<GearStatsResponse> CalculateGearStatsAsync(GearStatsRequest request)
    {
        var allItems = await _itemDataService.GetAllItemsAsync();

        var itemLookup = allItems.ToDictionary(item => item.Id);

        var response = new GearStatsResponse();

        foreach (var itemId in GetEquippedItemIds(request))
        {
            if (!itemLookup.TryGetValue(itemId, out var item))
            {
                response.Warnings.Add($"Item ID {itemId} was not found.");
                continue;
            }

            AddStats(response.GearStats, item.Stats);
        }

        return response;
    }

    private static void AddStats(StatBlock total, StatBlock stats)
    {
        total.Stamina += stats.Stamina;
        total.Strength += stats.Strength;
        total.Agility += stats.Agility;
        total.Intellect += stats.Intellect;

        total.Armor += stats.Armor;

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

        var finalStats = new StatBlock();

        AddStats(finalStats, baseStats.Stats);
        AddStats(finalStats, gearStatsResponse.GearStats);

        var derivedTankStats = CalculateDerivedTankStats(
            finalStats,
            request.IncludeHolyShield
        );

        var response = new FinalCharacterStatsResponse
        {
            Race = request.Race,
            BaseStats = baseStats,
            GearStats = gearStatsResponse.GearStats,
            FinalStats = finalStats,
            DerivedTankStats = derivedTankStats,
            Warnings = gearStatsResponse.Warnings
        };

        // Starter model:
        // BaseHealth already represents the naked level 70 character.
        // Gear stamina is added as 10 health per stamina.
        response.Health = baseStats.BaseHealth + gearStatsResponse.GearStats.Stamina * 10;

        // Starter model:
        // BaseMana already represents the naked level 70 character.
        // Gear intellect is added as 15 mana per intellect.
        response.Mana = baseStats.BaseMana + gearStatsResponse.GearStats.Intellect * 15;

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
        const decimal holyShieldBlockChance = 30.0m;

        // Starter baselines. These will be refined later with talents, race/class base values,
        // buffs, Holy Shield, Redoubt, and gear-specific effects.
        const decimal baseMissVsBoss = 5.0m;
        const decimal baseDodge = 3.0m;
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
        var dodgePercent =
            baseDodge +
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
}