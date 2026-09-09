using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.ItemSets;

public class TbcItemSetBonus
{
    public int PiecesRequired { get; set; }

    public string Description { get; set; } = "";

    public StatBlock Stats { get; set; } = new();

    public List<string> EffectKeys { get; set; } = [];
}