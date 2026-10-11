namespace AgroStock.Models;

public class Producto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public string Categoria { get; set; } = string.Empty; // nombre, solo para mostrar (JOIN)
    public decimal Precio { get; set; }
    public int Existencia { get; set; }
    public DateTime? Vencimiento { get; set; }
}

public record Categoria(int Id, string Nombre)
{
    public override string ToString() => Nombre; // lo que muestra el ComboBox
}
