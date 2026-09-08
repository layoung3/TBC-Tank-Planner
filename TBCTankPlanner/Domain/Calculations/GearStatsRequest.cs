namespace TbcTankPlanner.Domain.Calculations;

public class GearStatsRequest
{
    public List<EquippedGearItem> EquippedGear { get; set; } = [];

    public List<int> EquippedItemIds { get; set; } = [];
}