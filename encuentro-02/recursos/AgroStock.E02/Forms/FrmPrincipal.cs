using AgroStock.Data;
using AgroStock.Models;
using Microsoft.Data.Sqlite;

namespace AgroStock.Forms;

/// <summary>Ventana principal conectada a SQLite: CRUD completo mediante ProductoRepository.</summary>
public class FrmPrincipal : Form
{
    private readonly ProductoRepository repo = new();
    private readonly BindingSource fuente = new();
    private readonly DataGridView dgv = new()
    {
        Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false,
        SelectionMode = DataGridViewSelectionMode.FullRowSelect, MultiSelect = false,
        AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
    };
    private readonly TextBox txtBuscar = new() { PlaceholderText = "Buscar por nombre o código…", Width = 260 };
    private readonly ToolStripStatusLabel lblEstado = new() { Spring = true, TextAlign = ContentAlignment.MiddleLeft };

    public FrmPrincipal()
    {
        Text = "AgroStock v2 – SQLite";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(820, 500);
        dgv.DataSource = fuente;

        var barra = new ToolStrip();
        barra.Items.Add(new ToolStripButton("➕ Nuevo", null, (_, _) => Nuevo()));
        barra.Items.Add(new ToolStripButton("✏️ Editar", null, (_, _) => Editar()));
        barra.Items.Add(new ToolStripButton("🗑️ Eliminar", null, (_, _) => Eliminar()));
        barra.Items.Add(new ToolStripSeparator());
        barra.Items.Add(new ToolStripButton("📥 Importar CSV (hilos)", null, (_, _) =>
        {
            using var f = new FrmImportar();
            f.ShowDialog(this);
            Cargar();
        }));

        var panel = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 36, Padding = new Padding(6) };
        panel.Controls.Add(new Label { Text = "Buscar:", AutoSize = true, Margin = new Padding(3, 6, 3, 3) });
        panel.Controls.Add(txtBuscar);

        Controls.Add(dgv);
        Controls.Add(panel);
        Controls.Add(barra);
        Controls.Add(new StatusStrip { Items = { lblEstado } });

        txtBuscar.TextChanged += (_, _) => Cargar();
        dgv.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Editar(); };
        dgv.DataBindingComplete += (_, _) =>
        {
            // Ocultar columnas técnicas y dar formato
            if (dgv.Columns[nameof(Producto.Id)] is { } c1) c1.Visible = false;
            if (dgv.Columns[nameof(Producto.CategoriaId)] is { } c2) c2.Visible = false;
            if (dgv.Columns[nameof(Producto.Precio)] is { } c3) c3.DefaultCellStyle.Format = "N2";
        };
        Load += (_, _) => Cargar();
    }

    private Producto? Seleccionado => fuente.Current as Producto;

    private void Cargar()
    {
        try
        {
            var lista = repo.Listar(txtBuscar.Text.Trim());
            fuente.DataSource = lista;
            lblEstado.Text = $"{lista.Count} producto(s) · base: {Path.GetFileName(Db.RutaArchivo)}";
        }
        catch (SqliteException ex)
        {
            MostrarError("leer los productos", ex);
        }
    }

    private void Nuevo()
    {
        var p = new Producto();
        using var dlg = new FrmProducto(p, repo.Categorias());
        if (dlg.ShowDialog(this) != DialogResult.OK) return;
        try { repo.Insertar(p); Cargar(); }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // SQLITE_CONSTRAINT
        {
            MessageBox.Show(this, $"El código {p.Codigo} ya existe o viola una restricción.", "No se guardó",
                MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        catch (SqliteException ex) { MostrarError("insertar", ex); }
    }

    private void Editar()
    {
        if (Seleccionado is not { } p) return;
        using var dlg = new FrmProducto(p, repo.Categorias());
        if (dlg.ShowDialog(this) != DialogResult.OK) { Cargar(); return; }
        try { repo.Actualizar(p); }
        catch (SqliteException ex) { MostrarError("actualizar", ex); }
        Cargar();
    }

    private void Eliminar()
    {
        if (Seleccionado is not { } p) return;
        if (MessageBox.Show(this, $"¿Eliminar «{p.Nombre}»?", "Confirmar", MessageBoxButtons.YesNo,
                MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
        try { repo.Eliminar(p.Id); Cargar(); }
        catch (SqliteException ex) { MostrarError("eliminar", ex); }
    }

    private void MostrarError(string accion, Exception ex) =>
        MessageBox.Show(this, $"Error al {accion}:\n{ex.Message}", "Base de datos", MessageBoxButtons.OK, MessageBoxIcon.Error);
}
