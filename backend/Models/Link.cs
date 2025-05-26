using System;

namespace TiFlinks.API.Models
{
    public class Link
    {
        public Guid Id { get; set; }
        public Guid SourceId { get; set; }
        public Guid TargetId { get; set; }
        public int LinkTypeId { get; set; }
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public required InformationUnit Source { get; set; }
        public required InformationUnit Target { get; set; }
        public required LinkType LinkType { get; set; }
    }
} 