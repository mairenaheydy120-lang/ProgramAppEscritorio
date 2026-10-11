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
    id: 'quiz', emoji: '🧠', title: 'Quiz de autoevaluación E1', build: () => QUIZ_E1, onExit: o.onExit, onEnd: o.onEnd,
    render: (q, ctx, i) => { ctx.area.append(h('p', { class: 'q', html: `${i + 1}. ${rich(q.q)}` })); pickOptions(ctx, q.o, q.c, q.e, { label: `Pregunta ${i + 1}` }); }
  });
}

/* Repaso con «Ver respuesta» (folleto: las 7 preguntas originales). */
function renderReview(host, list) {
  host.replaceChildren(...list.map((q, i) => h('details', { class: 'err' }, h('summary', { html: `${i + 1}. ${rich(q.q)}` }),
    h('div', { class: 'body' }, h('ol', { class: 'pl', type: 'a' }, q.o.map(t => h('li', { html: rich(t) }))),
      h('p', { html: `<b>Respuesta:</b> ${'abcd'[q.c]}) ${rich(q.o[q.c])}` }), h('p', { html: rich(q.e) })))));
}
