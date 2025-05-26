using System;
using System.Collections.Generic;

namespace TiFlinks.API.Models
{
    public class InformationUnit
    {
        public Guid Id { get; set; }
        public required string Title { get; set; }
        public required string Content { get; set; }
        public InformationUnitType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Link> SourceLinks { get; set; } = new List<Link>();
        public ICollection<Link> TargetLinks { get; set; } = new List<Link>();
    }

    public enum InformationUnitType
    {
        Text,
        Image,
        Url
    }
} 