# AgroStock – versión 3 (Encuentro 3)

Proyecto integrador final: **Entity Framework Core** (ORM) sobre SQLite, **reportes PDF y Excel** y **consumo de un servicio web REST** (tipo de cambio USD → NIO).

## Cómo ejecutarla
1. Abrir `AgroStock.E03.csproj` en Visual Studio 2022 (restaura NuGet: EF Core SQLite, QuestPDF, ClosedXML; requiere Internet la primera vez).
2. F5. Se crea `agrostock_ef.db` con datos semilla (`EnsureCreated`).
3. Menú **Reportes** → PDF o Excel. Menú **Servicios web** → actualizar tipo de cambio.
   Sin Internet, la app usa `tipo_cambio_offline.json` y lo indica en la barra de estado.

## Qué muestra
| Tema del programa | Dónde verlo |
|---|---|
| ORM para CRUD sin SQL manual | `Data/AgroStockContext.cs`, `Data/ProductoService.cs` (LINQ, `SaveChanges`) |
| Herramienta de generación de reportes | `Services/ReporteService.cs` (QuestPDF → PDF, ClosedXML → Excel) |
| Clases para consumir servicios web | `Services/TipoCambioService.cs` (`HttpClient`, `ReadFromJsonAsync`, `XDocument`) |
| Estudio de caso | Tipo de cambio del córdoba para valorar el inventario en USD |

> Licencias: QuestPDF Community (gratuita para uso académico y organizaciones pequeñas), ClosedXML (MIT), EF Core (MIT). Servicio: https://open.er-api.com (gratuito, sin clave, requiere atribución).
