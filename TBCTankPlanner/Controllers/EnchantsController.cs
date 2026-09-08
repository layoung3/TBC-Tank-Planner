using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Domain.Enchants;
using TbcTankPlanner.Domain.Items;
using TbcTankPlanner.Services;

namespace TbcTankPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnchantsController : ControllerBase
{
    private readonly EnchantDataService _enchantDataService;

    public EnchantsController(EnchantDataService enchantDataService)
    {
        _enchantDataService = enchantDataService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TbcEnchant>>> GetEnchants(
        [FromQuery] ItemSlot? slot = null,
        [FromQuery] int? phase = null
    )
    {
        var enchants = await _enchantDataService.GetEnchantsAsync(slot, phase);

        return Ok(enchants);
    }
}