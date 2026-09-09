using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Domain.Talents;

public class CharacterTalentBuild
{
    public TankClass Class { get; set; } = TankClass.ProtectionPaladin;

    public Dictionary<string, int> TalentRanks { get; set; } = [];
}