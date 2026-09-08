using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Calculations;

public class ConvertedCharacterStats
{
    public StatBlock Stats { get; set; } = new();

    public int Health { get; set; }
    public int Mana { get; set; }

    public int HealthFromBonusStamina { get; set; }
    public int ManaFromBonusIntellect { get; set; }

    public int ArmorFromAgility { get; set; }
    public decimal DodgeFromAgilityPercent { get; set; }

    public int BlockValueFromStrength { get; set; }
    public int AttackPowerFromStrength { get; set; }
}