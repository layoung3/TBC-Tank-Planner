namespace TbcTankPlanner.Domain.Talents;

public class ActiveTalentEffect
{
    public string Key { get; set; } = "";

    public string Name { get; set; } = "";

    public string TreeKey { get; set; } = "";

    public int Rank { get; set; }

    public int MaxRank { get; set; }

    public string Description { get; set; } = "";

    public List<string> EffectKeys { get; set; } = [];

    public List<string> AppliesTo { get; set; } = [];
}