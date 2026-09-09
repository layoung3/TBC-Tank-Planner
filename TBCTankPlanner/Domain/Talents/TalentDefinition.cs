namespace TbcTankPlanner.Domain.Talents;

public class TalentDefinition
{
    public string Key { get; set; } = "";

    public string Name { get; set; } = "";

    public string TreeKey { get; set; } = "";

    public int Row { get; set; }

    public int Column { get; set; }

    public int MaxRank { get; set; }

    public string Description { get; set; } = "";

    public List<string> EffectKeys { get; set; } = [];

    public List<TalentRankEffect> RankEffects { get; set; } = [];
}