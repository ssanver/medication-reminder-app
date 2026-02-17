using api.contracts;
using api_application.medicine_catalog_application;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/medicine-catalog")]
public sealed class MedicineCatalogController(MedicineCatalogApplicationService applicationService) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyCollection<MedicineCatalogSearchResponse>>> Search(
        [FromQuery] string? query,
        [FromQuery] int take = 20)
    {
        try
        {
            var items = await applicationService.SearchAsync(new MedicineCatalogSearchQuery(query ?? string.Empty, take));
            return Ok(items.Select(item => new MedicineCatalogSearchResponse
            {
                Id = item.Id,
                MedicineName = item.MedicineName,
                Unit = item.Unit,
                Manufacturer = item.Manufacturer,
                ActiveIngredient = item.ActiveIngredient,
            }).ToArray());
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
