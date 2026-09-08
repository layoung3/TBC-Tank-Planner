using System.Text.Json;
using System.Text.Json.Serialization;
using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Services;

public class ItemDataService
{
    private readonly IWebHostEnvironment _environment;
    private readonly JsonSerializerOptions _jsonOptions;

    private List<TbcItem>? _items;

    public ItemDataService(IWebHostEnvironment environment)
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

    public async Task<IReadOnlyList<TbcItem>> GetAllItemsAsync()
    {
        if (_items is not null)
        {
            return _items;
        }

        var path = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "items",
            "protection-paladin-items.json"
        );

        if (!File.Exists(path))
        {
            _items = [];
            return _items;
        }

        var json = await File.ReadAllTextAsync(path);

        _items = JsonSerializer.Deserialize<List<TbcItem>>(json, _jsonOptions) ?? [];

        return _items;
    }

    public async Task<IReadOnlyList<TbcItem>> GetItemsAsync(
        TankClass tankClass,
        ItemSlot? slot,
        int? phase
    )
    {
        var items = await GetAllItemsAsync();

        var query = items
            .Where(item => item.AllowedClasses.Contains(tankClass));

        if (slot is not null)
        {
            query = query.Where(item => item.Slot == slot);
        }

        if (phase is not null)
        {
            query = query.Where(item => item.Phase <= phase.Value);
        }

        return query
            .OrderBy(item => item.Slot)
            .ThenBy(item => item.Name)
            .ToList();
    }
}