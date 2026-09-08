using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Services;
using TbcTankPlanner.Domain.Calculations;

namespace TbcTankPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalculationsController : ControllerBase
{
    private readonly CalculationService _calculationService;

    public CalculationsController(CalculationService calculationService)
    {
        _calculationService = calculationService;
    }

    [HttpPost("gear-stats")]
    public async Task<ActionResult<GearStatsResponse>> CalculateGearStats(
        GearStatsRequest request
    )
    {
        var response = await _calculationService.CalculateGearStatsAsync(request);

        return Ok(response);
    }

    [HttpPost("final-character-stats")]
    public async Task<ActionResult<FinalCharacterStatsResponse>> CalculateFinalCharacterStats(
    [FromBody] FinalCharacterStatsRequest request
)
    {
        var response = await _calculationService.CalculateFinalCharacterStatsAsync(request);

        return Ok(response);
    }
}