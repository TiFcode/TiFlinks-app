using System;

namespace TiFlinks.API.Models
{
    public class Link
    {
        public int Id { get; set; }
        public int SourceId { get; set; }
        public int TargetId { get; set; }
        public int LinkTypeId { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public InformationUnit Source { get; set; }
        public InformationUnit Target { get; set; }
        public LinkType LinkType { get; set; }
    }
} 