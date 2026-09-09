namespace TbcTankPlanner.Domain.Calculations;

public class MagicMitigationStats
{
    public int AttackerLevel { get; set; } = 73;

    public List<ResistanceMitigationStats> Schools { get; set; } = [];
}