using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.ItemSets;

public class ActiveItemSetBonus
{
    public int SetId { get; set; }

    public string SetName { get; set; } = "";

    public int PiecesEquipped { get; set; }

    public int PiecesRequired { get; set; }

    public string Description { get; set; } = "";

    public StatBlock Stats { get; set; } = new();

    public List<string> EffectKeys { get; set; } = [];
}