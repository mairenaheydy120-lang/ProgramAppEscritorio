using AgroStock.Models;
using Microsoft.EntityFrameworkCore;

namespace AgroStock.Data;

/// <summary>El DbContext representa una sesión con la base de datos (unidad de trabajo).</summary>
public class AgroStockContext : DbContext
{
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Categoria> Categorias => Set<Categoria>();

    public static string RutaArchivo => Path.Combine(AppContext.BaseDirectory, "agrostock_ef.db");

    protected override void OnConfiguring(DbContextOptionsBuilder opciones) =>
        opciones.UseSqlite($"Data Source={RutaArchivo}");

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Fluent API: reglas que no caben en atributos
        mb.Entity<Producto>().HasIndex(p => p.Codigo).IsUnique();
        mb.Entity<Producto>().Property(p => p.Precio).HasConversion<double>(); // SQLite no tiene decimal nativo
        mb.Entity<Producto>()
          .HasOne(p => p.Categoria).WithMany(c => c.Productos)
          .HasForeignKey(p => p.CategoriaId).OnDelete(DeleteBehavior.Restrict);

        // Datos semilla
        mb.Entity<Categoria>().HasData(
            new Categoria { Id = 1, Nombre = "Fertilizantes" },
            new Categoria { Id = 2, Nombre = "Semillas" },
            new Categoria { Id = 3, Nombre = "Plaguicidas" },
            new Categoria { Id = 4, Nombre = "Herramientas" },
            new Categoria { Id = 5, Nombre = "Veterinaria" });

        mb.Entity<Producto>().HasData(
            new Producto { Id = 1, Codigo = "FER-001", Nombre = "Urea 46 % (quintal)", CategoriaId = 1, Precio = 1450m, Existencia = 35 },
            new Producto { Id = 2, Codigo = "FER-002", Nombre = "Fórmula 18-46-0 (quintal)", CategoriaId = 1, Precio = 1680m, Existencia = 8 },
            new Producto { Id = 3, Codigo = "SEM-010", Nombre = "Semilla de frijol INTA Rojo (lb)", CategoriaId = 2, Precio = 45m, Existencia = 120 },
            new Producto { Id = 4, Codigo = "PLA-020", Nombre = "Fungicida cúprico (kg)", CategoriaId = 3, Precio = 310m, Existencia = 6 },
            new Producto { Id = 5, Codigo = "HER-005", Nombre = "Bomba de mochila 20 L", CategoriaId = 4, Precio = 2350m, Existencia = 3 },
            new Producto { Id = 6, Codigo = "VET-030", Nombre = "Desparasitante bovino (frasco)", CategoriaId = 5, Precio = 420m, Existencia = 11 });
    }
}
