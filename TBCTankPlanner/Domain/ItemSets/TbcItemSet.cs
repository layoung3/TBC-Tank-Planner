namespace TbcTankPlanner.Domain.ItemSets;

public class TbcItemSet
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    public List<TbcItemSetBonus> Bonuses { get; set; } = [];
}