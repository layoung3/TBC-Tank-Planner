using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Enchants;

public class TbcEnchant
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public List<ItemSlot> AllowedSlots { get; set; } = [];

    public int Phase { get; set; }

    public string Source { get; set; } = "";

    public StatBlock Stats { get; set; } = new();

    public bool IsCustom { get; set; }
}