# AgroStock – versión 1 (Encuentro 1)

Aplicación Windows Forms en C# (.NET 8) para el inventario de un agroservicio. Datos en memoria.

## Cómo ejecutarla
1. Instalar **Visual Studio 2022 Community** con la carga de trabajo *Desarrollo de escritorio de .NET*.
2. Abrir `AgroStock.E01.csproj` (Archivo → Abrir → Proyecto o solución).
3. Pulsar **F5**.

Desde consola (con el SDK de .NET 8 instalado en Windows): `dotnet run`

## Qué muestra
| Tema del programa | Dónde verlo |
|---|---|
| Estructura de una aplicación GUI | `Program.cs` (punto de entrada, `Application.Run`) |
| Controles en un formulario | `FrmProducto.cs` (TextBox, ComboBox, NumericUpDown, DateTimePicker, TableLayoutPanel) |
| Manejo de eventos | `Click`, `KeyPress`, `TextChanged`, `CellDoubleClick`, `FormClosing`, `Tick` |
| Menús y barras de herramientas | `CrearMenu()` y `CrearBarraHerramientas()` en `FrmPrincipal.cs` |
| Cajas de diálogo | `MessageBox`, `SaveFileDialog`, `FontDialog`, `ColorDialog`, `FrmProducto` modal |

> Los formularios se construyen por código para que se lean completos. En clase también se usa el diseñador de Visual Studio: el resultado es equivalente (el diseñador genera el mismo código en `*.Designer.cs`).
