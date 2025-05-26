using System.Collections.Generic;

namespace TiFlinks.API.Models
{
    public class LinkType
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }

        // Navigation properties
        public ICollection<Link> Links { get; set; } = new List<Link>();
    }
} 