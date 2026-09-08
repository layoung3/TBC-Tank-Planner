using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Domain.Calculations;

public class EquippedGearItem
{
    public string SlotKey { get; set; } = "";

    public ItemSlot Slot { get; set; }

    public int? ItemId { get; set; }

    public int? EnchantId { get; set; }

    public List<int> GemIds { get; set; } = [];
}