// AgroStock – Encuentro 2: acceso a bases de datos y programación concurrente
using AgroStock.Data;

namespace AgroStock;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        try
        {
            Db.CrearSiNoExiste(); // ejecuta agrostock.sql si la base no existe
        }
        catch (Exception ex)
        {
            MessageBox.Show("No se pudo preparar la base de datos:\n" + ex.Message, "AgroStock",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        Application.Run(new Forms.FrmPrincipal());
    }
}
