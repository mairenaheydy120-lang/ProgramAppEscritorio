// AgroStock – Encuentro 1: Aplicaciones de interfaz gráfica
// Punto de entrada de la aplicación Windows Forms.
namespace AgroStock;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        // Configura estilos visuales, DPI y fuente por defecto (.NET 6+).
        ApplicationConfiguration.Initialize();
        Application.Run(new Forms.FrmPrincipal());
    }
}
