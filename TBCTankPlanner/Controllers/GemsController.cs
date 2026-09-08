using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Domain.Gems;
using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Services;

namespace TbcTankPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GemsController : ControllerBase
{
    private readonly GemDataService _gemDataService;

    public GemsController(GemDataService gemDataService)
    {
        _gemDataService = gemDataService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TbcGem>>> GetGems(
        [FromQuery] SocketColor? socketColor = null,
        [FromQuery] int? phase = null,
        [FromQuery] bool matchingOnly = false,
        [FromQuery] bool includeEpicGems = true
    )
    {
        var gems = await _gemDataService.GetGemsAsync(
            socketColor,
            phase,
            matchingOnly,
            includeEpicGems
        );

        return Ok(gems);
    }
}