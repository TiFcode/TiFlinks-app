using System;
using System.Collections.Generic;

namespace TiFlinks.API.Models
{
    public class InformationUnit
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public InformationUnitType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Link> SourceLinks { get; set; }
        public ICollection<Link> TargetLinks { get; set; }
    }

    public enum InformationUnitType
    {
        Text,
        Image,
        Url
    }
} 