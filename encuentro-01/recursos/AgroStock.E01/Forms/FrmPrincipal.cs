using System.ComponentModel;
using System.Text;
using AgroStock.Models;

namespace AgroStock.Forms;

/// <summary>
/// Ventana principal: menú, barra de herramientas, cuadrícula y barra de estado.
/// En el Encuentro 1 los datos viven en memoria (BindingList); en el Encuentro 2 pasan a SQLite.
/// </summary>
public class FrmPrincipal : Form
{
    private readonly BindingList<Producto> productos = new();
    private readonly BindingSource fuente = new();
    private readonly DataGridView dgv = new()
    {
        Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false,
        SelectionMode = DataGridViewSelectionMode.FullRowSelect, MultiSelect = false,
        AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
    };
    private readonly TextBox txtBuscar = new() { PlaceholderText = "Buscar por nombre o código…", Width = 260 };
    private readonly ToolStripStatusLabel lblEstado = new() { Spring = true, TextAlign = ContentAlignment.MiddleLeft };
    private readonly ToolStripStatusLabel lblHora = new();
    private readonly System.Windows.Forms.Timer reloj = new() { Interval = 1000 };
    private int siguienteId = 1;

    public FrmPrincipal()
    {
        Text = "AgroStock – Inventario de agroservicio";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(800, 480);
        KeyPreview = true; // el formulario recibe las teclas antes que los controles

        fuente.DataSource = productos;
        dgv.DataSource = fuente;

        var panelBusqueda = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 36, Padding = new Padding(6) };
        panelBusqueda.Controls.Add(new Label { Text = "Buscar:", AutoSize = true, Margin = new Padding(3, 6, 3, 3) });
        panelBusqueda.Controls.Add(txtBuscar);

        // El orden de Add importa con Dock: primero lo que llena, luego los bordes.
        Controls.Add(dgv);
        Controls.Add(panelBusqueda);
        Controls.Add(CrearBarraHerramientas());
        Controls.Add(CrearMenu());
        Controls.Add(new StatusStrip { Items = { lblEstado, lblHora } });

        // Eventos
        txtBuscar.TextChanged += (_, _) => Filtrar();
        dgv.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Editar(); };
        KeyDown += FrmPrincipal_KeyDown;
        FormClosing += FrmPrincipal_FormClosing;
        reloj.Tick += (_, _) => lblHora.Text = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss");
        productos.ListChanged += (_, _) => ActualizarEstado();

        CargarEjemplos();
        reloj.Start();
    }

    // ---------- Construcción de menús y barras ----------
    private MenuStrip CrearMenu()
    {
        var menu = new MenuStrip();
        var archivo = new ToolStripMenuItem("&Archivo");
        archivo.DropDownItems.Add(new ToolStripMenuItem("&Nuevo producto", null, (_, _) => Nuevo(), Keys.Control | Keys.N));
        archivo.DropDownItems.Add(new ToolStripMenuItem("&Exportar a CSV…", null, (_, _) => ExportarCsv(), Keys.Control | Keys.E));
        archivo.DropDownItems.Add(new ToolStripSeparator());
        archivo.DropDownItems.Add(new ToolStripMenuItem("&Salir", null, (_, _) => Close()));

        var edicion = new ToolStripMenuItem("&Edición");
        edicion.DropDownItems.Add(new ToolStripMenuItem("&Editar seleccionado", null, (_, _) => Editar(), Keys.F2));
        edicion.DropDownItems.Add(new ToolStripMenuItem("E&liminar seleccionado", null, (_, _) => Eliminar(), Keys.Control | Keys.Delete));

        var ver = new ToolStripMenuItem("&Ver");
        ver.DropDownItems.Add(new ToolStripMenuItem("&Fuente de la tabla…", null, (_, _) => CambiarFuente()));
        ver.DropDownItems.Add(new ToolStripMenuItem("&Color de fondo…", null, (_, _) => CambiarColor()));

        var ayuda = new ToolStripMenuItem("A&yuda");
        ayuda.DropDownItems.Add(new ToolStripMenuItem("&Acerca de AgroStock", null, (_, _) =>
            MessageBox.Show(this, "AgroStock v1\nProgramación de aplicaciones de escritorio\nEncuentro 1", "Acerca de",
                MessageBoxButtons.OK, MessageBoxIcon.Information)));

        menu.Items.AddRange(new ToolStripItem[] { archivo, edicion, ver, ayuda });
        MainMenuStrip = menu;
        return menu;
    }

    private ToolStrip CrearBarraHerramientas()
    {
        var barra = new ToolStrip();
        barra.Items.Add(new ToolStripButton("➕ Nuevo", null, (_, _) => Nuevo()) { ToolTipText = "Nuevo producto (Ctrl+N)" });
        barra.Items.Add(new ToolStripButton("✏️ Editar", null, (_, _) => Editar()) { ToolTipText = "Editar (F2)" });
        barra.Items.Add(new ToolStripButton("🗑️ Eliminar", null, (_, _) => Eliminar()) { ToolTipText = "Eliminar (Ctrl+Supr)" });
        barra.Items.Add(new ToolStripSeparator());
        barra.Items.Add(new ToolStripButton("💾 Exportar", null, (_, _) => ExportarCsv()) { ToolTipText = "Exportar a CSV (Ctrl+E)" });
        return barra;
    }

    // ---------- Operaciones ----------
    private Producto? Seleccionado => fuente.Current as Producto;

    private void Nuevo()
    {
        var p = new Producto();
        using var dlg = new FrmProducto(p);
        if (dlg.ShowDialog(this) == DialogResult.OK)
        {
            if (productos.Any(x => x.Codigo == p.Codigo))
            {
                MessageBox.Show(this, $"Ya existe un producto con el código {p.Codigo}.", "Código repetido",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            p.Id = siguienteId++;
            productos.Add(p);
            Filtrar();
        }
    }

    private void Editar()
    {
        if (Seleccionado is not { } original) return;
        var copia = original.Clonar();
        using var dlg = new FrmProducto(copia);
        if (dlg.ShowDialog(this) == DialogResult.OK)
        {
            int i = productos.IndexOf(original);
            productos[i] = copia; // BindingList notifica a la cuadrícula
            Filtrar();
        }
    }

    private void Eliminar()
    {
        if (Seleccionado is not { } p) return;
        var r = MessageBox.Show(this, $"¿Eliminar «{p.Nombre}»?", "Confirmar",
            MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2);
        if (r == DialogResult.Yes) { productos.Remove(p); Filtrar(); }
    }

    private void Filtrar()
    {
        string t = txtBuscar.Text.Trim();
        fuente.DataSource = t.Length == 0
            ? productos
            : new BindingList<Producto>(productos.Where(p =>
                p.Nombre.Contains(t, StringComparison.OrdinalIgnoreCase) ||
                p.Codigo.Contains(t, StringComparison.OrdinalIgnoreCase)).ToList());
        ActualizarEstado();
    }

    private void ExportarCsv()
    {
        using var dlg = new SaveFileDialog
        {
            Title = "Exportar inventario", Filter = "Archivo CSV (*.csv)|*.csv",
            FileName = $"inventario_{DateTime.Now:yyyyMMdd}.csv"
        };
        if (dlg.ShowDialog(this) != DialogResult.OK) return;
        var sb = new StringBuilder("Codigo;Nombre;Categoria;Precio;Existencia;Vencimiento\n");
        foreach (var p in productos)
            sb.AppendLine($"{p.Codigo};{p.Nombre};{p.Categoria};{p.Precio};{p.Existencia};{p.Vencimiento:dd/MM/yyyy}");
        File.WriteAllText(dlg.FileName, sb.ToString(), Encoding.UTF8);
        lblEstado.Text = $"Exportado a {Path.GetFileName(dlg.FileName)}";
    }

    private void CambiarFuente()
    {
        using var dlg = new FontDialog { Font = dgv.Font };
        if (dlg.ShowDialog(this) == DialogResult.OK) dgv.Font = dlg.Font;
    }

    private void CambiarColor()
    {
        using var dlg = new ColorDialog { Color = dgv.BackgroundColor };
        if (dlg.ShowDialog(this) == DialogResult.OK) dgv.BackgroundColor = dlg.Color;
    }

    private void ActualizarEstado()
    {
        int bajos = productos.Count(p => p.Existencia < 10);
        lblEstado.Text = $"{fuente.Count} producto(s) mostrados · {bajos} con existencia baja";
    }

    // ---------- Manejadores de eventos del formulario ----------
    private void FrmPrincipal_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Control && e.KeyCode == Keys.F) { txtBuscar.Focus(); e.Handled = true; }
    }

    private void FrmPrincipal_FormClosing(object? sender, FormClosingEventArgs e)
    {
        var r = MessageBox.Show(this, "¿Desea salir de AgroStock?", "Salir",
            MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        e.Cancel = r == DialogResult.No; // cancelar el evento evita el cierre
    }

    private void CargarEjemplos()
    {
        productos.Add(new Producto { Id = siguienteId++, Codigo = "FER-001", Nombre = "Urea 46 % (quintal)", Categoria = "Fertilizantes", Precio = 1450m, Existencia = 35 });
        productos.Add(new Producto { Id = siguienteId++, Codigo = "FER-002", Nombre = "Fórmula 18-46-0 (quintal)", Categoria = "Fertilizantes", Precio = 1680m, Existencia = 8 });
        productos.Add(new Producto { Id = siguienteId++, Codigo = "SEM-010", Nombre = "Semilla de frijol INTA Rojo (lb)", Categoria = "Semillas", Precio = 45m, Existencia = 120, Vencimiento = DateTime.Today.AddMonths(6) });
        productos.Add(new Producto { Id = siguienteId++, Codigo = "HER-004", Nombre = "Machete 22 pulgadas", Categoria = "Herramientas", Precio = 260m, Existencia = 14 });
    }
}
