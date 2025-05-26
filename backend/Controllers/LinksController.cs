using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiFlinks.API.Data;
using TiFlinks.API.DTOs;
using TiFlinks.API.Models;

namespace TiFlinks.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LinksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public LinksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LinkDto>>> GetAll()
        {
            var links = await _context.Links.ToListAsync();
            return links.Select(l => new LinkDto
            {
                Id = l.Id,
                SourceId = l.SourceId,
                TargetId = l.TargetId,
                LinkTypeId = l.LinkTypeId,
                Description = l.Description,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            }).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LinkDto>> Get(Guid id)
        {
            var l = await _context.Links.FindAsync(id);
            if (l == null) return NotFound();
            return new LinkDto
            {
                Id = l.Id,
                SourceId = l.SourceId,
                TargetId = l.TargetId,
                LinkTypeId = l.LinkTypeId,
                Description = l.Description,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            };
        }

        [HttpPost]
        public async Task<ActionResult<LinkDto>> Create(LinkDto dto)
        {
            var source = await _context.InformationUnits.FindAsync(dto.SourceId);
            if (source == null) return BadRequest("Source information unit not found");

            var target = await _context.InformationUnits.FindAsync(dto.TargetId);
            if (target == null) return BadRequest("Target information unit not found");

            var linkType = await _context.LinkTypes.FindAsync(dto.LinkTypeId);
            if (linkType == null) return BadRequest("Link type not found");

            var link = new Link
            {
                SourceId = dto.SourceId,
                TargetId = dto.TargetId,
                LinkTypeId = dto.LinkTypeId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                Source = source,
                Target = target,
                LinkType = linkType
            };
            _context.Links.Add(link);
            await _context.SaveChangesAsync();
            dto.Id = link.Id;
            dto.CreatedAt = link.CreatedAt;
            return CreatedAtAction(nameof(Get), new { id = link.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, LinkDto dto)
        {
            var link = await _context.Links.FindAsync(id);
            if (link == null) return NotFound();

            var source = await _context.InformationUnits.FindAsync(dto.SourceId);
            if (source == null) return BadRequest("Source information unit not found");

            var target = await _context.InformationUnits.FindAsync(dto.TargetId);
            if (target == null) return BadRequest("Target information unit not found");

            var linkType = await _context.LinkTypes.FindAsync(dto.LinkTypeId);
            if (linkType == null) return BadRequest("Link type not found");

            link.SourceId = dto.SourceId;
            link.TargetId = dto.TargetId;
            link.LinkTypeId = dto.LinkTypeId;
            link.Description = dto.Description;
            link.UpdatedAt = DateTime.UtcNow;
            link.Source = source;
            link.Target = target;
            link.LinkType = linkType;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var link = await _context.Links.FindAsync(id);
            if (link == null) return NotFound();
            _context.Links.Remove(link);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
} 