namespace AgroStock.Models;

/// <summary>Producto que vende un agroservicio (fertilizante, semilla, herramienta...).</summary>
public class Producto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Existencia { get; set; }
    public DateTime? Vencimiento { get; set; }

    /// <summary>Devuelve una copia para editar sin tocar el original hasta confirmar.</summary>
    public Producto Clonar() => (Producto)MemberwiseClone();
}
