using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Domain.Gems;

public class GemColorRequirement
{
    public SocketColor Color { get; set; }

    public int Count { get; set; }
}