using Microsoft.EntityFrameworkCore;
using TiFlinks.API.Models;

namespace TiFlinks.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<InformationUnit> InformationUnits { get; set; }
        public DbSet<Link> Links { get; set; }
        public DbSet<LinkType> LinkTypes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Link>()
                .HasOne(l => l.Source)
                .WithMany(i => i.SourceLinks)
                .HasForeignKey(l => l.SourceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Link>()
                .HasOne(l => l.Target)
                .WithMany(i => i.TargetLinks)
                .HasForeignKey(l => l.TargetId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seed default link types
            modelBuilder.Entity<LinkType>().HasData(
                new LinkType { Id = 1, Name = "Navigational", Description = "A navigational link between information units" },
                new LinkType { Id = 2, Name = "Semantic Reference", Description = "A semantic reference link (ontosense link)" }
            );
        }
    }
} 