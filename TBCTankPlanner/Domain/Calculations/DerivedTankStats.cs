namespace TbcTankPlanner.Domain.Calculations;

public class DerivedTankStats
{
    public int DefenseSkill { get; set; }

    public decimal CritReductionTargetPercent { get; set; }

    public decimal CritReductionFromDefensePercent { get; set; }
    public decimal CritReductionFromResiliencePercent { get; set; }
    public decimal CritReductionFromTalentsPercent { get; set; }
    public decimal TotalCritReductionPercent { get; set; }

    public decimal CritReductionNeededPercent { get; set; }
    public bool IsCritImmune { get; set; }

    public decimal MissPercent { get; set; }
    public decimal DodgePercent { get; set; }
    public decimal ParryPercent { get; set; }
    public decimal BlockPercent { get; set; }

    public bool IsHolyShieldIncluded { get; set; }
    public decimal HolyShieldBlockChancePercent { get; set; }

    public decimal AvoidanceWithBlockPercent { get; set; }
    public decimal CrushAvoidanceTargetPercent { get; set; }
    public decimal CrushAvoidanceNeededPercent { get; set; }
    public bool IsUncrushable { get; set; }
}