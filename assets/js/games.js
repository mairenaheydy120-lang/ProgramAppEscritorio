/* Juegos del Encuentro 1 y panel «Mi progreso». Requiere site.js y quiz.js. */

/* Arrastre con puntero (ratón/táctil). Pulsar o Enter ejecuta onClick; arrastrar sobre una zona ejecuta onDrop(zona). */
function makeDrag(el, zones, onDrop, onClick) {
  let id = null, sx = 0, sy = 0, moved = false, ghost = null, hit = null;
  const find = e => zones.find(z => { const r = z.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { if (e.button || e.target.closest('[data-nodrag]')) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false; });
  el.addEventListener('pointermove', e => {
    if (id !== e.pointerId) return;
    if (!moved) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return;
      moved = true; try { el.setPointerCapture(id); } catch (x) { }
      ghost = el.cloneNode(true); ghost.classList.add('dragghost'); document.body.append(ghost);
    }
    ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
    const z = find(e); if (z !== hit) { if (hit) hit.classList.remove('over'); hit = z; if (hit) hit.classList.add('over'); }
  });
  const end = (e, cancel) => {
    if (id !== e.pointerId) return; id = null;
    if (ghost) { ghost.remove(); ghost = null; }
    if (hit) hit.classList.remove('over');
    const z = hit; hit = null;
    if (moved) { el._dragged = true; setTimeout(() => { el._dragged = false; }, 0); if (!cancel && z) onDrop(z); }
  };
  el.addEventListener('pointerup', e => end(e, false)); el.addEventListener('pointercancel', e => end(e, true));
  if (onClick) el.addEventListener('click', e => { if (!el._dragged) onClick(e); });
}
const codeBlock = text => h('pre', { class: 'codebox', tabindex: '0', html: text.split('\n').map(hlCs).join('\n').replace('[?]', '<mark class="qm">¿?</mark>') });

/* ---------- 1. Arrastra el control correcto ---------- */
const FIELDS = [
  ['Precio del fertilizante (con 2 decimales)', 'NumericUpDown', 'Es un número con decimales: `NumericUpDown` evita letras y permite `DecimalPlaces = 2`.'],
  ['Categoría del producto (Fertilizantes, Semillas, Herbicidas…)', 'ComboBox', 'Es una lista cerrada: `ComboBox` con `DropDownList` evita categorías mal escritas.'],
  ['Nombre del producto', 'TextBox', 'Es texto libre: un `TextBox` con `MaxLength` basta.'],
  ['Fecha de vencimiento', 'DateTimePicker', 'Es una fecha: `DateTimePicker` ofrece calendario y evita formatos inválidos.'],
  ['Existencia en bodega (quintales)', 'NumericUpDown', 'Es una cantidad con límites: `NumericUpDown` con `Minimum` y `Maximum`.'],
  ['Código del producto (ej. FERT-018)', 'TextBox', 'Es texto corto con formato propio; se filtra con el evento `KeyPress`.'],
  ['Unidad de medida: quintal, libra, litro o unidad', 'ComboBox', 'Son pocas opciones fijas: lista desplegable cerrada.'],
  ['Fecha de ingreso al inventario', 'DateTimePicker', 'Otra fecha: `DateTimePicker`, con `Value = DateTime.Today` por omisión.'],
  ['Observaciones del proveedor', 'TextBox', 'Texto largo: `TextBox` con `Multiline = true`.']
];
const CTRL = { TextBox: ['🔤', 'texto libre'], ComboBox: ['🔽', 'lista desplegable'], NumericUpDown: ['🔢', 'número'], DateTimePicker: ['📅', 'fecha'] };
const MOCK = { TextBox: 'Escriba aquí…', ComboBox: 'Seleccione ▾', NumericUpDown: '0.00 ⬍', DateTimePicker: '11/10/2026 ▾' };

function gameDrag(host, cb) {
  runRounds(host, {
    ...cb, id: 'drag', emoji: '🧩', title: 'Arrastra el control correcto', build: () => shuffle(FIELDS).slice(0, 8),
    render([label, ok, why], ctx) {
      const slot = h('div', { class: 'slot', role: 'group', 'aria-label': 'Zona del formulario donde se coloca el control' }, 'Suelte aquí el control');
      const pick = name => {
        if (slot.dataset.done) return; slot.dataset.done = '1'; sfx('click');
        slot.className = 'slot filled ' + (name === ok ? 'right' : 'wrong');
        slot.replaceChildren(h('span', { class: 'mock', 'aria-hidden': 'true' }, MOCK[name]), h('small', null, name));
        chips.forEach(c => c.classList.add('locked'));
        ctx.answer(name === ok, name === ok ? why : `Debía ser ${ok}. ${why}`);
      };
      const chips = Object.entries(CTRL).map(([name, [ic, d]]) => {
        const b = h('button', { class: 'chip', type: 'button', 'aria-label': `${name}, ${d}. Pulse Enter para colocarlo en el formulario.` }, h('span', { 'aria-hidden': 'true' }, ic), h('b', null, name), h('small', null, d));
        makeDrag(b, [slot], () => pick(name), () => pick(name)); return b;
      });
      ctx.area.append(h('p', { class: 'q' }, 'Arrastre al formulario el control adecuado para este campo (o pulse Enter sobre el control):'),
        h('div', { class: 'mockwin' }, h('div', { class: 'mock-t' }, '🪟 FrmProducto'), h('div', { class: 'mock-row' }, h('label', null, label), slot)),
        h('div', { class: 'toolbox', role: 'group', 'aria-label': 'Cuadro de herramientas' }, chips));
    }
  });
}

/* ---------- 2. Detective de eventos ---------- */
const EVT = [
  { ev: 'Click', hint: 'Se ejecuta cuando la persona pulsa el botón «Guardar»', obj: 'BtnGuardar', args: 'object? sender, EventArgs e', body: '    if (!Validar()) return;\n    DialogResult = DialogResult.OK;' },
  { ev: 'KeyPress', hint: 'Se ejecuta al pulsar una tecla dentro del cuadro de código', obj: 'TxtCodigo', args: 'object? sender, KeyPressEventArgs e', body: "    if (!char.IsLetterOrDigit(e.KeyChar) && e.KeyChar != '-')\n        e.Handled = true;" },
  { ev: 'TextChanged', hint: 'Se ejecuta cada vez que cambia el texto, mientras se escribe', obj: 'TxtBuscar', args: 'object? sender, EventArgs e', body: '    Filtrar(txtBuscar.Text);' },
  { ev: 'FormClosing', hint: 'Se ejecuta antes de que la ventana se cierre', obj: 'FrmPrincipal', args: 'object? sender, FormClosingEventArgs e', body: '    if (MessageBox.Show("¿Salir?", "AgroStock", MessageBoxButtons.YesNo) == DialogResult.No)\n        e.Cancel = true;' },
  { ev: 'CellFormatting', hint: 'Se ejecuta al dibujar cada celda de la cuadrícula', obj: 'DgvProductos', args: 'object? sender, DataGridViewCellFormattingEventArgs e', body: '    if (EsExistenciaBaja(e.RowIndex))\n        e.CellStyle.BackColor = Color.Orange;' },
  { ev: 'Load', hint: 'Se ejecuta antes de mostrar la ventana por primera vez', obj: 'FrmPrincipal', args: 'object? sender, EventArgs e', body: '    cboCategoria.Items.AddRange(categorias);\n    CargarProductos();' },
  { ev: 'ValueChanged', hint: 'Se ejecuta al cambiar el número del NumericUpDown', obj: 'NudArea', args: 'object? sender, EventArgs e', body: '    lblTotal.Text = (nudArea.Value * nudDosis.Value).ToString("N2");' },
  { ev: 'CellDoubleClick', hint: 'Se ejecuta al hacer doble clic sobre una fila de la cuadrícula', obj: 'DgvProductos', args: 'object? sender, DataGridViewCellEventArgs e', body: '    if (e.RowIndex >= 0) EditarProducto();' },
  { ev: 'SelectedIndexChanged', hint: 'Se ejecuta cuando la persona elige otra categoría de la lista', obj: 'CboCategoria', args: 'object? sender, EventArgs e', body: '    FiltrarPorCategoria(cboCategoria.SelectedItem?.ToString());' },
  { ev: 'Tick', hint: 'Se ejecuta cada segundo, cuando el temporizador dispara', obj: 'Reloj', args: 'object? sender, EventArgs e', body: '    tslHora.Text = DateTime.Now.ToString("HH:mm:ss");' },
  { ev: 'KeyDown', hint: 'Se ejecuta al presionar una tecla; sirve para el atajo Ctrl+F', obj: 'FrmPrincipal', args: 'object? sender, KeyEventArgs e', body: '    if (e.Control && e.KeyCode == Keys.F)\n        txtBuscar.Focus();' }
];
const evCode = (e, shown) => `// ${e.hint}\nprivate void ${e.obj}_${shown}(${e.args})\n{\n${e.body}\n}`;

function gameEventos(host, cb) {
  runRounds(host, {
    ...cb, id: 'eventos', emoji: '🎯', title: 'Detective de eventos', build: () => shuffle(EVT).slice(0, 10),
    render(e, ctx) {
      const opts = [e.ev, ...shuffle(EVT.filter(x => x !== e)).slice(0, 3).map(x => x.ev)], pre = codeBlock(evCode(e, '[?]'));
      ctx.area.append(h('p', { class: 'q' }, '¿Qué evento se está manejando en este fragmento?'), pre);
      const ans = ctx.answer; // al responder se revela el nombre completo del manejador
      pickOptions({ area: ctx.area, answer(ok, m) { pre.innerHTML = evCode(e, e.ev).split('\n').map(hlCs).join('\n'); ans(ok, m); } }, opts, 0, `Es el evento \`${e.ev}\`: ${e.hint.charAt(0).toLowerCase() + e.hint.slice(1)}.`, { mono: true, label: 'Eventos posibles' });
    }
  });
}

/* ---------- 3. Arma el proyecto ---------- */
// Cada ronda: `rows` fijas (rol u orden) y `cards` en el orden correcto, que se barajan.
const PROJ = [
  { title: '¿Qué rol cumple cada archivo de AgroStock?', rows: ['Punto de entrada: Main llama a Application.Run', 'Modelo del dominio: clase con Codigo, Nombre, Precio, Existencia', 'Diálogo modal que captura un producto y lo valida', 'Ventana principal: menú, barras, cuadrícula y búsqueda'], cards: ['Program.cs', 'Producto.cs', 'FrmProducto.cs', 'FrmPrincipal.cs'], mono: true },
  { title: '¿Qué contiene cada archivo del formulario?', rows: ['Configuración: net8.0-windows y UseWindowsForms', 'Código generado por el diseñador: InitializeComponent()', 'Lógica escrita a mano: eventos y validación', 'Recursos del formulario (íconos, textos); no se edita'], cards: ['AgroStock.E01.csproj', 'FrmProducto.Designer.cs', 'FrmProducto.cs', 'FrmProducto.resx'], mono: true },
  { title: '¿En qué orden se ejecuta el arranque?', rows: ['1.º', '2.º', '3.º', '4.º'], cards: ['Main() inicia con ApplicationConfiguration.Initialize()', 'Se crea new FrmPrincipal(): el constructor llama a InitializeComponent()', 'Application.Run muestra el formulario e inicia el bucle de mensajes', 'Ocurre Load y luego se atienden los eventos del usuario (Click, KeyPress…)'], mono: false }
];

function gameProyecto(host, cb) {
  runRounds(host, {
    ...cb, id: 'proyecto', emoji: '🏗️', title: 'Arma el proyecto', build: () => PROJ,
    render(p, ctx) {
      let order; do { order = shuffle(p.cards.map((_, k) => k)); } while (order.every((v, k) => v === k));
      let locked = false;
      const slots = p.rows.map(() => h('div', { class: 'slot3' })), items = [];
      const place = () => order.forEach((v, k) => slots[k].replaceChildren(items[v]));
      const move = (v, to) => { if (locked || to < 0 || to >= order.length) return; const from = order.indexOf(v); [order[from], order[to]] = [order[to], order[from]]; place(); sfx('click'); items[v].focus(); live.textContent = `${p.cards[v]}: posición ${to + 1} de ${order.length}.`; };
      p.cards.forEach((name, v) => {
        const c = h('div', { class: 'c3', tabindex: '0', 'aria-label': `${name}. Flechas arriba y abajo para moverlo.`, onkeydown: e => { if (e.key === 'ArrowUp') { e.preventDefault(); move(v, order.indexOf(v) - 1); } if (e.key === 'ArrowDown') { e.preventDefault(); move(v, order.indexOf(v) + 1); } } },
          h('span', { class: 'grip', 'aria-hidden': 'true' }, '⠿'), h('span', { class: p.mono ? 'mono' : '', style: 'flex:1' }, name),
          h('button', { type: 'button', class: 'mv', 'data-nodrag': '', 'aria-label': 'Subir ' + name, onclick: () => move(v, order.indexOf(v) - 1) }, '▲'),
          h('button', { type: 'button', class: 'mv', 'data-nodrag': '', 'aria-label': 'Bajar ' + name, onclick: () => move(v, order.indexOf(v) + 1) }, '▼'));
        makeDrag(c, slots, z => move(v, slots.indexOf(z))); items.push(c);
      });
      const live = h('div', { class: 'sr', 'aria-live': 'polite' });
      const rows = p.rows.map((r, k) => h('li', { class: 'row3' }, h('div', { class: 'role' }, r), slots[k]));
      const check = h('button', {
        class: 'sbtn', type: 'button', onclick: () => {
          locked = true; check.hidden = true; let bad = 0;
          order.forEach((v, k) => { if (v !== k) { bad++; rows[k].classList.add('bad'); rows[k].append(h('div', { class: 'fix' }, 'Correcto: ', h('span', { class: p.mono ? 'mono' : '' }, p.cards[k]))); } else rows[k].classList.add('good'); });
          ctx.answer(!bad, bad ? `${bad} de ${order.length} quedaron fuera de lugar; las filas rojas muestran la respuesta.` : 'Cada pieza quedó en su lugar.');
        }
      }, '✔ Comprobar');
      place();
      ctx.area.append(h('p', { class: 'q' }, p.title), h('p', { class: 'hint' }, 'Arrastre cada tarjeta a su fila, o use ▲ ▼ y las flechas del teclado.'), h('ol', { class: 'rows3' }, rows), check, live);
    }
  });
}

/* ---------- 4. Caza el bug ---------- */
const BUGS = [
  { err: "CS0246: no se encontró el tipo o espacio de nombres 'Form'", code: 'using System;\nusing System.Drawing;\n\npublic partial class FrmProducto : Form\n{\n    private ComboBox cboCategoria = new ComboBox();\n}', o: ['using System.Windows.Forms;', 'Escribir form con minúscula', 'Instalar un paquete NuGet para Form', 'Quitar using System.Drawing;'], c: 0, why: 'Falta el espacio de nombres donde viven `Form` y `ComboBox`: `using System.Windows.Forms;`.' },
  { err: "CS0104: 'Timer' es una referencia ambigua entre 'System.Threading.Timer' y 'System.Windows.Forms.Timer'", code: 'using System.Threading;\nusing System.Windows.Forms;\n\nprivate Timer reloj = new Timer();', o: ['private System.Windows.Forms.Timer reloj = new System.Windows.Forms.Timer();', 'private timer reloj = new timer();', 'private Timer reloj = null;', 'using System.Timers;'], c: 0, why: 'Dos espacios de nombres definen `Timer`; se escribe el nombre completo `System.Windows.Forms.Timer`, como hace el Designer.' },
  { err: 'Síntoma: no deja escribir números y sí deja escribir letras', code: 'private void TxtPrecio_KeyPress(object? sender, KeyPressEventArgs e)\n{\n    // Solo debe permitir dígitos y Retroceso\n    if (char.IsDigit(e.KeyChar))\n        e.Handled = true;\n}', o: ['if (!char.IsControl(e.KeyChar) && !char.IsDigit(e.KeyChar)) e.Handled = true;', 'if (char.IsLetter(e.KeyChar)) e.Handled = false;', 'e.Handled = char.IsDigit(e.KeyChar);', 'if (char.IsDigit(e.KeyChar)) return;'], c: 0, why: '`e.Handled = true` descarta la tecla: debe aplicarse a lo que NO es dígito ni tecla de control (como Retroceso).' },
  { err: "Síntoma: la persona escribe «Fertilisantes» y se guarda mal", code: 'cboCategoria.Items.AddRange(new object[] { "Fertilizantes", "Semillas", "Herbicidas" });\ncboCategoria.DropDownStyle = ComboBoxStyle.DropDown;', o: ['cboCategoria.DropDownStyle = ComboBoxStyle.DropDownList;', 'cboCategoria.Enabled = false;', 'cboCategoria.MaxLength = 5;', 'cboCategoria.Sorted = true;'], c: 0, why: '`DropDown` permite escribir texto libre; `DropDownList` obliga a elegir de la lista.' },
  { err: "CS1061: 'FormClosingEventArgs' no contiene una definición de 'Handled'", code: 'private void FrmPrincipal_FormClosing(object? sender, FormClosingEventArgs e)\n{\n    var r = MessageBox.Show("¿Salir de AgroStock?", "Confirmar", MessageBoxButtons.YesNo);\n    if (r == DialogResult.No)\n        e.Handled = true;\n}', o: ['e.Cancel = true;', 'e.Handled = false;', 'Close();', 'e.Result = DialogResult.No;'], c: 0, why: 'Para cancelar el cierre, `FormClosingEventArgs` usa `e.Cancel = true`; `Handled` es de `KeyPress`.' },
  { err: 'Síntoma: el producto nunca se agrega a la lista', code: 'using var dlg = new FrmProducto(p);\ndlg.Show(this);\nif (dlg.DialogResult == DialogResult.OK)\n    productos.Add(p);', o: ['if (dlg.ShowDialog(this) == DialogResult.OK) productos.Add(p);', 'dlg.Hide(this);', 'dlg.Show(this, DialogResult.OK);', 'productos.Add(p); dlg.Show(this);'], c: 0, why: '`Show` no espera: la comprobación corre de inmediato. `ShowDialog` bloquea y devuelve el `DialogResult`.' },
  { err: "CS0070: el evento 'Click' solo puede aparecer a la izquierda de += o -=", code: 'btnGuardar.Click = BtnGuardar_Click;', o: ['btnGuardar.Click += BtnGuardar_Click;', 'btnGuardar.Click == BtnGuardar_Click;', 'btnGuardar.Click => BtnGuardar_Click;', 'btnGuardar.Click(BtnGuardar_Click);'], c: 0, why: 'Los eventos se suscriben con `+=`, que agrega el manejador a la lista de suscriptores.' },
  { err: "CS0119: 'FrmPrincipal' es un tipo, que no es válido en el contexto especificado", code: '[STAThread]\nprivate static void Main()\n{\n    ApplicationConfiguration.Initialize();\n    Application.Run(FrmPrincipal);\n}', o: ['Application.Run(new Forms.FrmPrincipal());', 'Application.Run(typeof(FrmPrincipal));', 'Application.Run(FrmPrincipal());', 'Application.Start(FrmPrincipal);'], c: 0, why: '`Application.Run` necesita un objeto formulario: se crea con `new`.' },
  { err: 'Síntoma: el diálogo se cierra aunque el nombre sea inválido', code: 'private void BtnGuardar_Click(object? sender, EventArgs e)\n{\n    if (txtNombre.Text.Trim().Length < 3)\n        errores.SetError(txtNombre, "Escriba al menos 3 caracteres.");\n    DialogResult = DialogResult.OK;\n}', o: ['Agregar return; después de SetError, con llaves en el if', 'Cambiar OK por Cancel', 'Quitar el ErrorProvider', 'Llamar a Close() antes del if'], c: 0, why: 'Sin `return`, se ejecuta `DialogResult = OK` y el modal se cierra. Con la validación fallida debe salir antes.' }
];

function gameBug(host, cb) {
  runRounds(host, {
    ...cb, id: 'bug', emoji: '🐛', title: 'Caza el bug', build: () => shuffle(BUGS).slice(0, 8),
    render(b, ctx) {
      const bug = h('div', { class: 'bug', 'aria-hidden': 'true' }, '🐛');
      ctx.area.append(h('div', { class: 'bugrow' }, bug, h('p', { class: 'q errmsg' }, b.err)), codeBlock(b.code), h('p', { class: 'hint' }, '¿Cuál es la corrección?'));
      pickOptions({ area: ctx.area, answer(ok, m) { bug.textContent = ok ? '🎉' : '🐛'; if (ok) bug.classList.add('won'); ctx.answer(ok, m); } }, b.o, b.c, b.why, { mono: true, label: 'Correcciones posibles' });
    }
  });
}

/* ---------- hub y panel «Mi progreso» ---------- */
const GAMES = [
  { id: 'drag', desc: 'Elija el control adecuado para cada campo de AgroStock.', run: gameDrag },
  { id: 'eventos', desc: '10 rondas: lea el código y descubra qué evento es.', run: gameEventos },
  { id: 'proyecto', desc: 'Ordene archivos y pasos según su rol en AgroStock.', run: gameProyecto },
  { id: 'bug', desc: 'Encuentre la corrección de errores típicos (CS0246, CS0104…).', run: gameBug },
  { id: 'quiz', desc: '10 preguntas con retroalimentación explicativa.', run: makeQuiz }
];
const stat = id => store.get('quiz:' + id, null);

function renderProgress() {
  const ids = GAMES.map(g => g.id), earned = ids.filter(id => store.get('badge:' + id)).length, quizOk = !!(stat('quiz') && stat('quiz').passed);
  const pts = ids.reduce((s, id) => s + ((stat(id) || {}).best || 0) * 10, 0), pct = Math.round(earned / ids.length * 100);
  let sure = false;
  const reset = h('button', {
    class: 'sbtn ghost sm', type: 'button', onclick: () => {
      if (!sure) { sure = true; reset.textContent = '¿Seguro? Pulse otra vez'; setTimeout(() => { sure = false; reset.textContent = 'Borrar mi progreso'; }, 4000); return; }
      try { Object.keys(localStorage).filter(k => /^agrostock-e1:(badge|quiz):/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { }
      refresh();
    }
  }, 'Borrar mi progreso');
  $('#progreso').replaceChildren(h('h2', null, '📈 Mi progreso'),
    h('div', { class: 'mood' }, h('span', { class: 'mood-e', 'aria-hidden': 'true' }, moodFor(pct)), h('span', { class: 'prog-bar big', role: 'img', 'aria-label': `${earned} de ${ids.length} insignias` }, h('i', { style: `width:${pct}%` })), h('span', { class: 'mood-t' }, `${earned} de ${ids.length} insignias`), h('span', { class: 'pts' }, `⭐ ${pts} pts`)),
    h('ul', { class: 'badges' }, GAMES.map(g => { const on = !!store.get('badge:' + g.id), s = stat(g.id); return h('li', { class: on ? 'on' : 'off' }, h('span', { class: 'be', 'aria-hidden': 'true' }, BADGES[g.id][0]), h('b', null, BADGES[g.id][1]), h('small', null, on ? `Insignia ganada · mejor ${s.best} de ${s.total}` : s ? `Mejor ${s.best} de ${s.total} · sin insignia aún` : 'Sin jugar')); })),
    h('p', null, `Quiz E1: ${quizOk ? '✅ aprobado' : '⏳ pendiente'} · Se guarda en este navegador. `, reset));
}
function renderHub() {
  $('#gcards').replaceChildren(...GAMES.map(g => { const s = stat(g.id);
    return h('button', { class: 'card', type: 'button', onclick: () => openGame(g.id) }, h('span', { class: 'ico', 'aria-hidden': 'true' }, BADGES[g.id][0]), h('h3', null, BADGES[g.id][1]), h('p', null, g.desc),
      h('span', { class: 'pill' + (store.get('badge:' + g.id) ? ' ok' : '') }, s ? `${store.get('badge:' + g.id) ? '🏅 ' : ''}Mejor: ${s.best} de ${s.total}` : 'Sin jugar')); }));
}
const refresh = () => { renderProgress(); renderHub(); };
function openGame(id) {
  const g = GAMES.find(x => x.id === id); if (!g) return;
  sfx('click'); $('#hub').hidden = true; $('#stage').hidden = false;
  g.run($('#game'), { onExit: closeGame, onEnd: refresh });
  $('#stage').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' });
}
function closeGame() { $('#stage').hidden = true; $('#hub').hidden = false; refresh(); $('#hub').scrollIntoView({ block: 'start' }); }
