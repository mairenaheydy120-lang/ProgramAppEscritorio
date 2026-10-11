using Microsoft.Data.Sqlite;

namespace AgroStock.Data;

/// <summary>Punto único para obtener conexiones a la base SQLite.</summary>
public static class Db
{
    public static readonly string RutaArchivo = Path.Combine(AppContext.BaseDirectory, "agrostock.db");
    public static string CadenaConexion => new SqliteConnectionStringBuilder
    {
        DataSource = RutaArchivo,
        Mode = SqliteOpenMode.ReadWriteCreate,
        ForeignKeys = true
    }.ToString();

    /// <summary>Crea y abre una conexión. Úsela siempre con <c>using</c>.</summary>
    public static SqliteConnection Abrir()
    {
        var cn = new SqliteConnection(CadenaConexion);
        cn.Open();
        return cn;
    }

    public static void CrearSiNoExiste()
    {
        if (File.Exists(RutaArchivo)) return;
        string script = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "agrostock.sql"));
        using var cn = Abrir();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = script;   // SQLite admite varias sentencias separadas por ';'
        cmd.ExecuteNonQuery();
    }
}
