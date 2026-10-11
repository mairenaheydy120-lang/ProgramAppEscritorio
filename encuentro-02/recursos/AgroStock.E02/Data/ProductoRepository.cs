using AgroStock.Models;
using Microsoft.Data.Sqlite;

namespace AgroStock.Data;

/// <summary>
/// Clase de acceso a datos (patrón Repositorio) con ADO.NET.
/// Todas las consultas usan parámetros ($nombre) para evitar inyección SQL.
/// </summary>
public class ProductoRepository
{
    private const string SelectBase = @"
        SELECT p.id, p.codigo, p.nombre, p.categoria_id, c.nombre,
               p.precio, p.existencia, p.vencimiento
        FROM productos p
        JOIN categorias c ON c.id = p.categoria_id";

    // R: Read
    public List<Producto> Listar(string filtro = "")
    {
        using var cn = Db.Abrir();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = SelectBase + " WHERE p.nombre LIKE $f OR p.codigo LIKE $f ORDER BY p.nombre";
        cmd.Parameters.AddWithValue("$f", $"%{filtro}%");

        var lista = new List<Producto>();
        using var rd = cmd.ExecuteReader();
        while (rd.Read())
        {
            lista.Add(new Producto
            {
                Id = rd.GetInt32(0),
                Codigo = rd.GetString(1),
                Nombre = rd.GetString(2),
                CategoriaId = rd.GetInt32(3),
                Categoria = rd.GetString(4),
                Precio = rd.GetDecimal(5),
                Existencia = rd.GetInt32(6),
                Vencimiento = rd.IsDBNull(7) ? null : rd.GetDateTime(7)
            });
        }
        return lista;
    }

    public List<Categoria> Categorias()
    {
        using var cn = Db.Abrir();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = "SELECT id, nombre FROM categorias ORDER BY nombre";
        using var rd = cmd.ExecuteReader();
        var lista = new List<Categoria>();
        while (rd.Read()) lista.Add(new Categoria(rd.GetInt32(0), rd.GetString(1)));
        return lista;
    }

    // C: Create
    public int Insertar(Producto p, SqliteConnection? cnExterna = null, SqliteTransaction? tx = null)
    {
        var cn = cnExterna ?? Db.Abrir();
        try
        {
            using var cmd = cn.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = @"
                INSERT INTO productos (codigo, nombre, categoria_id, precio, existencia, vencimiento)
                VALUES ($codigo, $nombre, $cat, $precio, $existencia, $vence);
                SELECT last_insert_rowid();";
            AgregarParametros(cmd, p);
            p.Id = Convert.ToInt32(cmd.ExecuteScalar());
            return p.Id;
        }
        finally
        {
            if (cnExterna is null) cn.Dispose(); // solo cerramos la conexión si la abrimos aquí
        }
    }

    // U: Update
    public bool Actualizar(Producto p)
    {
        using var cn = Db.Abrir();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = @"
            UPDATE productos
               SET codigo = $codigo, nombre = $nombre, categoria_id = $cat,
                   precio = $precio, existencia = $existencia, vencimiento = $vence
             WHERE id = $id";
        AgregarParametros(cmd, p);
        cmd.Parameters.AddWithValue("$id", p.Id);
        return cmd.ExecuteNonQuery() == 1;
    }

    // D: Delete
    public bool Eliminar(int id)
    {
        using var cn = Db.Abrir();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = "DELETE FROM productos WHERE id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        return cmd.ExecuteNonQuery() == 1;
    }

    private static void AgregarParametros(SqliteCommand cmd, Producto p)
    {
        cmd.Parameters.AddWithValue("$codigo", p.Codigo);
        cmd.Parameters.AddWithValue("$nombre", p.Nombre);
        cmd.Parameters.AddWithValue("$cat", p.CategoriaId);
        cmd.Parameters.AddWithValue("$precio", p.Precio);
        cmd.Parameters.AddWithValue("$existencia", p.Existencia);
        cmd.Parameters.AddWithValue("$vence", p.Vencimiento.HasValue
            ? p.Vencimiento.Value.ToString("yyyy-MM-dd")
            : DBNull.Value);
    }
}
