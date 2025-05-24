using System.Collections.Generic;

namespace TiFlinks.API.Models
{
    public class LinkType
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        // Navigation properties
        public ICollection<Link> Links { get; set; }
    }
} 