using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiFlinks.API.Data;
using TiFlinks.API.DTOs;
using TiFlinks.API.Models;

namespace TiFlinks.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InformationUnitsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public InformationUnitsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InformationUnitDto>>> GetAll()
        {
            var units = await _context.InformationUnits.ToListAsync();
            return units.Select(u => new InformationUnitDto
            {
                Id = u.Id,
                Title = u.Title,
                Content = u.Content,
                Type = (int)u.Type,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            }).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InformationUnitDto>> Get(int id)
        {
            var u = await _context.InformationUnits.FindAsync(id);
            if (u == null) return NotFound();
            return new InformationUnitDto
            {
                Id = u.Id,
                Title = u.Title,
                Content = u.Content,
                Type = (int)u.Type,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            };
        }

        [HttpPost]
        public async Task<ActionResult<InformationUnitDto>> Create(InformationUnitDto dto)
        {
            var unit = new InformationUnit
            {
                Title = dto.Title,
                Content = dto.Content,
                Type = (InformationUnitType)dto.Type,
                CreatedAt = DateTime.UtcNow
            };
            _context.InformationUnits.Add(unit);
            await _context.SaveChangesAsync();
            dto.Id = unit.Id;
            dto.CreatedAt = unit.CreatedAt;
            return CreatedAtAction(nameof(Get), new { id = unit.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, InformationUnitDto dto)
        {
            var unit = await _context.InformationUnits.FindAsync(id);
            if (unit == null) return NotFound();
            unit.Title = dto.Title;
            unit.Content = dto.Content;
            unit.Type = (InformationUnitType)dto.Type;
            unit.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var unit = await _context.InformationUnits.FindAsync(id);
            if (unit == null) return NotFound();
            _context.InformationUnits.Remove(unit);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
} 