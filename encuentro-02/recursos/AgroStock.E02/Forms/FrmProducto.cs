using AgroStock.Models;

namespace AgroStock.Forms;

/// <summary>Diálogo de alta/edición. Igual al del Encuentro 1, pero las categorías vienen de la base.</summary>
public class FrmProducto : Form
{
    private readonly TextBox txtCodigo = new() { Dock = DockStyle.Fill, MaxLength = 10 };
    private readonly TextBox txtNombre = new() { Dock = DockStyle.Fill, MaxLength = 80 };
    private readonly ComboBox cboCategoria = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly NumericUpDown nudPrecio = new() { Dock = DockStyle.Fill, DecimalPlaces = 2, Maximum = 100000, ThousandsSeparator = true };
    private readonly NumericUpDown nudExistencia = new() { Dock = DockStyle.Fill, Maximum = 100000 };
    private readonly DateTimePicker dtpVence = new() { Dock = DockStyle.Fill, Format = DateTimePickerFormat.Short, ShowCheckBox = true };
    private readonly ErrorProvider errores = new();

    public Producto Producto { get; }

    public FrmProducto(Producto producto, IEnumerable<Categoria> categorias)
    {
        Producto = producto;
        Text = producto.Id == 0 ? "Nuevo producto" : $"Editar {producto.Codigo}";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = MinimizeBox = false;
        ClientSize = new Size(420, 300);

        cboCategoria.DataSource = categorias.ToList();
        cboCategoria.DisplayMember = nameof(Categoria.Nombre);
        cboCategoria.ValueMember = nameof(Categoria.Id);

        var tabla = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, Padding = new Padding(12) };
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 120));
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        foreach (var (texto, control) in new (string, Control)[] {
            ("Có&digo:", txtCodigo), ("&Nombre:", txtNombre), ("C&ategoría:", cboCategoria),
            ("&Precio (C$):", nudPrecio), ("&Existencia:", nudExistencia), ("&Vence:", dtpVence) })
        {
            tabla.Controls.Add(new Label { Text = texto, AutoSize = true, Anchor = AnchorStyles.Left });
            tabla.Controls.Add(control);
        }

        var btnGuardar = new Button { Text = "&Guardar", AutoSize = true };
        var btnCancelar = new Button { Text = "&Cancelar", AutoSize = true, DialogResult = DialogResult.Cancel };
        var botones = new FlowLayoutPanel { Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft, Height = 44, Padding = new Padding(8) };
        botones.Controls.AddRange(new Control[] { btnCancelar, btnGuardar });
        Controls.Add(tabla);
        Controls.Add(botones);
        AcceptButton = btnGuardar;
        CancelButton = btnCancelar;

        btnGuardar.Click += (_, _) => Guardar();
        Load += (_, _) =>
        {
            txtCodigo.Text = producto.Codigo;
            txtNombre.Text = producto.Nombre;
            if (producto.CategoriaId != 0) cboCategoria.SelectedValue = producto.CategoriaId;
            nudPrecio.Value = producto.Precio;
            nudExistencia.Value = producto.Existencia;
            dtpVence.Checked = producto.Vencimiento.HasValue;
            if (producto.Vencimiento.HasValue) dtpVence.Value = producto.Vencimiento.Value;
        };
    }

    private void Guardar()
    {
        errores.Clear();
        bool ok = true;
        if (string.IsNullOrWhiteSpace(txtCodigo.Text)) { errores.SetError(txtCodigo, "Obligatorio."); ok = false; }
        if (txtNombre.Text.Trim().Length < 3) { errores.SetError(txtNombre, "Mínimo 3 caracteres."); ok = false; }
        if (nudPrecio.Value <= 0) { errores.SetError(nudPrecio, "Debe ser mayor que cero."); ok = false; }
        if (!ok) return;

        Producto.Codigo = txtCodigo.Text.Trim().ToUpperInvariant();
        Producto.Nombre = txtNombre.Text.Trim();
        Producto.CategoriaId = (int)cboCategoria.SelectedValue!;
        Producto.Precio = nudPrecio.Value;
        Producto.Existencia = (int)nudExistencia.Value;
        Producto.Vencimiento = dtpVence.Checked ? dtpVence.Value.Date : null;
        DialogResult = DialogResult.OK;
    }
}
