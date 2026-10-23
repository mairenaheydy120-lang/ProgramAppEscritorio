/* Motor de rondas (quizzes y juegos) + banco de preguntas del Encuentro 1. Requiere site.js. */
const rich = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const QUIZ_E1 = [
  { q: '¿Qué hace `Application.Run(new FrmPrincipal())`?', o: ['Compila el proyecto', 'Muestra el formulario e inicia el bucle de mensajes', 'Crea la base de datos', 'Cierra la aplicación'], c: 1,
    e: 'Muestra el formulario y arranca el bucle de mensajes, que convierte cada acción del usuario en un evento. No compila, no crea bases de datos ni cierra nada.' },
  { q: '¿Qué control es el más adecuado para capturar la categoría de un producto de una lista cerrada?', o: ['TextBox', 'Label', 'ComboBox con DropDownList', 'Button'], c: 2,
    e: 'Con `DropDownStyle = DropDownList` la persona solo elige de la lista; así no aparecen categorías mal escritas.' },
  { q: 'En un manejador `KeyPress`, ¿qué logra `e.Handled = true`?', o: ['Cierra el formulario', 'Descarta la tecla pulsada', 'Convierte la tecla a mayúscula', 'Guarda el producto'], c: 1,
    e: '`Handled = true` indica que la tecla ya fue atendida y debe descartarse; así se filtran caracteres no permitidos.' },
  { q: '¿Qué operador suscribe un método a un evento en C#?', o: ['=', '==', '+=', '=>'], c: 2,
    e: '`btnGuardar.Click += BtnGuardar_Click;` agrega el manejador a la lista de suscriptores del evento.' },
  { q: '¿Cuál es la diferencia entre `ShowDialog()` y `Show()`?', o: ['No hay diferencia', 'ShowDialog abre una ventana modal y devuelve DialogResult', 'Show es más rápido', 'ShowDialog solo sirve para MessageBox'], c: 1,
    e: '`ShowDialog` bloquea la ventana dueña hasta cerrarse y devuelve un `DialogResult`; `Show` abre una ventana no modal.' },
  { q: '¿Qué significa el `&` en el texto "&Archivo" de un menú?', o: ['Es un error', 'Crea la tecla de acceso Alt+A', 'Pone la palabra en negrita', 'Agrega un separador'], c: 1,
    e: 'El `&` antes de una letra crea la tecla de acceso: "&Archivo" se abre con Alt+A y la A aparece subrayada.' },
  { q: '¿En qué evento se puede cancelar el cierre de una ventana?', o: ['Load', 'Click', 'FormClosing', 'TextChanged'], c: 2,
    e: '`FormClosing` se dispara antes de cerrar y su `e.Cancel = true` permite cancelar el cierre, por ejemplo tras preguntar «¿Desea salir?».' },
  { q: 'En AgroStock v1, ¿qué estructura guarda los productos y avisa a la cuadrícula de cada cambio?', o: ['Un arreglo string[]', 'BindingList<Producto>', 'Un Dictionary sin tipo', 'Un archivo de texto'], c: 1,
    e: '`BindingList<Producto>` notifica a la cuadrícula cada alta, cambio o baja. En el Encuentro 2 se reemplazará por SQLite sin cambiar la interfaz.' },
  { q: '¿Qué componente muestra el mensaje de error junto al control, sin ventana emergente?', o: ['MessageBox', 'ErrorProvider', 'StatusStrip', 'OpenFileDialog'], c: 1,
    e: '`ErrorProvider` pone un icono junto al control con el mensaje, y la ventana permanece abierta para que la persona corrija.' },
  { q: '¿Qué propiedades de FrmProducto hacen que Enter equivalga a Guardar y Esc a Cancelar?', o: ['DefaultButton y EscapeButton', 'AcceptButton y CancelButton', 'DialogResult y Result', 'TabIndex y TabStop'], c: 1,
    e: '`AcceptButton = btnGuardar` hace que Enter guarde y `CancelButton = btnCancelar` hace que Esc cancele.' }
];

const QUIZ_E2 = [
  { q: '¿Qué sentencia SQL corresponde a la operación Read del CRUD?', o: ['INSERT', 'SELECT', 'UPDATE', 'DELETE'], c: 1,
    e: '`SELECT` lee datos (Read). `INSERT` crea, `UPDATE` modifica y `DELETE` elimina.' },
  { q: '¿Por qué se usan parámetros (`$f`) en lugar de concatenar texto en SQL?', o: ['Porque son más cortos', 'Para evitar la inyección SQL y errores de formato', 'Porque SQLite no acepta comillas', 'No hay diferencia'], c: 1,
    e: 'El valor viaja separado del SQL y el motor nunca lo interpreta como código: «\' OR 1=1 --» se compara como texto.' },
  { q: '¿Qué método de `SqliteCommand` se usa para un INSERT sin resultados?', o: ['ExecuteReader', 'ExecuteNonQuery', 'ExecuteScalar', 'Read'], c: 1,
    e: '`ExecuteNonQuery` ejecuta INSERT, UPDATE y DELETE; `ExecuteReader` es para SELECT y `ExecuteScalar` devuelve un solo valor.' },
  { q: '¿Por qué una ventana Windows Forms «no responde» durante una tarea larga?', o: ['Porque falta memoria', 'Porque el hilo de la interfaz está ocupado y no procesa eventos', 'Porque la base está cerrada', 'Por un virus'], c: 1,
    e: 'El hilo de la interfaz dibuja la ventana y atiende eventos; si ejecuta una tarea de 30 segundos, no puede hacer nada más.' },
  { q: 'Un hilo que ejecuta `Thread.Sleep(1000)` está en el estado:', o: ['Unstarted', 'Running', 'WaitSleepJoin', 'Stopped'], c: 2,
    e: '`Sleep`, `Join` y un `lock` ocupado ponen al hilo en `WaitSleepJoin`: bloqueado esperando.' },
  { q: 'Dos hilos hacen `contador++` un millón de veces cada uno sin `lock`. El resultado final:', o: ['Siempre es 2 000 000', 'Puede ser menor que 2 000 000', 'Siempre es 1 000 000', 'Lanza una excepción'], c: 1,
    e: '`contador++` es leer, sumar y escribir; si los hilos se intercalan se pierden incrementos (condición de carrera).' },
  { q: '¿Cuál es la forma correcta de detener una tarea en .NET?', o: ['Thread.Abort()', 'Cerrar la aplicación', 'Solicitar la cancelación con CancellationToken y que la tarea la revise', 'Poner el hilo en null'], c: 2,
    e: 'La detención es cooperativa: `cts.Cancel()` pide parar y la tarea revisa el token, hace `Rollback` y sale.' },
  { q: 'Una entrada de mercadería hace INSERT en movimientos y UPDATE de la existencia. ¿Cómo se garantiza que se guarden las dos o ninguna?', o: ['Con dos conexiones distintas', 'Con una transacción: BeginTransaction y Commit', 'Ejecutando primero el UPDATE', 'Con un ComboBox'], c: 1,
    e: 'En una transacción nada es definitivo hasta `Commit`; si ocurre un error antes, se hace `Rollback` y la base queda como estaba.' },
  { q: '¿Qué hace `await Task.Run(() => Importar(...))` en un manejador de Click?', o: ['Congela la ventana hasta terminar', 'Ejecuta el trabajo en el ThreadPool y espera sin bloquear la interfaz', 'Cierra el formulario', 'Crea una base de datos nueva'], c: 1,
    e: '`Task.Run` lleva el trabajo al ThreadPool y `await` libera el hilo de la interfaz mientras tanto; al terminar se continúa en la UI.' },
  { q: '¿Qué ventaja tiene `Interlocked.Increment` frente a `contador++` entre varios hilos?', o: ['Es más corto de escribir', 'Es una operación atómica: no se pierden incrementos', 'Evita usar CancellationToken', 'Solo funciona en la interfaz'], c: 1,
    e: '`Interlocked.Increment` hace leer-sumar-escribir como una sola operación indivisible; `contador++` puede perder cuentas.' }
];

const QUIZ_E3 = [
  { q: '¿Qué hace un ORM?', o: ['Diseña formularios', 'Traduce entre objetos del programa y tablas de la base de datos', 'Comprime la base de datos', 'Genera reportes PDF'], c: 1,
    e: 'Un ORM (mapeador objeto-relacional) convierte clases en tablas y filas en objetos; el programador trabaja con objetos y el ORM genera el SQL.' },
  { q: 'En EF Core, ¿qué método envía a la base los cambios pendientes?', o: ['Commit()', 'SaveChanges()', 'ExecuteNonQuery()', 'Update()'], c: 1,
    e: '`SaveChanges()` genera los INSERT, UPDATE y DELETE necesarios y los ejecuta en una transacción. `Update()` solo marca el objeto como modificado.' },
  { q: '¿Cuándo se ejecuta realmente una consulta LINQ de EF Core?', o: ['Al escribir Where', 'Al enumerarla (ToList, First, foreach)', 'Al compilar', 'Al cerrar la aplicación'], c: 1,
    e: 'Es la ejecución diferida: la consulta se arma con `Where`, `OrderBy`… y solo va a la base cuando se enumera.' },
  { q: '¿Por qué el total del reporte Excel se escribe como fórmula `=SUM(...)`?', o: ['Porque es más bonito', 'Para que se recalcule si el usuario cambia un valor', 'Porque ClosedXML no admite números', 'No importa'], c: 1,
    e: 'Con `FormulaA1` el libro sigue siendo una hoja de cálculo viva: si cambia un precio o una existencia, los totales se actualizan.' },
  { q: '¿Qué código de estado HTTP indica éxito?', o: ['200', '404', '500', '301'], c: 0,
    e: '`200 OK` indica que la petición salió bien. 404 es «no encontrado», 500 es error del servidor y 301 es una redirección.' },
  { q: '¿Qué excepción aparece típicamente cuando no hay conexión a Internet al usar `HttpClient`?', o: ['NullReferenceException', 'HttpRequestException', 'FormatException', 'IndexOutOfRangeException'], c: 1,
    e: '`HttpRequestException` indica que la petición no pudo completarse (sin red, DNS, servidor inaccesible). Se captura para avisar sin cerrar el programa.' },
  { q: 'En AgroStock v3 la llamada a Mockaroo se hace con `Http.Send`. ¿Qué se observa mientras llega la respuesta?', o: ['La ventana sigue respondiendo con normalidad', 'La ventana no responde un instante, hasta recibir la respuesta', 'La importación se cancela sola', 'La aplicación se cierra'], c: 1,
    e: '`Http.Send` es síncrona: bloquea el hilo de la interfaz hasta recibir la respuesta. El reto 3 propone `await Task.Run(...)` para evitarlo.' },
  { q: 'Una base ya creada con `EnsureCreated` y usted agrega una propiedad al modelo. ¿Qué ocurre?', o: ['EF actualiza las tablas solo', 'No cambia nada: hay que borrar agrostock.db (o usar migraciones)', 'La aplicación borra los datos sin avisar', 'EF cambia de motor de base de datos'], c: 1,
    e: '`EnsureCreated` solo crea la base si no existe; no la actualiza. En el aula se borra `agrostock.db` de `bin\\Debug\\net8.0-windows`; en proyectos mayores se usan migraciones.' },
  { q: 'Al guardar con `SaveChanges` se repite un código de producto. ¿Qué excepción lanza EF Core y dónde está la causa real?', o: ['SqliteException directamente, sin envoltorio', 'DbUpdateException; la causa está en ex.InnerException (código 2067)', 'FormatException', 'NullReferenceException'], c: 1,
    e: 'EF envuelve el error de la base en `DbUpdateException`. Con `when (ex.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 })` se avisa del código repetido sin cerrar el programa.' },
  { q: '¿Dónde conviene guardar la clave de API de Mockaroo y qué no se debe hacer con ella?', o: ['En appsettings.json (o una variable de entorno); no publicarla en un repositorio público', 'Escrita dentro de cada formulario; compartirla en redes', 'En el nombre del archivo .csv', 'En el texto de un Label'], c: 0,
    e: 'La clave es un secreto: vive en configuración (`appsettings.json`) o en una variable de entorno (reto 4) y no se sube a repositorios públicos.' }
];

/* Lista de opciones con retroalimentación; `ok` es el índice de la correcta en `opts`. */
function pickOptions(ctx, opts, ok, explain, o = {}) {
  const order = shuffle(opts.map((_, k) => k)), btns = [];
  const list = h('div', { class: 'opts' + (o.mono ? ' mono' : ''), role: 'group', 'aria-label': o.label || 'Opciones de respuesta' });
  order.forEach((k, n) => {
    const b = h('button', {
      class: 'opt', type: 'button', onclick: () => {
        if (list.classList.contains('locked')) return;
        list.classList.add('locked'); sfx('click');
        b.classList.add(k === ok ? 'right' : 'wrong'); btns[order.indexOf(ok)].classList.add('right');
        ctx.answer(k === ok, explain);
      }
    }, h('span', { class: 'ltr', 'aria-hidden': 'true' }, 'abcd'[n]), h('span', { html: o.mono ? `<code>${esc(opts[k])}</code>` : rich(opts[k]) }));
    btns.push(b); list.append(b);
  });
  ctx.area.append(list);
}

function finishScreen(host, o) {
  const pass = o.pass ?? .6, pct = Math.round(o.score / o.total * 100), passed = o.score / o.total >= pass;
  const d = saveScore(o.id, o.score, o.total, pass), isNew = passed && awardBadge(o.id);
  sfx(passed ? 'completado' : 'error'); if (passed) confetti();
  host.replaceChildren(h('div', { class: 'g-end', role: 'status' },
    h('div', { class: 'big-e', 'aria-hidden': 'true' }, moodFor(pct)),
    h('h3', null, passed ? '¡Juego completado!' : 'Casi lo logra'),
    h('p', null, `Obtuvo ${o.score} de ${o.total} (${pct} %). Mejor puntaje: ${d.best} de ${d.total}.`),
    passed ? h('p', null, h('span', { class: 'pill ok' }, `🏅 ${isNew ? 'Insignia nueva' : 'Insignia conseguida'}: ${BADGES[o.id][1]}`)) : h('p', null, 'Necesita al menos 60 % para ganar la insignia. ¡Inténtelo otra vez!'),
    h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'sbtn', onclick: o.onAgain }, '🔁 Jugar de nuevo'), o.onExit ? h('button', { class: 'sbtn ghost', onclick: o.onExit }, '← Todos los juegos') : null)));
  if (o.onEnd) o.onEnd();
}

/* o: {id, emoji, title, build():items, render(item, ctx, i), pass?, onExit?, onEnd?}.
   ctx.answer(ok, mensaje) cierra la ronda: suma puntaje, racha y sonidos. */
function runRounds(host, o) {
  const items = o.build(); let i = 0, score = 0, streak = 0, done = false;
  const mood = h('span', { class: 'mood-e', 'aria-hidden': 'true' }, MOODS[0]), fill = h('i'), txt = h('span', { class: 'mood-t' }), pts = h('span', { class: 'pts' });
  const live = h('div', { class: 'sr', role: 'status', 'aria-live': 'polite' });
  const area = h('div', { class: 'g-area', tabindex: '-1' }), fb = h('div', { class: 'g-fb', 'aria-live': 'polite' });
  const next = h('button', { class: 'sbtn', hidden: true, onclick: () => { i++; if (i < items.length) show(); else finishScreen(host, { ...o, score, total: items.length, onAgain: () => runRounds(host, o) }); } });
  const paint = () => {
    const pct = Math.round((i + (done ? 1 : 0)) / items.length * 100);
    fill.style.width = pct + '%'; mood.textContent = moodFor(pct);
    txt.textContent = `Ronda ${i + 1} de ${items.length}`; pts.textContent = `⭐ ${score * 10} pts` + (streak >= 2 ? ` · 🔥 ${streak}` : '');
  };
  const ctx = {
    area,
    answer(ok, msg, extra) {
      if (done) return; done = true;
      if (ok) { score++; streak++; } else streak = 0;
      const hot = ok && streak % 3 === 0;
      sfx(hot ? 'nivel' : ok ? 'acierto' : 'error');
      fb.className = 'g-fb ' + (ok ? 'ok' : 'bad');
      fb.replaceChildren(h('b', null, ok ? '✅ ¡Correcto! ' : '❌ Todavía no. '), typeof msg === 'string' ? h('span', { html: rich(msg) }) : msg, hot ? h('div', { class: 'streak' }, `🔥 ¡${streak} seguidas!`) : null, extra || null);
      live.textContent = `${ok ? 'Correcto' : 'Incorrecto'}. Puntaje ${score} de ${i + 1}.` + (hot ? ` ¡${streak} seguidas!` : '');
      next.textContent = i + 1 < items.length ? 'Siguiente →' : 'Ver resultado'; next.hidden = false; paint();
    }
  };
  function show() {
    done = false; fb.className = 'g-fb'; fb.replaceChildren(); next.hidden = true; area.replaceChildren();
    o.render(items[i], ctx, i); paint(); if (i > 0) area.focus({ preventScroll: true });
  }
  host.replaceChildren(h('h3', { class: 'g-title' }, `${o.emoji} ${o.title}`),
    h('div', { class: 'mood' }, mood, h('span', { class: 'prog-bar big', 'aria-hidden': 'true' }, fill), txt, pts),
    h('div', { class: 'g-card' }, area, fb, next), live);
  show();
}

function makeQuiz(host, o = {}) {
  runRounds(host, {
    id: o.id || 'quiz', emoji: '🧠', title: o.title || 'Quiz de autoevaluación E1', build: () => o.list || QUIZ_E1, onExit: o.onExit, onEnd: o.onEnd,
    render: (q, ctx, i) => { ctx.area.append(h('p', { class: 'q', html: `${i + 1}. ${rich(q.q)}` })); pickOptions(ctx, q.o, q.c, q.e, { label: `Pregunta ${i + 1}` }); }
  });
}

/* Repaso con «Ver respuesta» (folleto: las 7 preguntas originales). */
function renderReview(host, list) {
  host.replaceChildren(...list.map((q, i) => h('details', { class: 'err' }, h('summary', { html: `${i + 1}. ${rich(q.q)}` }),
    h('div', { class: 'body' }, h('ol', { class: 'pl', type: 'a' }, q.o.map(t => h('li', { html: rich(t) }))),
      h('p', { html: `<b>Respuesta:</b> ${'abcd'[q.c]}) ${rich(q.o[q.c])}` }), h('p', { html: rich(q.e) })))));
}
