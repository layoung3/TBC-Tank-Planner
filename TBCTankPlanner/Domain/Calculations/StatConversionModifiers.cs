namespace TbcTankPlanner.Domain.Calculations;

public class StatConversionModifiers
{
    public decimal StaminaMultiplier { get; set; } = 1m;
    public decimal StrengthMultiplier { get; set; } = 1m;
    public decimal AgilityMultiplier { get; set; } = 1m;
    public decimal IntellectMultiplier { get; set; } = 1m;

    public decimal ArmorMultiplier { get; set; } = 1m;
    public decimal HealthMultiplier { get; set; } = 1m;
    public decimal ManaMultiplier { get; set; } = 1m;

    public int FlatHealthBonus { get; set; }
    public int FlatManaBonus { get; set; }
    public int FlatArmorBonus { get; set; }

    public int DefenseSkillBonus { get; set; }
    public int ExpertiseSkillBonus { get; set; }

    public decimal DodgePercentBonus { get; set; }
    public decimal ParryPercentBonus { get; set; }
    public decimal BlockPercentBonus { get; set; }
    public decimal MissPercentBonus { get; set; }
    public decimal CritReductionPercentBonus { get; set; }

    public decimal BlockValueMultiplier { get; set; } = 1m;
    public decimal GlobalDamageTakenMultiplier { get; set; } = 1m;
    public decimal DamageDoneMultiplier { get; set; } = 1m;
}
