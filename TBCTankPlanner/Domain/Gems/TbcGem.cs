using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Gems;

public class TbcGem
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public string? IconUrl { get; set; }

    public SocketColor Color { get; set; }

    public List<SocketColor> MatchesSocketColors { get; set; } = [];

    public int Phase { get; set; }

    public string Quality { get; set; } = "";

    public string Source { get; set; } = "";

    public StatBlock Stats { get; set; } = new();

    public string? EffectDescription { get; set; }

    public string? MetaRequirementDescription { get; set; }

    public bool IsCustom { get; set; }
}