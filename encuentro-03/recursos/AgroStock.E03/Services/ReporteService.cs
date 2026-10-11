using AgroStock.Models;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AgroStock.Services;

/// <summary>Genera el reporte de inventario en PDF (QuestPDF) y en Excel (ClosedXML).</summary>
public static class ReporteService
{
    public static void GenerarPdf(string ruta, IReadOnlyList<ProductoVista> datos, decimal? tipoCambio)
    {
        Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("AgroStock – Reporte de inventario").SemiBold().FontSize(16).FontColor(Colors.Blue.Darken3);
                    col.Item().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}" +
                                    (tipoCambio is { } tc ? $"   ·   Tipo de cambio: C$ {tc:N2} por USD" : ""));
                });

                page.Content().PaddingVertical(10).Table(tabla =>
                {
                    tabla.ColumnsDefinition(c =>
                    {
                        c.ConstantColumn(60); c.RelativeColumn(3); c.RelativeColumn(2);
                        c.ConstantColumn(60); c.ConstantColumn(50); c.ConstantColumn(80);
                    });

                    tabla.Header(h =>
                    {
                        foreach (var t in new[] { "Código", "Producto", "Categoría", "Precio", "Exist.", "Valor C$" })
                            h.Cell().Background(Colors.Blue.Darken3).Padding(4).Text(t).FontColor(Colors.White).SemiBold();
                    });

                    foreach (var p in datos)
                    {
                        var fondo = p.Existencia < 10 ? Colors.Orange.Lighten4 : Colors.White; // resaltar existencia baja
                        tabla.Cell().Background(fondo).Padding(3).Text(p.Codigo);
                        tabla.Cell().Background(fondo).Padding(3).Text(p.Nombre);
                        tabla.Cell().Background(fondo).Padding(3).Text(p.Categoria);
                        tabla.Cell().Background(fondo).Padding(3).AlignRight().Text($"{p.Precio:N2}");
                        tabla.Cell().Background(fondo).Padding(3).AlignRight().Text($"{p.Existencia}");
                        tabla.Cell().Background(fondo).Padding(3).AlignRight().Text($"{p.ValorInventario:N2}");
                    }
                });

                page.Footer().Row(r =>
                {
                    decimal total = datos.Sum(d => d.ValorInventario);
                    r.RelativeItem().Text($"Valor total: C$ {total:N2}" +
                        (tipoCambio is { } tc && tc > 0 ? $"  (≈ USD {total / tc:N2})" : "")).SemiBold();
                    r.ConstantItem(80).AlignRight().Text(x => { x.Span("Página "); x.CurrentPageNumber(); x.Span(" de "); x.TotalPages(); });
                });
            });
        }).GeneratePdf(ruta);
    }

    public static void GenerarExcel(string ruta, IReadOnlyList<ProductoVista> datos)
    {
        using var libro = new XLWorkbook();
        var hoja = libro.Worksheets.Add("Inventario");
        string[] enc = { "Código", "Producto", "Categoría", "Precio", "Existencia", "Valor C$" };
        for (int i = 0; i < enc.Length; i++) hoja.Cell(1, i + 1).Value = enc[i];

        int fila = 2;
        foreach (var p in datos)
        {
            hoja.Cell(fila, 1).Value = p.Codigo;
            hoja.Cell(fila, 2).Value = p.Nombre;
            hoja.Cell(fila, 3).Value = p.Categoria;
            hoja.Cell(fila, 4).Value = p.Precio;
            hoja.Cell(fila, 5).Value = p.Existencia;
            hoja.Cell(fila, 6).FormulaA1 = $"D{fila}*E{fila}"; // fórmula viva en Excel
            fila++;
        }
        hoja.Cell(fila, 5).Value = "Total";
        hoja.Cell(fila, 6).FormulaA1 = $"SUM(F2:F{fila - 1})";

        var rango = hoja.Range(1, 1, fila - 1, enc.Length).CreateTable("TablaInventario");
        rango.Theme = XLTableTheme.TableStyleMedium2;
        hoja.Range(2, 4, fila, 6).Style.NumberFormat.Format = "#,##0.00";
        hoja.Columns().AdjustToContents();
        libro.SaveAs(ruta);
    }
}
