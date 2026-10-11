using System.ComponentModel.DataAnnotations;

namespace AgroStock.Models;

// Entidades del ORM: cada clase = tabla, cada propiedad = columna.

public class Categoria
{
    public int Id { get; set; }

    [Required, MaxLength(40)]
    public string Nombre { get; set; } = string.Empty;

    // Propiedad de navegación: una categoría tiene muchos productos (1:N)
    public List<Producto> Productos { get; set; } = new();

    public override string ToString() => Nombre;
}

public class Producto
{
    public int Id { get; set; }

    [Required, MaxLength(10)]
    public string Codigo { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Nombre { get; set; } = string.Empty;

    public int CategoriaId { get; set; }          // clave foránea
    public Categoria? Categoria { get; set; }     // navegación

    public decimal Precio { get; set; }
    public int Existencia { get; set; }
    public DateTime? Vencimiento { get; set; }
}

/// <summary>Fila que muestra la cuadrícula (proyección con LINQ, no es una tabla).</summary>
public record ProductoVista(int Id, string Codigo, string Nombre, string Categoria,
                            decimal Precio, int Existencia, decimal ValorInventario);
