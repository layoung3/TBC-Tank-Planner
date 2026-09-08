using TbcTankPlanner.Domain.Calculations;
using TbcTankPlanner.Domain.Stats;

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
}