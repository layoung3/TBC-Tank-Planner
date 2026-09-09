using System.Text.Json;
using System.Text.Json.Serialization;
using TbcTankPlanner.Domain.ItemSets;

namespace TbcTankPlanner.Services;

public class ItemSetDataService
{
    private readonly IWebHostEnvironment _environment;
    private readonly JsonSerializerOptions _jsonOptions;

    private List<TbcItemSet>? _itemSets;

    public ItemSetDataService(IWebHostEnvironment environment)
    {
        _environment = environment;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters =
            {
                new JsonStringEnumConverter()
            }
        };
    }

    public async Task<IReadOnlyList<TbcItemSet>> GetAllItemSetsAsync()
    {
        if (_itemSets is not null)
        {
            return _itemSets;
        }

        var path = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "item-sets",
            "protection-paladin-item-sets.json"
        );

        if (!File.Exists(path))
        {
            _itemSets = [];
            return _itemSets;
        }

        var json = await File.ReadAllTextAsync(path);

        _itemSets = JsonSerializer.Deserialize<List<TbcItemSet>>(
            json,
            _jsonOptions
        ) ?? [];

        return _itemSets;
    }
}