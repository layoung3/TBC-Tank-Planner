using TbcTankPlanner.Domain.Characters;
using TbcTankPlanner.Domain.Talents;

namespace TbcTankPlanner.Domain.Calculations;

public class FinalCharacterStatsRequest
{
    public CharacterRace Race { get; set; } = CharacterRace.BloodElf;

    public List<EquippedGearItem> EquippedGear { get; set; } = [];

    public List<int> EquippedItemIds { get; set; } = [];

    public CharacterTalentBuild TalentBuild { get; set; } = new();

    public bool IncludeHolyShield { get; set; }

    public bool IncludeRighteousFury { get; set; } = true;

    public EncounterSettings Encounter { get; set; } = new();
}
