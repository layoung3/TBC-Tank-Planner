using Microsoft.AspNetCore.Mvc;
using TbcTankPlanner.Api.Domain.Items;
using TbcTankPlanner.Api.Services;
using TbcTankPlanner.Domain.Items;

namespace TbcTankPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly ItemDataService _itemDataService;

    public ItemsController(ItemDataService itemDataService)
    {
        _itemDataService = itemDataService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TbcItem>>> GetItems(
        [FromQuery] TankClass tankClass = TankClass.ProtectionPaladin,
        [FromQuery] ItemSlot? slot = null,
        [FromQuery] int? phase = null
    )
    {
        var items = await _itemDataService.GetItemsAsync(tankClass, slot, phase);

        return Ok(items);
    }
}