/* Juegos del Encuentro 3. Se carga después de site.js, quiz.js y games.js: reutiliza sus motores y reemplaza la lista GAMES. */
Object.assign(BADGES, {
  'e3-orm': ['🧬', 'Mapea el ORM'], 'e3-linq': ['🔎', 'Detective de LINQ y EF Core'], 'e3-web': ['🌐', 'Ordena reportes y servicios web'],
  'e3-bug': ['🐛', 'Caza el bug E3'], 'e3-quiz': ['🧠', 'Quiz de autoevaluación E3']
});
QUIZ_ID = 'e3-quiz'; QUIZ_LABEL = 'Quiz E3';

/* ---------- 1. Mapea el ORM: del SQL de E2 al modelo en C# ---------- */
const ORM_ROWS = [
  ['`id INTEGER PRIMARY KEY AUTOINCREMENT`: clave primaria de productos', 'Id (convención)', 'Una propiedad llamada `Id` (o `ProductoId`) es la clave primaria por convención; no hace falta configurarla.'],
  ['`codigo TEXT NOT NULL`: el código es obligatorio', 'IsRequired()', '`e.Property(p => p.Codigo).IsRequired()` equivale a `NOT NULL`.'],
  ['`codigo UNIQUE`: el código no puede repetirse', 'HasIndex().IsUnique()', '`e.HasIndex(p => p.Codigo).IsUnique()` crea el índice único; al violarlo, el error 2067 llega dentro de `DbUpdateException`.'],
  ['`CHECK (precio > 0)`: el precio debe ser mayor que cero', 'HasCheckConstraint()', '`t.HasCheckConstraint("ck_precio", "precio > 0")` declara la regla de cada fila.'],
  ['`categoria_id REFERENCES categorias(id)`: debe existir esa categoría', 'HasForeignKey()', '`HasOne(p => p.Categoria).WithMany().HasForeignKey(p => p.CategoriaId)` declara la clave foránea.'],
  ['No se puede eliminar un producto que tiene movimientos', 'OnDelete(Restrict)', '`DeleteBehavior.Restrict` rechaza el borrado; EF lanza `DbUpdateException` y el programa avisa.'],
  ['Los `INSERT` de ejemplo de las 4 categorías', 'HasData()', '`mb.Entity<Categoria>().HasData(...)` siembra los datos iniciales cuando se crea la base.'],
  ['La tabla `productos` como colección sobre la que se consulta', 'DbSet<T>', '`public DbSet<Producto> Productos` representa la tabla y es el punto de partida de las consultas LINQ.']
];
const ORM_CHIPS = { 'Id (convención)': ['🔑', 'clave primaria'], 'IsRequired()': ['🚫', 'obligatorio'], 'HasIndex().IsUnique()': ['☝️', 'sin repetirse'], 'HasCheckConstraint()': ['✅', 'regla de la fila'],
  'HasForeignKey()': ['🔗', 'apunta a otra tabla'], 'OnDelete(Restrict)': ['🛑', 'impide borrar'], 'HasData()': ['🌱', 'datos iniciales'], 'DbSet<T>': ['📚', 'tabla como colección'] };

function gameOrm(host, cb) {
  runRounds(host, {
    ...cb, id: 'e3-orm', emoji: '🧬', title: 'Mapea el ORM', build: () => shuffle(ORM_ROWS).slice(0, 8),
    render([label, ok, why], ctx) {
      const slot = h('div', { class: 'slot', role: 'group', 'aria-label': 'Zona donde se coloca la configuración de EF Core' }, 'Suelte aquí la configuración');
      const pick = name => {
        if (slot.dataset.done) return; slot.dataset.done = '1'; sfx('click');
        slot.className = 'slot filled ' + (name === ok ? 'right' : 'wrong');
        slot.replaceChildren(h('span', { class: 'mock mono', 'aria-hidden': 'true' }, name), h('small', null, name));
        chips.forEach(c => c.classList.add('locked'));
        ctx.answer(name === ok, name === ok ? why : `Debía ser ${ok}. ${why}`);
      };
      const chips = Object.entries(ORM_CHIPS).map(([name, [ic, d]]) => {
        const b = h('button', { class: 'chip', type: 'button', 'aria-label': `${name}, ${d}. Pulse Enter para colocarla.` }, h('span', { 'aria-hidden': 'true' }, ic), h('b', { class: 'mono' }, name), h('small', null, d));
        makeDrag(b, [slot], () => pick(name), () => pick(name)); return b;
      });
      ctx.area.append(h('p', { class: 'q' }, 'En AgroStock v3 el esquema se escribe en C#. Arrastre la configuración del ORM que equivale a este fragmento de agrostock.sql (o pulse Enter sobre ella):'),
        h('div', { class: 'mockwin' }, h('div', { class: 'mock-t' }, '🧬 AgroStockContext.cs · OnModelCreating'), h('div', { class: 'mock-row' }, h('label', { html: rich(label) }), slot)),
        h('div', { class: 'toolbox', role: 'group', 'aria-label': 'Configuraciones disponibles' }, chips));
    }
  });
}

/* ---------- 2. Detective de LINQ y EF Core ---------- */
const LINQ = [
  { hint: 'Envía a la base todos los cambios pendientes', code: 'ctx.[?]();', ok: 'SaveChanges', bad: ['Commit', 'ExecuteNonQuery', 'Flush'], why: '`SaveChanges` genera y ejecuta los INSERT, UPDATE y DELETE en una transacción.' },
  { hint: 'Agrega un producto nuevo (aún no se guarda)', code: 'ctx.Productos.[?](p);\nctx.SaveChanges();', ok: 'Add', bad: ['Insert', 'Append', 'Create'], why: '`Add` marca el objeto como nuevo; el INSERT se ejecuta en `SaveChanges`.' },
  { hint: 'Elimina un producto', code: 'ctx.Productos.[?](p);\nctx.SaveChanges();', ok: 'Remove', bad: ['Delete', 'Drop', 'Clear'], why: '`Remove` marca el objeto para borrarse; el DELETE sale en `SaveChanges`.' },
  { hint: 'Filtra los productos con existencia baja', code: 'ctx.Productos.[?](p => p.Existencia < 10)', ok: 'Where', bad: ['Select', 'Include', 'Find'], why: '`Where` filtra filas (equivale al WHERE de SQL).' },
  { hint: 'Trae también la categoría de cada producto (JOIN)', code: 'ctx.Productos.[?](p => p.Categoria)', ok: 'Include', bad: ['Where', 'Select', 'Union'], why: '`Include` carga la propiedad de navegación; sin él `p.Categoria` llega en null.' },
  { hint: 'Ordena por nombre, de la A a la Z', code: 'ctx.Productos.[?](p => p.Nombre)', ok: 'OrderBy', bad: ['GroupBy', 'Where', 'Sort'], why: '`OrderBy` ordena de menor a mayor; `OrderByDescending` de mayor a menor.' },
  { hint: 'Producto de mayor precio', code: 'ctx.Productos.OrderByDescending(p => p.Precio).[?]()', ok: 'FirstOrDefault', bad: ['ToList', 'Count', 'Sum'], why: '`FirstOrDefault` toma el primero (o null si no hay): con orden descendente es el más caro.' },
  { hint: 'Valor total del inventario', code: 'decimal total = ctx.Productos.[?](p => p.Precio * p.Existencia);', ok: 'Sum', bad: ['Count', 'Average', 'Max'], why: '`Sum` suma la expresión de cada producto (precio × existencia).' },
  { hint: 'Cantidad y valor por categoría', code: 'ctx.Productos.[?](p => p.Categoria!.Nombre)', ok: 'GroupBy', bad: ['OrderBy', 'Include', 'Where'], why: '`GroupBy` agrupa las filas (equivale al GROUP BY de SQL).' },
  { hint: 'Ejecuta la consulta y devuelve una lista', code: 'return ctx.Productos.Where(p => p.Existencia < 10).[?]();', ok: 'ToList', bad: ['Where', 'Include', 'AsQueryable'], why: 'La consulta es diferida: solo va a la base cuando se enumera con `ToList`, `First`, `Count` o `foreach`.' },
  { hint: 'Búsqueda con LIKE parametrizado', code: 'EF.Functions.[?](p.Nombre, $"%{filtro}%")', ok: 'Like', bad: ['Contains', 'Equals', 'Match'], why: '`EF.Functions.Like` genera un LIKE con parámetro; el filtro nunca se concatena.' },
  { hint: 'Busca un producto por su clave primaria', code: 'var p = ctx.Productos.[?](productoId);', ok: 'Find', bad: ['Where', 'Select', 'Get'], why: '`Find` busca por clave primaria (primero en lo que ya rastrea el contexto).' },
  { hint: 'Dónde está la causa real de un DbUpdateException', code: 'catch (DbUpdateException ex) when (ex.[?] is SqliteException { SqliteExtendedErrorCode: 2067 })', ok: 'InnerException', bad: ['Message', 'StackTrace', 'Source'], why: 'EF envuelve el error de la base: la `SqliteException` real viaja en `ex.InnerException`.' }
];
const linqCode = (e, shown) => `// ${e.hint}\n${e.code.replace('[?]', shown)}`;
function gameLinq(host, cb) {
  runRounds(host, {
    ...cb, id: 'e3-linq', emoji: '🔎', title: 'Detective de LINQ y EF Core', build: () => shuffle(LINQ).slice(0, 10),
    render(e, ctx) {
      const pre = codeBlock(linqCode(e, '[?]'));
      ctx.area.append(h('p', { class: 'q' }, '¿Qué falta en este fragmento?'), pre);
      const ans = ctx.answer;
      pickOptions({ area: ctx.area, answer(ok, m) { pre.innerHTML = linqCode(e, e.ok).split('\n').map(hlCs).join('\n'); ans(ok, m); } }, [e.ok, ...e.bad], 0, e.why, { mono: true, label: 'Opciones' });
    }
  });
}

/* ---------- 3. Ordena reportes y servicios web ---------- */
const PROJ3 = [
  { title: '¿Qué rol cumple cada archivo de AgroStock v3?', rows: ['Las clases Producto, Categoria y Movimiento', 'Describe las tablas, restricciones y datos iniciales', 'CRUD con LINQ y SaveChanges, sin SQL', 'Genera el PDF (QuestPDF) y el Excel (ClosedXML)', 'Pide los productos a Mockaroo con HttpClient'],
    cards: ['Models/Producto.cs', 'Data/AgroStockContext.cs', 'Data/ProductoRepository.cs', 'Services/ReporteService.cs', 'Services/MockarooClient.cs'], mono: true },
  { title: '¿Qué significa cada código de estado HTTP?', rows: ['200', '401', '404', '500'], cards: ['OK: la petición salió bien', 'Clave de API incorrecta o ausente', 'No encontrado: el schema no existe', 'Error del servidor'], mono: false },
  { title: '¿En qué orden se estructura un reporte, de arriba hacia abajo?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['Encabezado: título, fecha y filtros', 'Detalle: una fila por producto', 'Totales y agrupaciones', 'Pie: numeración de páginas'], mono: false },
  { title: '¿En qué orden ocurre la llamada a Mockaroo?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['Se leen BaseUrl, ApiKey y Schema de appsettings.json', 'Se crea el HttpRequestMessage GET con el encabezado X-API-Key', 'Http.Send y se revisa IsSuccessStatusCode', 'JsonSerializer.Deserialize convierte el JSON en objetos'], mono: false },
  { title: '¿En qué orden se importan los productos?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['Se obtienen las filas del CSV o de Mockaroo', 'Convertir descarta las filas inválidas y las cuenta', 'InsertarVarios guarda con un solo SaveChanges', 'Se informa cuántos entraron, cuántos eran inválidos y cuántos códigos estaban repetidos'], mono: false }
];
const gameWeb = (host, cb) => gameProyecto(host, cb, 'e3-web', PROJ3);

/* ---------- 4. Caza el bug E3 ---------- */
const BUGS3 = [
  { err: 'Síntoma: agregué una propiedad al modelo y la base no tiene la columna nueva', code: 'ctx.Database.EnsureCreated();   // en Db.Inicializar()', o: ['Borrar agrostock.db de bin\\Debug\\net8.0-windows\\ y volver a ejecutar (o usar migraciones)', 'Llamar EnsureCreated() dos veces', 'Cambiar SaveChanges por Commit', 'Quitar HasData'], c: 0, why: '`EnsureCreated` no actualiza una base que ya tiene tablas. Al borrar el archivo se crea de nuevo con el modelo actual.' },
  { err: 'Síntoma: la columna Categoría de la cuadrícula sale vacía', code: 'return ctx.Productos\n    .Where(p => p.Nombre.Contains(filtro))\n    .OrderBy(p => p.Nombre)\n    .ToList();', o: ['Agregar .Include(p => p.Categoria) antes del Where', 'Cambiar ToList por ToArray', 'Quitar el OrderBy', 'Llamar ctx.SaveChanges()'], c: 0, why: 'Sin `Include`, la propiedad de navegación `Categoria` no se carga y `CategoriaNombre` queda vacío.' },
  { err: 'ObjectDisposedException al recorrer la lista que devolvió Listar()', code: 'public IQueryable<Producto> Bajos()\n{\n    using var ctx = new AgroStockContext();\n    return ctx.Productos.Where(p => p.Existencia < 10);\n}', o: ['Devolver List<Producto> y enumerar con .ToList() antes de salir del using', 'Quitar el using y no liberar nunca el contexto', 'Llamar ctx.Dispose() dos veces', 'Cambiar Where por Find'], c: 0, why: 'La consulta es diferida: se ejecuta al enumerarla, pero el contexto ya se liberó. `ToList()` la materializa dentro del `using`.' },
  { err: 'Síntoma: registro una ENTRADA, no hay error, pero la existencia no cambia', code: 'var p = ctx.Productos.Find(productoId)!;\np.Existencia += cantidad;\nctx.Movimientos.Add(new Movimiento { ProductoId = productoId, Tipo = "ENTRADA", Cantidad = cantidad });', o: ['Agregar ctx.SaveChanges(); al final', 'Agregar ctx.Productos.Add(p);', 'Llamar ctx.Database.EnsureCreated();', 'Cambiar Find por Where'], c: 0, why: 'EF solo envía los cambios a la base con `SaveChanges()`; ahí se guardan movimiento y existencia en una sola transacción.' },
  { err: 'Síntoma: al repetir un código la aplicación se cierra con DbUpdateException', code: 'ctx.Productos.Add(p);\nctx.SaveChanges();', o: ['try { ... } catch (DbUpdateException ex) when (ex.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 }) { /* avisar */ }', 'Quitar el índice único del modelo', 'Guardar dos veces para estar seguro', 'Cambiar Add por Remove'], c: 0, why: 'La base rechaza el duplicado (UNIQUE = 2067) dentro de `DbUpdateException`. El programa lo captura y avisa en vez de cerrarse.' },
  { err: 'Síntoma: IOException al generar el Excel si el archivo está abierto en Excel', code: 'libro.SaveAs(ruta);', o: ['try { libro.SaveAs(ruta); } catch (IOException) { /* pedir que cierre el archivo */ }', 'Cambiar SaveAs por Open', 'Borrar la carpeta de destino', 'Ignorar el error con catch vacío'], c: 0, why: 'Si otro programa tiene el archivo abierto, `SaveAs` falla. Se captura `IOException` y se pide cerrar el archivo.' },
  { err: 'Síntoma: «Mockaroo respondió 401»', code: '"Mockaroo": {\n  "BaseUrl": "https://api.mockaroo.com/api/generate.json",\n  "ApiKey": "<su clave de API>",\n  "Schema": "agrostock_productos"\n}', o: ['Escribir su clave real de API en appsettings.json (y que se copie a la carpeta de salida)', 'Cambiar GET por POST', 'Subir el count a 1000', 'Usar HttpClient nuevo en cada llamada'], c: 0, why: '401 significa clave incorrecta o ausente. El valor de ejemplo debe sustituirse por la clave de su cuenta.' },
  { err: 'Síntoma: el total del Excel no cambia cuando edito un precio', code: 'hoja.Cell(fila, 7).Value = p.Precio * p.Existencia;\n// ...\nhoja.Cell(fila, 7).Value = total;', o: ['hoja.Cell(fila, 7).FormulaA1 = $"D{fila}*E{fila}"; y el total con FormulaA1 = $"SUM(G2:G{fila - 1})"', 'Formatear la celda como texto', 'Congelar la fila 1', 'Cambiar la hoja a solo lectura'], c: 0, why: 'Un valor escrito es un número fijo. Con fórmulas, el libro recalcula valores y total si cambia un dato.' },
  { err: 'Síntoma: la ventana queda «No responde» un instante al pulsar «Obtener de Mockaroo»', code: 'var lista = cliente.ObtenerProductos(n);   // usa Http.Send (síncrono)', o: ['var lista = await Task.Run(() => cliente.ObtenerProductos(n));', 'Llamar lista.Wait();', 'Subir la prioridad del hilo de la interfaz', 'Reducir el Timeout a 1 segundo'], c: 0, why: 'Http.Send bloquea el hilo de la interfaz. `await Task.Run` lleva la llamada al ThreadPool, como en el Encuentro 2 (reto 3).' },
  { err: 'Síntoma: tras muchas llamadas aparecen errores de conexión agotada', code: 'public List<ProductoMockaroo> ObtenerProductos(int n)\n{\n    using var http = new HttpClient();\n    // ...\n}', o: ['private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };', 'new HttpClient() dentro de un bucle', 'Cerrar y abrir la aplicación en cada llamada', 'Quitar el Timeout'], c: 0, why: '`HttpClient` está pensado para reutilizarse: una sola instancia estática para toda la aplicación.' },
  { err: 'Síntoma: el JSON de Mockaroo llega bien pero Codigo y Nombre quedan vacíos', code: 'public class ProductoMockaroo\n{\n    public string Codigo { get; set; } = "";\n    public string Nombre { get; set; } = "";\n}', o: ['Agregar [JsonPropertyName("codigo")] y [JsonPropertyName("nombre")] a cada propiedad', 'Cambiar string por int', 'Quitar las propiedades', 'Usar Console.WriteLine'], c: 0, why: 'Los campos del JSON van en minúsculas; `[JsonPropertyName]` relaciona cada campo con su propiedad C#.' },
  { err: 'Síntoma: subí el proyecto a un repositorio público y la clave de Mockaroo quedó visible', code: '"ApiKey": "a1b2c3d4"   // appsettings.json', o: ['Cambiar la clave en Mockaroo y no subirla: usar la que indique el docente o una variable de entorno', 'Dejarla: nadie la verá', 'Ponerla en un comentario del README', 'Copiarla en cada formulario'], c: 0, why: 'La clave es un secreto. Si se publicó, se regenera; en la entrega se usa la que indique el docente o una variable de entorno (reto 4).' }
];
const gameBug3 = (host, cb) => gameBug(host, cb, 'e3-bug', BUGS3);

GAMES = [
  { id: 'e3-orm', desc: 'Relacione cada fragmento de agrostock.sql con su configuración en EF Core.', run: gameOrm },
  { id: 'e3-linq', desc: '10 rondas: complete el código LINQ y de EF Core.', run: gameLinq },
  { id: 'e3-web', desc: 'Ordene archivos, códigos HTTP, partes de un reporte y pasos de la importación.', run: gameWeb },
  { id: 'e3-bug', desc: 'Corrija errores típicos: Include, SaveChanges, DbUpdateException, 401, fórmulas.', run: gameBug3 },
  { id: 'e3-quiz', desc: '10 preguntas con retroalimentación explicativa.', run: (host, cb) => makeQuiz(host, { ...cb, id: 'e3-quiz', title: 'Quiz de autoevaluación E3', list: QUIZ_E3 }) }
];
