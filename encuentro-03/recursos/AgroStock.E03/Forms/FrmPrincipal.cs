using AgroStock.Data;
using AgroStock.Models;
using AgroStock.Services;
using Microsoft.EntityFrameworkCore;

namespace AgroStock.Forms;

/// <summary>AgroStock v3: CRUD con EF Core, reportes PDF/Excel y tipo de cambio desde un servicio web.</summary>
public class FrmPrincipal : Form
{
    private readonly ProductoService servicio = new();
    private readonly TipoCambioService tipoCambio = new();
    private readonly BindingSource fuente = new();
    private readonly DataGridView dgv = new()
    {
        Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false,
        SelectionMode = DataGridViewSelectionMode.FullRowSelect, MultiSelect = false,
        AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
    };
    private readonly TextBox txtBuscar = new() { PlaceholderText = "Buscar…", Width = 240 };
    private readonly ToolStripStatusLabel lblEstado = new() { Spring = true, TextAlign = ContentAlignment.MiddleLeft };
    private readonly ToolStripStatusLabel lblCambio = new() { Text = "Tipo de cambio: —" };
    private decimal? nioPorUsd;

    public FrmPrincipal()
    {
        Text = "AgroStock v3 – EF Core · Reportes · Servicios web";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(900, 520);
        dgv.DataSource = fuente;

        var menu = new MenuStrip();
        var datos = new ToolStripMenuItem("&Datos");
        datos.DropDownItems.Add("&Nuevo", null, (_, _) => Nuevo());
        datos.DropDownItems.Add("&Editar", null, (_, _) => Editar());
        datos.DropDownItems.Add("E&liminar", null, (_, _) => Eliminar());
        var reportes = new ToolStripMenuItem("&Reportes");
        reportes.DropDownItems.Add("Inventario en &PDF…", null, (_, _) => Exportar("pdf"));
        reportes.DropDownItems.Add("Inventario en &Excel…", null, (_, _) => Exportar("xlsx"));
        var servicios = new ToolStripMenuItem("&Servicios web");
        servicios.DropDownItems.Add("Actualizar &tipo de cambio (USD → NIO)", null, async (_, _) => await ActualizarTipoCambioAsync());
        menu.Items.AddRange(new ToolStripItem[] { datos, reportes, servicios });
        MainMenuStrip = menu;

        var panel = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 36, Padding = new Padding(6) };
        panel.Controls.Add(new Label { Text = "Buscar:", AutoSize = true, Margin = new Padding(3, 6, 3, 3) });
        panel.Controls.Add(txtBuscar);

        Controls.Add(dgv);
        Controls.Add(panel);
        Controls.Add(menu);
        Controls.Add(new StatusStrip { Items = { lblEstado, lblCambio } });

        txtBuscar.TextChanged += (_, _) => Cargar();
        dgv.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Editar(); };
        dgv.DataBindingComplete += (_, _) =>
        {
            if (dgv.Columns["Id"] is { } id) id.Visible = false;
            foreach (var n in new[] { "Precio", "ValorInventario" })
                if (dgv.Columns[n] is { } c) c.DefaultCellStyle.Format = "N2";
        };
        Load += async (_, _) => { Cargar(); await ActualizarTipoCambioAsync(); };
    }

    private ProductoVista? Seleccionado => fuente.Current as ProductoVista;

    private void Cargar()
    {
        var lista = servicio.Listar(txtBuscar.Text.Trim());
        fuente.DataSource = lista;
        lblEstado.Text = $"{lista.Count} producto(s) · valor C$ {lista.Sum(p => p.ValorInventario):N2}";
    }

    private void Nuevo()
    {
        var p = new Producto();
        using var dlg = new FrmProducto(p, servicio.Categorias());
        if (dlg.ShowDialog(this) == DialogResult.OK) GuardarSeguro(p);
    }

    private void Editar()
    {
        if (Seleccionado is not { } v || servicio.Obtener(v.Id) is not { } p) return;
        using var dlg = new FrmProducto(p, servicio.Categorias());
        if (dlg.ShowDialog(this) == DialogResult.OK) GuardarSeguro(p);
    }

    private void GuardarSeguro(Producto p)
    {
        try { servicio.Guardar(p); Cargar(); }
        catch (DbUpdateException ex)
        {
            MessageBox.Show(this, "No se pudo guardar (¿código repetido?).\n" + ex.InnerException?.Message,
                "EF Core", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    private void Eliminar()
    {
        if (Seleccionado is not { } v) return;
        if (MessageBox.Show(this, $"¿Eliminar «{v.Nombre}»?", "Confirmar", MessageBoxButtons.YesNo,
                MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
        servicio.Eliminar(v.Id);
        Cargar();
    }

    private async void Exportar(string formato)
    {
        using var dlg = new SaveFileDialog
        {
            Filter = formato == "pdf" ? "PDF (*.pdf)|*.pdf" : "Excel (*.xlsx)|*.xlsx",
            FileName = $"inventario_{DateTime.Now:yyyyMMdd_HHmm}.{formato}"
        };
        if (dlg.ShowDialog(this) != DialogResult.OK) return;
        var datos = servicio.Listar();
        Cursor = Cursors.WaitCursor;
        try
        {
            // Generar el reporte fuera del hilo de UI (Unidad III aplicada)
            await Task.Run(() =>
            {
                if (formato == "pdf") ReporteService.GenerarPdf(dlg.FileName, datos, nioPorUsd);
                else ReporteService.GenerarExcel(dlg.FileName, datos);
            });
            if (MessageBox.Show(this, "Reporte generado. ¿Abrirlo ahora?", "Reportes", MessageBoxButtons.YesNo) == DialogResult.Yes)
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(dlg.FileName) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "Error al generar el reporte", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally { Cursor = Cursors.Default; }
    }

    private async Task ActualizarTipoCambioAsync()
    {
        lblCambio.Text = "Consultando tipo de cambio…";
        var (nio, fuenteDato) = await tipoCambio.ObtenerNioPorUsdAsync(); // no bloquea la UI
        nioPorUsd = nio;
        lblCambio.Text = $"1 USD = C$ {nio:N2} ({fuenteDato})";
    }
}
