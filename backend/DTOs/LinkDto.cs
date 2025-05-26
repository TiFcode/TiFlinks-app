namespace TiFlinks.API.DTOs
{
    public class LinkDto
    {
        public Guid Id { get; set; }
        public Guid SourceId { get; set; }
        public Guid TargetId { get; set; }
        public int LinkTypeId { get; set; }
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 