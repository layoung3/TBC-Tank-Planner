using System.Text.Json;
using System.Text.Json.Serialization;
using TbcTankPlanner.Domain.Gems;
using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Services;

public class GemDataService
{
    private readonly IWebHostEnvironment _environment;
    private readonly JsonSerializerOptions _jsonOptions;

    private List<TbcGem>? _gems;

    public GemDataService(IWebHostEnvironment environment)
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

    public async Task<IReadOnlyList<TbcGem>> GetAllGemsAsync()
    {
        if (_gems is not null)
        {
            return _gems;
        }

        var path = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "gems",
            "protection-paladin-gems.json"
        );

        if (!File.Exists(path))
        {
            _gems = [];
            return _gems;
        }

        var json = await File.ReadAllTextAsync(path);

        _gems = JsonSerializer.Deserialize<List<TbcGem>>(json, _jsonOptions) ?? [];

        return _gems;
    }

    public async Task<IReadOnlyList<TbcGem>> GetGemsAsync(
        SocketColor? socketColor,
        int? phase,
        bool matchingOnly,
        bool includeEpicGems
    )
    {
        var gems = await GetAllGemsAsync();

        var query = gems.AsEnumerable();

        if (phase is not null)
        {
            query = query.Where(gem => gem.Phase <= phase.Value);
        }

        if (!includeEpicGems)
        {
            query = query.Where(gem =>
                !string.Equals(gem.Quality, "Epic", StringComparison.OrdinalIgnoreCase)
            );
        }

        if (socketColor is not null)
        {
            if (socketColor.Value == SocketColor.Meta)
            {
                query = query.Where(gem => gem.Color == SocketColor.Meta);
            }
            else if (matchingOnly)
            {
                query = query.Where(gem =>
                    gem.Color != SocketColor.Meta &&
                    gem.MatchesSocketColors.Contains(socketColor.Value)
                );
            }
            else
            {
                // In WoW, regular gems can be placed into regular colored sockets,
                // even if they do not match the socket bonus color.
                query = query.Where(gem => gem.Color != SocketColor.Meta);
            }
        }

        return query
            .OrderBy(gem => gem.Color)
            .ThenBy(gem => gem.Name)
            .ToList();
    }
}