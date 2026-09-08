using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Characters;

public class CharacterBaseStats
{
    public CharacterRace Race { get; set; }

    public int BaseHealth { get; set; }
    public int BaseMana { get; set; }

    public StatBlock Stats { get; set; } = new();
}