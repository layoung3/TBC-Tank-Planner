using System.Text.Json;
using System.Text.Json.Serialization;
using TbcTankPlanner.Domain.Enchants;
using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Services;

public class EnchantDataService
{
    private readonly IWebHostEnvironment _environment;
    private readonly JsonSerializerOptions _jsonOptions;

    private List<TbcEnchant>? _enchants;

    public EnchantDataService(IWebHostEnvironment environment)
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

    public async Task<IReadOnlyList<TbcEnchant>> GetAllEnchantsAsync()
    {
        if (_enchants is not null)
        {
            return _enchants;
        }

        var path = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "enchants",
            "protection-paladin-enchants.json"
        );

        if (!File.Exists(path))
        {
            _enchants = [];
            return _enchants;
        }

        var json = await File.ReadAllTextAsync(path);

        _enchants = JsonSerializer.Deserialize<List<TbcEnchant>>(json, _jsonOptions) ?? [];

        return _enchants;
    }

    public async Task<IReadOnlyList<TbcEnchant>> GetEnchantsAsync(
        ItemSlot? slot,
        int? phase
    )
    {
        var enchants = await GetAllEnchantsAsync();

        var query = enchants.AsEnumerable();

        if (slot is not null)
        {
            query = query.Where(enchant => enchant.AllowedSlots.Contains(slot.Value));
        }

        if (phase is not null)
        {
            query = query.Where(enchant => enchant.Phase <= phase.Value);
        }

        return query
            .OrderBy(enchant => enchant.Name)
            .ToList();
    }
}