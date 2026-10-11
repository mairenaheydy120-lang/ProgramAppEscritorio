using AgroStock.Models;

namespace AgroStock.Forms;

/// <summary>
/// Caja de diálogo modal para crear o editar un producto.
/// Se abre con ShowDialog() y devuelve DialogResult.OK o DialogResult.Cancel.
/// </summary>
public class FrmProducto : Form
{
    private readonly TextBox txtCodigo = new() { Dock = DockStyle.Fill, MaxLength = 10 };
    private readonly TextBox txtNombre = new() { Dock = DockStyle.Fill, MaxLength = 80 };
    private readonly ComboBox cboCategoria = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly NumericUpDown nudPrecio = new() { Dock = DockStyle.Fill, DecimalPlaces = 2, Maximum = 100000, ThousandsSeparator = true };
    private readonly NumericUpDown nudExistencia = new() { Dock = DockStyle.Fill, Maximum = 100000 };
    private readonly DateTimePicker dtpVencimiento = new() { Dock = DockStyle.Fill, Format = DateTimePickerFormat.Short, ShowCheckBox = true };
    private readonly Button btnGuardar = new() { Text = "&Guardar", AutoSize = true };
    private readonly Button btnCancelar = new() { Text = "&Cancelar", AutoSize = true, DialogResult = DialogResult.Cancel };
    private readonly ErrorProvider errores = new();

    public Producto Producto { get; }

    public FrmProducto(Producto producto)
    {
        Producto = producto;
        Text = producto.Id == 0 ? "Nuevo producto" : $"Editar producto {producto.Codigo}";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = MinimizeBox = false;
        ClientSize = new Size(420, 300);

        cboCategoria.Items.AddRange(new object[] { "Fertilizantes", "Semillas", "Plaguicidas", "Herramientas", "Veterinaria" });

        // Diseño con TableLayoutPanel: 2 columnas (etiqueta | control).
        var tabla = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, Padding = new Padding(12) };
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 120));
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AgregarFila(tabla, "Có&digo:", txtCodigo);
        AgregarFila(tabla, "&Nombre:", txtNombre);
        AgregarFila(tabla, "C&ategoría:", cboCategoria);
        AgregarFila(tabla, "&Precio (C$):", nudPrecio);
        AgregarFila(tabla, "&Existencia:", nudExistencia);
        AgregarFila(tabla, "&Vence:", dtpVencimiento);

        var botones = new FlowLayoutPanel { Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft, Height = 44, Padding = new Padding(8) };
        botones.Controls.AddRange(new Control[] { btnCancelar, btnGuardar });
        Controls.Add(tabla);
        Controls.Add(botones);

        AcceptButton = btnGuardar;   // Enter = Guardar
        CancelButton = btnCancelar;  // Esc = Cancelar

        // Suscripción a eventos
        btnGuardar.Click += BtnGuardar_Click;
        txtCodigo.KeyPress += TxtCodigo_KeyPress;
        Load += (_, _) => CargarDatos();
    }

    private static void AgregarFila(TableLayoutPanel tabla, string texto, Control control)
    {
        tabla.Controls.Add(new Label { Text = texto, AutoSize = true, Anchor = AnchorStyles.Left });
        tabla.Controls.Add(control);
    }

    private void CargarDatos()
    {
        txtCodigo.Text = Producto.Codigo;
        txtNombre.Text = Producto.Nombre;
        cboCategoria.SelectedItem = string.IsNullOrEmpty(Producto.Categoria) ? null : Producto.Categoria;
        nudPrecio.Value = Producto.Precio;
        nudExistencia.Value = Producto.Existencia;
        dtpVencimiento.Checked = Producto.Vencimiento.HasValue;
        if (Producto.Vencimiento.HasValue) dtpVencimiento.Value = Producto.Vencimiento.Value;
    }

    // Evento KeyPress: el código solo admite letras, dígitos y guion; se convierte a mayúscula.
    private void TxtCodigo_KeyPress(object? sender, KeyPressEventArgs e)
    {
        if (char.IsControl(e.KeyChar)) return;
        if (!char.IsLetterOrDigit(e.KeyChar) && e.KeyChar != '-') { e.Handled = true; return; }
        e.KeyChar = char.ToUpperInvariant(e.KeyChar);
    }

    private bool Validar()
    {
        errores.Clear();
        bool ok = true;
        if (string.IsNullOrWhiteSpace(txtCodigo.Text)) { errores.SetError(txtCodigo, "El código es obligatorio."); ok = false; }
        if (txtNombre.Text.Trim().Length < 3) { errores.SetError(txtNombre, "Escriba al menos 3 caracteres."); ok = false; }
        if (cboCategoria.SelectedItem is null) { errores.SetError(cboCategoria, "Seleccione una categoría."); ok = false; }
        if (nudPrecio.Value <= 0) { errores.SetError(nudPrecio, "El precio debe ser mayor que cero."); ok = false; }
        return ok;
    }

    private void BtnGuardar_Click(object? sender, EventArgs e)
    {
        if (!Validar()) return;   // el diálogo sigue abierto
        Producto.Codigo = txtCodigo.Text.Trim();
        Producto.Nombre = txtNombre.Text.Trim();
        Producto.Categoria = (string)cboCategoria.SelectedItem!;
        Producto.Precio = nudPrecio.Value;
        Producto.Existencia = (int)nudExistencia.Value;
        Producto.Vencimiento = dtpVencimiento.Checked ? dtpVencimiento.Value.Date : null;
        DialogResult = DialogResult.OK; // cierra el diálogo modal
    }
}
