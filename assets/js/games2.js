/* Juegos del Encuentro 2. Se carga después de site.js, quiz.js y games.js: reutiliza sus motores y reemplaza la lista GAMES. */
Object.assign(BADGES, {
  'e2-restr': ['🔑', 'Elige la restricción'], 'e2-ado': ['🔍', 'Detective de ADO.NET'], 'e2-hilos': ['🧵', 'Ordena hilos y transacciones'],
  'e2-bug': ['🐛', 'Caza el bug E2'], 'e2-quiz': ['🧠', 'Quiz de autoevaluación E2']
});
QUIZ_ID = 'e2-quiz'; QUIZ_LABEL = 'Quiz E2';

/* ---------- 1. Elige la restricción ---------- */
const COLS = [
  ['`id` de productos: identifica cada fila', 'PRIMARY KEY', 'La clave primaria identifica de forma única cada fila.'],
  ['`codigo` (FER-001): no puede repetirse entre productos', 'UNIQUE', '`UNIQUE` rechaza un valor repetido; el error se captura con el código extendido 2067.'],
  ['`categoria_id`: debe existir en la tabla categorias', 'FOREIGN KEY', 'La clave foránea (`REFERENCES categorias(id)`) impide categorías inexistentes.'],
  ['`precio`: debe ser mayor que cero', 'CHECK', '`CHECK (precio > 0)` es una regla que cada fila debe cumplir.'],
  ['`nombre` del producto: obligatorio, no puede quedar vacío', 'NOT NULL', '`NOT NULL` impide que la columna quede sin valor.'],
  ['`existencia`: nunca puede ser negativa', 'CHECK', '`CHECK (existencia >= 0)`: si una SALIDA deja negativo, falla con el código 275.'],
  ['`producto_id` de movimientos: debe ser un producto real', 'FOREIGN KEY', 'Por eso no se puede eliminar un producto que tiene movimientos (código 787).'],
  ['`nombre` de categorías: no se repite entre categorías', 'UNIQUE', 'Dos categorías con el mismo nombre se rechazan con `UNIQUE`.'],
  ['`tipo` de movimientos: solo ENTRADA o SALIDA', 'CHECK', "`CHECK (tipo IN ('ENTRADA', 'SALIDA'))` limita los valores permitidos."],
  ['`id` de movimientos: identifica cada movimiento', 'PRIMARY KEY', 'Toda tabla necesita su clave primaria.']
];
const RCTRL = { 'PRIMARY KEY': ['🔑', 'identifica la fila'], 'FOREIGN KEY': ['🔗', 'apunta a otra tabla'], UNIQUE: ['☝️', 'sin repetirse'], CHECK: ['✅', 'regla de la fila'], 'NOT NULL': ['🚫', 'obligatorio'] };

function gameRestr(host, cb) {
  runRounds(host, {
    ...cb, id: 'e2-restr', emoji: '🔑', title: 'Elige la restricción', build: () => shuffle(COLS).slice(0, 8),
    render([label, ok, why], ctx) {
      const slot = h('div', { class: 'slot', role: 'group', 'aria-label': 'Zona de la columna donde se coloca la restricción' }, 'Suelte aquí la restricción');
      const pick = name => {
        if (slot.dataset.done) return; slot.dataset.done = '1'; sfx('click');
        slot.className = 'slot filled ' + (name === ok ? 'right' : 'wrong');
        slot.replaceChildren(h('span', { class: 'mock mono', 'aria-hidden': 'true' }, name), h('small', null, name));
        chips.forEach(c => c.classList.add('locked'));
        ctx.answer(name === ok, name === ok ? why : `Debía ser ${ok}. ${why}`);
      };
      const chips = Object.entries(RCTRL).map(([name, [ic, d]]) => {
        const b = h('button', { class: 'chip', type: 'button', 'aria-label': `${name}, ${d}. Pulse Enter para colocarla en la columna.` }, h('span', { 'aria-hidden': 'true' }, ic), h('b', null, name), h('small', null, d));
        makeDrag(b, [slot], () => pick(name), () => pick(name)); return b;
      });
      ctx.area.append(h('p', { class: 'q' }, 'Arrastre a la columna la restricción adecuada (o pulse Enter sobre ella):'),
        h('div', { class: 'mockwin' }, h('div', { class: 'mock-t' }, '🗄️ agrostock.sql · CREATE TABLE'), h('div', { class: 'mock-row' }, h('label', { html: rich(label) }), slot)),
        h('div', { class: 'toolbox', role: 'group', 'aria-label': 'Restricciones disponibles' }, chips));
    }
  });
}

/* ---------- 2. Detective de ADO.NET ---------- */
const ADO = [
  { hint: 'Ejecuta un INSERT: no devuelve filas', code: 'cmd.[?]();', ok: 'ExecuteNonQuery', bad: ['ExecuteReader', 'ExecuteScalar', 'Read'], why: '`ExecuteNonQuery` ejecuta INSERT, UPDATE y DELETE.' },
  { hint: 'Recorre las filas de un SELECT', code: 'using var rd = cmd.[?]();\nwhile (rd.Read()) { /* ... */ }', ok: 'ExecuteReader', bad: ['ExecuteNonQuery', 'ExecuteScalar', 'Fill'], why: '`ExecuteReader` devuelve un lector que avanza fila por fila.' },
  { hint: 'Obtiene un solo valor: SELECT COUNT(*)', code: 'var total = (long)cmd.[?]();', ok: 'ExecuteScalar', bad: ['ExecuteReader', 'ExecuteNonQuery', 'Read'], why: '`ExecuteScalar` devuelve la primera columna de la primera fila.' },
  { hint: 'Confirma todas las operaciones de la transacción', code: 'tx.[?]();', ok: 'Commit', bad: ['Rollback', 'Dispose', 'Close'], why: '`Commit` vuelve definitivos los cambios; `Rollback` los descarta.' },
  { hint: 'Descarta todo lo hecho dentro de la transacción', code: 'tx.[?]();   // nada queda a medias', ok: 'Rollback', bad: ['Commit', 'Begin', 'Save'], why: '`Rollback` revierte la transacción y la base queda como estaba.' },
  { hint: 'Envía el valor del usuario separado del SQL', code: 'cmd.Parameters.[?]("$f", txtBuscar.Text);', ok: 'AddWithValue', bad: ['Concat', 'Insert', 'Append'], why: 'Con `AddWithValue` el valor viaja aparte y nunca se interpreta como SQL.' },
  { hint: 'Código extendido de «código repetido» (UNIQUE)', code: 'catch (SqliteException ex) when (ex.SqliteExtendedErrorCode == [?])', ok: '2067', bad: ['787', '275', '19'], why: '2067 = `SQLITE_CONSTRAINT_UNIQUE`.' },
  { hint: 'Código extendido de «producto con movimientos» (clave foránea)', code: 'catch (SqliteException ex) when (ex.SqliteExtendedErrorCode == [?])', ok: '787', bad: ['2067', '275', '5'], why: '787 = `SQLITE_CONSTRAINT_FOREIGNKEY`.' },
  { hint: 'Código extendido cuando la existencia quedaría negativa (CHECK)', code: 'catch (SqliteException ex) when (ex.SqliteExtendedErrorCode == [?])', ok: '275', bad: ['2067', '787', '1'], why: '275 = `SQLITE_CONSTRAINT_CHECK`.' },
  { hint: 'Une el comando a la transacción abierta', code: 'cmd.[?] = tx;', ok: 'Transaction', bad: ['CommandText', 'Parameters', 'Connection'], why: 'Con una transacción abierta, el comando debe declararla con `cmd.Transaction = tx`.' },
  { hint: 'Lo que el usuario VE en el ComboBox', code: 'cboCategoria.[?] = "Nombre";', ok: 'DisplayMember', bad: ['ValueMember', 'DataSource', 'SelectedValue'], why: '`DisplayMember` es el texto visible; `ValueMember` es lo que el programa guarda (la clave foránea).' }
];
const adoCode = (e, shown) => `// ${e.hint}\n${e.code.replace('[?]', shown)}`;
function gameAdo(host, cb) {
  runRounds(host, {
    ...cb, id: 'e2-ado', emoji: '🔍', title: 'Detective de ADO.NET', build: () => shuffle(ADO).slice(0, 10),
    render(e, ctx) {
      const pre = codeBlock(adoCode(e, '[?]'));
      ctx.area.append(h('p', { class: 'q' }, '¿Qué falta en este fragmento?'), pre);
      const ans = ctx.answer;
      pickOptions({ area: ctx.area, answer(ok, m) { pre.innerHTML = adoCode(e, e.ok).split('\n').map(hlCs).join('\n'); ans(ok, m); } }, [e.ok, ...e.bad], 0, e.why, { mono: true, label: 'Opciones' });
    }
  });
}

/* ---------- 3. Ordena hilos y transacciones ---------- */
const PROJ2 = [
  { title: '¿En qué estado está el hilo en cada situación?', rows: ['Creado con new Thread(...), aún sin iniciar', 'Después de llamar a Start()', 'Mientras ejecuta Thread.Sleep(1500)', 'Cuando terminó su método'], cards: ['Unstarted', 'Running', 'WaitSleepJoin', 'Stopped'], mono: true },
  { title: '¿Qué rol cumple cada archivo de AgroStock v2?', rows: ['Abre la conexión y crea la base la primera vez', 'Concentra todo el SQL parametrizado', 'Importa el CSV en segundo plano', 'Demuestra la condición de carrera en consola'], cards: ['Db.cs', 'ProductoRepository.cs', 'FrmImportar.cs', 'DemoHilos/Program.cs'], mono: true },
  { title: '¿En qué orden ocurre la importación en segundo plano?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['Se pulsa Importar: se crea el CancellationTokenSource y el Progress<int>', 'await Task.Run(...) lleva Importar al ThreadPool', 'En cada vuelta se revisa el token, se inserta y se llama a Report', 'Sin cancelar ni fallar: tx.Commit() deja los datos definitivos'], mono: false },
  { title: '¿En qué orden se registra un movimiento?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['BeginTransaction()', 'INSERT en movimientos', 'UPDATE de la existencia', 'Commit()'], mono: true }
];
const gameHilos = (host, cb) => gameProyecto(host, cb, 'e2-hilos', PROJ2);

/* ---------- 4. Caza el bug E2 ---------- */
const BUGS2 = [
  { err: "Síntoma: al buscar «O'Brien» se lanza SqliteException de sintaxis", code: 'cmd.CommandText = "SELECT * FROM productos WHERE nombre = \'" + txtBuscar.Text + "\'";', o: ['cmd.CommandText = "... WHERE nombre = $f"; cmd.Parameters.AddWithValue("$f", txtBuscar.Text);', 'Quitar las comillas simples del SQL', "Reemplazar ' por espacio en el TextBox", 'Usar ExecuteScalar'], c: 0, why: 'Concatenar rompe el SQL y permite inyección. El parámetro envía el valor aparte.' },
  { err: 'Síntoma: la ventana dice «No responde» al importar 500 productos', code: 'private void BtnIniciar_Click(object? sender, EventArgs e)\n{\n    Importar(ruta, progreso, token);\n}', o: ['private async void ...: await Task.Run(() => Importar(ruta, progreso, token));', 'Agregar Thread.Sleep(1) en Importar', 'Llamar Importar(...).Wait();', 'Subir la prioridad del hilo de la interfaz'], c: 0, why: 'El trabajo corre en el hilo de la interfaz. `await Task.Run` lo mueve al ThreadPool sin bloquear.' },
  { err: "InvalidOperationException: acceso al control 'barra' desde un subproceso distinto", code: 'await Task.Run(() =>\n{\n    for (int i = 0; i <= 100; i++)\n        barra.Value = i;\n});', o: ['Usar progreso.Report(i) con un Progress<int> creado en la interfaz', 'Poner barra.Value dentro de un lock', 'Cambiar Task.Run por Task.Delay', 'Usar try/catch y omitir el error'], c: 0, why: 'Solo el hilo de la interfaz toca controles. `Progress<int>` ejecuta su manejador allí.' },
  { err: 'Síntoma: al repetir un código la aplicación se cierra con una excepción', code: 'repo.Insertar(p);\nCargar();', o: ['try { repo.Insertar(p); } catch (SqliteException ex) when (ex.SqliteExtendedErrorCode == 2067) { /* avisar */ }', 'Quitar UNIQUE de la tabla', 'Insertar dos veces para estar seguro', 'Cambiar Insertar por Eliminar'], c: 0, why: 'La base rechaza el duplicado con la restricción UNIQUE; el programa debe capturar la excepción y avisar.' },
  { err: 'Síntoma: tras algunas descargas, las demás tareas esperan para siempre', code: 'await semaforo.WaitAsync();\nDescargar();\nsemaforo.Release();', o: ['try { Descargar(); } finally { semaforo.Release(); }', 'Quitar WaitAsync', 'Llamar Release dos veces', 'Usar Thread.Abort'], c: 0, why: 'Si `Descargar` falla, el permiso no se devuelve. `finally` lo libera siempre.' },
  { err: 'Síntoma: el total insertado a veces no coincide con lo guardado', code: '// varios hilos ejecutan:\ninsertados++;', o: ['Interlocked.Increment(ref insertados);', 'insertados = insertados + 1;', 'Thread.Sleep(10);', 'Declarar insertados como string'], c: 0, why: '`++` es leer, sumar y escribir: se pierden incrementos. `Interlocked.Increment` es atómico.' },
  { err: 'PlatformNotSupportedException al detener el hilo', code: 'hilo.Abort();', o: ['cts.Cancel(); y que la tarea revise token.IsCancellationRequested', 'hilo.Kill();', 'hilo = null;', 'Environment.Exit(0);'], c: 0, why: '`Thread.Abort` no existe en .NET moderno. La detención es cooperativa con `CancellationToken`.' },
  { err: "SQLite Error 1: 'no such table: productos'", code: 'if (File.Exists(Ruta)) return;   // en Db.Inicializar()', o: ['Borrar el agrostock.db vacío de bin\\Debug\\net8.0-windows\\ y volver a ejecutar', 'Cambiar SELECT por INSERT', 'Agregar agrostock.db al proyecto como vacío', 'Quitar PRAGMA foreign_keys'], c: 0, why: 'Quedó una base vacía y `Inicializar` no la recrea. Al borrarla se crea de nuevo desde agrostock.sql.' },
  { err: 'InvalidOperationException: el comando debe tener una transacción asociada', code: 'using var tx = cn.BeginTransaction();\nusing var cmd = cn.CreateCommand();\ncmd.CommandText = "INSERT INTO movimientos ...";\ncmd.ExecuteNonQuery();', o: ['Agregar cmd.Transaction = tx; antes de ExecuteNonQuery()', 'Quitar BeginTransaction', 'Llamar tx.Commit() antes del INSERT', 'Cerrar la conexión'], c: 0, why: 'Con una transacción abierta, cada comando debe declararla con `cmd.Transaction = tx`.' },
  { err: 'Síntoma: al cancelar quedan 250 productos a medias en la base', code: 'if (token.IsCancellationRequested)\n    return;', o: ['tx.Rollback(); token.ThrowIfCancellationRequested();', 'tx.Commit(); return;', 'Insertar los productos que faltan', 'Reiniciar el equipo'], c: 0, why: 'Al cancelar hay que hacer `Rollback` para que no quede nada a medias y salir con `OperationCanceledException`.' }
];
const gameBug2 = (host, cb) => gameBug(host, cb, 'e2-bug', BUGS2);

GAMES = [
  { id: 'e2-restr', desc: 'Elija PK, FK, UNIQUE, CHECK o NOT NULL para cada columna de AgroStock.', run: gameRestr },
  { id: 'e2-ado', desc: '10 rondas: complete el código ADO.NET y los códigos de error de SQLite.', run: gameAdo },
  { id: 'e2-hilos', desc: 'Ordene estados de hilo, archivos y pasos de la importación y de las transacciones.', run: gameHilos },
  { id: 'e2-bug', desc: 'Corrija errores típicos: inyección SQL, ventana congelada, carrera, rollback.', run: gameBug2 },
  { id: 'e2-quiz', desc: '10 preguntas con retroalimentación explicativa.', run: (host, cb) => makeQuiz(host, { ...cb, id: 'e2-quiz', title: 'Quiz de autoevaluación E2', list: QUIZ_E2 }) }
];
