using TbcTankPlanner.Domain.ItemSets;
using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Calculations;

public class GearStatsResponse
{
    public StatBlock GearStats { get; set; } = new();

    public List<ActiveItemSetBonus> ActiveSetBonuses { get; set; } = [];

    public List<string> Warnings { get; set; } = [];
}