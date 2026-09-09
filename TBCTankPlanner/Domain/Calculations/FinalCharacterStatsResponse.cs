using TbcTankPlanner.Domain.Characters;
using TbcTankPlanner.Domain.ItemSets;
using TbcTankPlanner.Domain.Stats;

namespace TbcTankPlanner.Domain.Calculations;

public class FinalCharacterStatsResponse
{
    public CharacterRace Race { get; set; }

    public int Health { get; set; }
    public int Mana { get; set; }

    public List<ActiveItemSetBonus> ActiveSetBonuses { get; set; } = [];

    public CharacterBaseStats BaseStats { get; set; } = new();

    public StatBlock GearStats { get; set; } = new();

    public StatBlock FinalStats { get; set; } = new();

    public ConvertedCharacterStats ConvertedStats { get; set; } = new();

    public DerivedTankStats DerivedTankStats { get; set; } = new();

    public PhysicalMitigationStats PhysicalMitigationStats { get; set; } = new();

    public MagicMitigationStats MagicMitigationStats { get; set; } = new();

    public List<string> Warnings { get; set; } = [];
}