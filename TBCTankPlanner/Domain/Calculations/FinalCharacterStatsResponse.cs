using TbcTankPlanner.Domain.Stats;
using TbcTankPlanner.Domain.Characters;

namespace TbcTankPlanner.Domain.Calculations;

public class FinalCharacterStatsResponse
{
    public CharacterRace Race { get; set; }

    public int Health { get; set; }
    public int Mana { get; set; }

    public CharacterBaseStats BaseStats { get; set; } = new();

    public StatBlock GearStats { get; set; } = new();

    public StatBlock FinalStats { get; set; } = new();

    public List<string> Warnings { get; set; } = [];
}