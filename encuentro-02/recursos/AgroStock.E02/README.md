# AgroStock – versión 2 (Encuentro 2)

CRUD sobre **SQLite** con ADO.NET (`Microsoft.Data.Sqlite`) e importación de productos en **segundo plano**.

## Cómo ejecutarla
1. Abrir `AgroStock.E02.csproj` en Visual Studio 2022 (el paquete NuGet se restaura solo; requiere Internet la primera vez).
2. F5. La primera ejecución crea `agrostock.db` junto al `.exe` a partir de `../agrostock.sql`.
3. Botón **Importar CSV (hilos)** → elegir `../productos_importar.csv` (500 filas).
   - *Importar en el hilo de la UI*: observe que el reloj se detiene (UI congelada).
   - *Importar en segundo plano*: el reloj sigue, la barra avanza y se puede **Cancelar** (rollback).
   - Para repetir la importación, elimine `agrostock.db` (los códigos IMP-xxxx ya existirán).

## Qué muestra
| Tema del programa | Dónde verlo |
|---|---|
| Introducción a BD y lenguaje SQL | `../agrostock.sql` (DDL, DML, consultas de práctica) |
| Clases para la gestión de BD | `Data/Db.cs` (SqliteConnection), `Data/ProductoRepository.cs` (SqliteCommand, SqliteDataReader, parámetros) |
| Controles de acceso a BD | `DataGridView` + `BindingSource`, `ComboBox` con `DataSource/DisplayMember/ValueMember` |
| Operaciones CRUD | `Listar`, `Insertar`, `Actualizar`, `Eliminar` |
| Hilos, estados, sincronización, detención controlada | `Forms/FrmImportar.cs` y el proyecto de consola `../DemoHilos` |
