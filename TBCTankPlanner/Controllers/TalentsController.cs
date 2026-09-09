using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Domain.Talents;
using TbcTankPlanner.Services;

namespace TbcTankPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TalentsController : ControllerBase
{
    private readonly TalentDataService _talentDataService;

    public TalentsController(TalentDataService talentDataService)
    {
        _talentDataService = talentDataService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TalentTreeDefinition>>> GetTalents(
        [FromQuery] TankClass tankClass = TankClass.ProtectionPaladin
    )
    {
        var talentTrees = await _talentDataService.GetTalentTreesAsync(tankClass);

        return Ok(talentTrees);
    }
}