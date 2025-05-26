using Microsoft.AspNetCore.Mvc;

namespace TiFlinks.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HeartbeatController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "ok", timestamp = DateTime.UtcNow });
        }
    }
} 