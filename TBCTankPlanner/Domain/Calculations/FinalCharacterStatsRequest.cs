using TbcTankPlanner.Domain.Characters;

namespace TbcTankPlanner.Domain.Calculations;

public class FinalCharacterStatsRequest
{
    public CharacterRace Race { get; set; } = CharacterRace.BloodElf;

    public List<int> EquippedItemIds { get; set; } = [];

    public bool IncludeHolyShield { get; set; }
}