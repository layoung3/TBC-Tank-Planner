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

        foreach (var itemId in request.EquippedItemIds)
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
                EquippedItemIds = request.EquippedItemIds
            }
        );

        var baseStats = GetProtectionPaladinBaseStats(request.Race);

        var finalStats = new StatBlock();

        AddStats(finalStats, baseStats.Stats);
        AddStats(finalStats, gearStatsResponse.GearStats);

        var response = new FinalCharacterStatsResponse
        {
            Race = request.Race,
            BaseStats = baseStats,
            GearStats = gearStatsResponse.GearStats,
            FinalStats = finalStats,
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
}