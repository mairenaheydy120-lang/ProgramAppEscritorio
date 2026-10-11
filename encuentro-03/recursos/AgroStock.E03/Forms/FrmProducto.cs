using AgroStock.Models;

namespace AgroStock.Forms;

/// <summary>Diálogo de alta/edición enlazado a la entidad del ORM.</summary>
public class FrmProducto : Form
{
    private readonly TextBox txtCodigo = new() { Dock = DockStyle.Fill, MaxLength = 10 };
    private readonly TextBox txtNombre = new() { Dock = DockStyle.Fill, MaxLength = 80 };
    private readonly ComboBox cboCategoria = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly NumericUpDown nudPrecio = new() { Dock = DockStyle.Fill, DecimalPlaces = 2, Maximum = 100000, ThousandsSeparator = true };
    private readonly NumericUpDown nudExistencia = new() { Dock = DockStyle.Fill, Maximum = 100000 };
    private readonly ErrorProvider errores = new();
    public Producto Producto { get; }

    public FrmProducto(Producto producto, List<Categoria> categorias)
    {
        Producto = producto;
        Text = producto.Id == 0 ? "Nuevo producto" : $"Editar {producto.Codigo}";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = MinimizeBox = false;
        ClientSize = new Size(420, 260);

        cboCategoria.DataSource = categorias;
        cboCategoria.DisplayMember = nameof(Categoria.Nombre);
        cboCategoria.ValueMember = nameof(Categoria.Id);

        var tabla = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, Padding = new Padding(12) };
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 120));
        tabla.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        foreach (var (t, c) in new (string, Control)[] { ("Código:", txtCodigo), ("Nombre:", txtNombre),
                 ("Categoría:", cboCategoria), ("Precio (C$):", nudPrecio), ("Existencia:", nudExistencia) })
        {
            tabla.Controls.Add(new Label { Text = t, AutoSize = true, Anchor = AnchorStyles.Left });
            tabla.Controls.Add(c);
        }
        var ok = new Button { Text = "&Guardar", AutoSize = true };
        var cancelar = new Button { Text = "&Cancelar", AutoSize = true, DialogResult = DialogResult.Cancel };
        var pie = new FlowLayoutPanel { Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft, Height = 44, Padding = new Padding(8) };
        pie.Controls.AddRange(new Control[] { cancelar, ok });
        Controls.Add(tabla); Controls.Add(pie);
        AcceptButton = ok; CancelButton = cancelar;

        Load += (_, _) =>
        {
            txtCodigo.Text = producto.Codigo; txtNombre.Text = producto.Nombre;
            if (producto.CategoriaId != 0) cboCategoria.SelectedValue = producto.CategoriaId;
            nudPrecio.Value = producto.Precio; nudExistencia.Value = producto.Existencia;
        };
        ok.Click += (_, _) =>
        {
            errores.Clear();
            if (string.IsNullOrWhiteSpace(txtCodigo.Text)) { errores.SetError(txtCodigo, "Obligatorio."); return; }
            if (txtNombre.Text.Trim().Length < 3) { errores.SetError(txtNombre, "Mínimo 3 caracteres."); return; }
            if (nudPrecio.Value <= 0) { errores.SetError(nudPrecio, "Debe ser mayor que cero."); return; }
            producto.Codigo = txtCodigo.Text.Trim().ToUpperInvariant();
            producto.Nombre = txtNombre.Text.Trim();
            producto.CategoriaId = (int)cboCategoria.SelectedValue!;
            producto.Precio = nudPrecio.Value;
            producto.Existencia = (int)nudExistencia.Value;
            DialogResult = DialogResult.OK;
        };
    }
}
