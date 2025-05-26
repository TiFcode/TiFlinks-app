namespace TiFlinks.API.DTOs
{
    public class InformationUnitDto
    {
        public Guid Id { get; set; }
        public required string Title { get; set; }
        public required string Content { get; set; }
        public int Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 