// AgroStock – Encuentro 3: ORM, reportes y consumo de servicios web
using AgroStock.Data;

namespace AgroStock;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community; // licencia gratuita (uso académico)

        using (var db = new AgroStockContext())
            db.Database.EnsureCreated(); // crea la base y los datos semilla si no existen

        Application.Run(new Forms.FrmPrincipal());
    }
}
