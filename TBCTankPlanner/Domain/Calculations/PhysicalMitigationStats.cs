namespace TbcTankPlanner.Domain.Calculations;

public class PhysicalMitigationStats
{
    public int AttackerLevel { get; set; } = 73;

    public int Armor { get; set; }

    public decimal ArmorDamageReductionPercent { get; set; }

    public decimal DamageTakenMultiplier { get; set; }

    public int PhysicalEffectiveHealth { get; set; }

    public int ArmorCap { get; set; }

    public int ArmorNeededForCap { get; set; }
}