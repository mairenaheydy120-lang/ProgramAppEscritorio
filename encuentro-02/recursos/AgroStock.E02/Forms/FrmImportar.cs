using System.Diagnostics;
using AgroStock.Data;
using AgroStock.Models;

namespace AgroStock.Forms;

/// <summary>
/// Programación concurrente: importa un CSV grande sin congelar la interfaz.
/// Compara la versión bloqueante (hilo de UI) con Task.Run + IProgress + CancellationToken.
/// </summary>
public class FrmImportar : Form
{
    private readonly ProgressBar barra = new() { Dock = DockStyle.Top, Height = 26 };
    private readonly Label lbl = new() { Dock = DockStyle.Top, Height = 28, Text = "Seleccione un archivo CSV (productos_importar.csv)." };
    private readonly Button btnBloqueante = new() { Text = "Importar en el hilo de la UI (se congela)", AutoSize = true };
    private readonly Button btnSegundoPlano = new() { Text = "Importar en segundo plano", AutoSize = true };
    private readonly Button btnCancelar = new() { Text = "Cancelar", AutoSize = true, Enabled = false };
    private readonly Label lblReloj = new() { AutoSize = true };
    private readonly System.Windows.Forms.Timer reloj = new() { Interval = 100 };
    private CancellationTokenSource? cts;
    private static readonly object candado = new();   // sincronización del contador compartido
    private int importados;

    public FrmImportar()
    {
        Text = "Importar productos – programación concurrente";
        StartPosition = FormStartPosition.CenterParent;
        ClientSize = new Size(620, 170);
        FormBorderStyle = FormBorderStyle.FixedDialog;

        var botones = new FlowLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(6) };
        botones.Controls.AddRange(new Control[] { btnBloqueante, btnSegundoPlano, btnCancelar, lblReloj });
        Controls.Add(botones);
        Controls.Add(barra);
        Controls.Add(lbl);

        // El reloj demuestra si el hilo de UI está libre: si se detiene, la UI está bloqueada.
        reloj.Tick += (_, _) => lblReloj.Text = "UI viva: " + DateTime.Now.ToString("HH:mm:ss.f");
        reloj.Start();

        btnBloqueante.Click += (_, _) =>
        {
            if (ElegirArchivo() is not { } ruta) return;
            // ❌ Todo el trabajo corre en el hilo de la interfaz: la ventana deja de responder.
            Importar(ruta, null, CancellationToken.None);
            lbl.Text = $"Importados {importados} productos (la UI estuvo congelada).";
        };

        btnSegundoPlano.Click += async (_, _) =>
        {
            if (ElegirArchivo() is not { } ruta) return;
            cts = new CancellationTokenSource();
            // IProgress captura el contexto de la UI: Report() se ejecuta en el hilo de la interfaz.
            var progreso = new Progress<int>(pct => { barra.Value = pct; lbl.Text = $"Importando… {pct} %"; });
            CambiarEstado(ocupado: true);
            var sw = Stopwatch.StartNew();
            try
            {
                // ✅ El trabajo pesado corre en un hilo del ThreadPool.
                await Task.Run(() => Importar(ruta, progreso, cts.Token));
                lbl.Text = $"Listo: {importados} productos en {sw.Elapsed.TotalSeconds:N1} s.";
            }
            catch (OperationCanceledException)
            {
                lbl.Text = "Importación cancelada: se revirtió la transacción (ningún cambio guardado).";
            }
            catch (Exception ex)
            {
                lbl.Text = "Error: " + ex.Message;
            }
            finally
            {
                CambiarEstado(ocupado: false);
                cts.Dispose();
                cts = null;
            }
        };

        btnCancelar.Click += (_, _) => cts?.Cancel(); // detención controlada: se pide, no se fuerza
        FormClosing += (_, e) => { if (cts is not null) { e.Cancel = true; lbl.Text = "Cancele primero la importación."; } };
    }

    private string? ElegirArchivo()
    {
        using var dlg = new OpenFileDialog { Filter = "CSV (*.csv)|*.csv", Title = "Archivo a importar" };
        return dlg.ShowDialog(this) == DialogResult.OK ? dlg.FileName : null;
    }

    private void CambiarEstado(bool ocupado)
    {
        btnBloqueante.Enabled = btnSegundoPlano.Enabled = !ocupado;
        btnCancelar.Enabled = ocupado;
        UseWaitCursor = ocupado;
    }

    /// <summary>Se ejecuta en un hilo de trabajo: NO debe tocar controles directamente.</summary>
    private void Importar(string ruta, IProgress<int>? progreso, CancellationToken token)
    {
        var lineas = File.ReadAllLines(ruta).Skip(1).Where(l => l.Trim().Length > 0).ToArray();
        var repo = new ProductoRepository();
        lock (candado) importados = 0;

        using var cn = Db.Abrir();
        using var tx = cn.BeginTransaction();
        for (int i = 0; i < lineas.Length; i++)
        {
            if (token.IsCancellationRequested)
            {
                tx.Rollback();
                token.ThrowIfCancellationRequested();
            }

            var c = lineas[i].Split(';');
            var p = new Producto
            {
                Codigo = c[0], Nombre = c[1], CategoriaId = int.Parse(c[2]),
                Precio = decimal.Parse(c[3], System.Globalization.CultureInfo.InvariantCulture),
                Existencia = int.Parse(c[4])
            };
            repo.Insertar(p, cn, tx);
            Thread.Sleep(10); // simula validaciones lentas para que el efecto se vea en clase

            lock (candado) importados++;
            progreso?.Report((i + 1) * 100 / lineas.Length);
        }
        tx.Commit();
    }
}
