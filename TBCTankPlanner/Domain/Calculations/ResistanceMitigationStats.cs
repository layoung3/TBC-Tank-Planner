namespace TbcTankPlanner.Domain.Calculations;

public class ResistanceMitigationStats
{
    public string School { get; set; } = "";

    public int Resistance { get; set; }

    public int ResistanceCap { get; set; }

    public int ResistanceNeededForCap { get; set; }

    public decimal AverageDamageReductionPercent { get; set; }

    public decimal DamageTakenMultiplier { get; set; }

    public int MagicEffectiveHealth { get; set; }
}