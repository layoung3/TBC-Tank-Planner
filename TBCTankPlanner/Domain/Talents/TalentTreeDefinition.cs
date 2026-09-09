using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Domain.Talents;

public class TalentTreeDefinition
{
    public TankClass Class { get; set; }

    public string TreeKey { get; set; } = "";

    public string Name { get; set; } = "";

    public List<TalentDefinition> Talents { get; set; } = [];
}