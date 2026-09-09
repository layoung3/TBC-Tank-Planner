using TbcTankPlanner.Domain.Stats;
using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Domain.Items;

public class TbcItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? IconUrl { get; set; }

    public ItemSlot Slot { get; set; }

    public List<TankClass> AllowedClasses { get; set; } = [];

    public int Phase { get; set; }

    public string Source { get; set; } = "";
    public string Quality { get; set; } = "";

    public int? SetId { get; set; }
    public string? SetName { get; set; }

    public StatBlock Stats { get; set; } = new();

    public List<SocketColor> Sockets { get; set; } = [];

    public StatBlock SocketBonus { get; set; } = new();

    public bool IsCustom { get; set; }
}