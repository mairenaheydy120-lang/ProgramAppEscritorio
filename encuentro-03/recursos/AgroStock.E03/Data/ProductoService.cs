using AgroStock.Models;
using Microsoft.EntityFrameworkCore;

namespace AgroStock.Data;

/// <summary>CRUD con Entity Framework Core: LINQ en lugar de SQL escrito a mano.</summary>
public class ProductoService
{
    public List<ProductoVista> Listar(string filtro = "")
    {
        using var db = new AgroStockContext();
        return db.Productos
            .AsNoTracking()                                   // solo lectura: más rápido
            .Where(p => filtro == "" || p.Nombre.Contains(filtro) || p.Codigo.Contains(filtro))
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoVista(p.Id, p.Codigo, p.Nombre, p.Categoria!.Nombre,
                                           p.Precio, p.Existencia, p.Precio * p.Existencia))
            .ToList();                                        // aquí se ejecuta el SELECT
    }

    public Producto? Obtener(int id)
    {
        using var db = new AgroStockContext();
        return db.Productos.Find(id);
    }

    public List<Categoria> Categorias()
    {
        using var db = new AgroStockContext();
        return db.Categorias.AsNoTracking().OrderBy(c => c.Nombre).ToList();
    }

    public void Guardar(Producto p)
    {
        using var db = new AgroStockContext();
        if (p.Id == 0) db.Productos.Add(p);      // INSERT
        else db.Productos.Update(p);             // UPDATE
        db.SaveChanges();                        // confirma la unidad de trabajo
    }

    public void Eliminar(int id)
    {
        using var db = new AgroStockContext();
        var p = db.Productos.Find(id);
        if (p is null) return;
        db.Productos.Remove(p);                  // DELETE
        db.SaveChanges();
    }

    /// <summary>Datos agregados para el reporte por categoría (GROUP BY en LINQ).</summary>
    public List<(string Categoria, int Productos, decimal Valor)> ResumenPorCategoria()
    {
        using var db = new AgroStockContext();
        return db.Productos.AsNoTracking()
            .Select(p => new { Cat = p.Categoria!.Nombre, p.Precio, p.Existencia })
            .AsEnumerable()                                    // SQLite: agregamos decimales en memoria
            .GroupBy(x => x.Cat)
            .Select(g => (g.Key, g.Count(), g.Sum(x => x.Precio * x.Existencia)))
            .OrderByDescending(r => r.Item3)
            .ToList();
    }
}
