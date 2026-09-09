using System.Text.Json;
using System.Text.Json.Serialization;
using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Domain.Talents;

namespace TbcTankPlanner.Services;

public class TalentDataService
{
    private readonly IWebHostEnvironment _environment;
    private readonly JsonSerializerOptions _jsonOptions;

    private List<TalentTreeDefinition>? _protectionPaladinTalents;

    public TalentDataService(IWebHostEnvironment environment)
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

    public async Task<IReadOnlyList<TalentTreeDefinition>> GetTalentTreesAsync(
        TankClass tankClass
    )
    {
        return tankClass switch
        {
            TankClass.ProtectionPaladin => await GetProtectionPaladinTalentTreesAsync(),
            _ => []
        };
    }

    private async Task<IReadOnlyList<TalentTreeDefinition>> GetProtectionPaladinTalentTreesAsync()
    {
        if (_protectionPaladinTalents is not null)
        {
            return _protectionPaladinTalents;
        }

        var path = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "talents",
            "protection-paladin-talents.json"
        );

        if (!File.Exists(path))
        {
            _protectionPaladinTalents = [];
            return _protectionPaladinTalents;
        }

        var json = await File.ReadAllTextAsync(path);

        _protectionPaladinTalents =
            JsonSerializer.Deserialize<List<TalentTreeDefinition>>(
                json,
                _jsonOptions
            ) ?? [];

        return _protectionPaladinTalents;
    }
}