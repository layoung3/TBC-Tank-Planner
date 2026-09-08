using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Domain.Calculations;
using TbcTankPlanner.Services;

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
}