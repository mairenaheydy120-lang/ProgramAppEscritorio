/* Utilidades y componentes compartidos del sitio (extraídos de la guía AgroStock). */
/* ===== utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('agrostock-e1:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('agrostock-e1:' + k, JSON.stringify(v)); } catch (e) { } }
};
const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad2 = n => String(n).padStart(2, '0');
const fmtDate = d => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const fmtIso = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtN2 = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ===== resaltado de sintaxis ===== */
const KW = new Set('using namespace class partial public private protected internal static readonly void new return if else foreach in var bool int string decimal object null true false is as this base override const try catch out ref get set while for switch case break continue throw typeof nameof'.split(' '));
const TYPES = new Set(('Form Label TextBox ComboBox NumericUpDown DateTimePicker Button ErrorProvider MenuStrip ToolStrip StatusStrip ToolStripMenuItem ToolStripButton ToolStripLabel ToolStripTextBox ToolStripSeparator ToolStripStatusLabel ToolStripItem DataGridView Timer Point Size SizeF Producto DialogResult MessageBox MessageBoxButtons MessageBoxIcon MessageBoxDefaultButton Application ApplicationConfiguration Keys DockStyle BindingList StringBuilder CultureInfo File DateTime EventArgs KeyPressEventArgs FormClosingEventArgs CloseReason SaveFileDialog StringComparison UTF8Encoding IOException FormBorderStyle FormStartPosition AutoScaleMode ComboBoxStyle DateTimePickerFormat ToolStripItemDisplayStyle ContentAlignment SystemColors DataGridViewContentAlignment DataGridViewSelectionMode DataGridViewAutoSizeColumnMode DataGridViewTextBoxColumn IContainer Container ISupportInitialize Program FrmPrincipal FrmProducto STAThread Exception').split(' '));
function hlCs(line) {
  let out = '', i = 0, m;
  const re = /(\/\/.*$)|(\$?"(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)')|(\b\d+(?:\.\d+)?[mMfF]?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
  while ((m = re.exec(line))) {
    out += esc(line.slice(i, m.index)); i = re.lastIndex;
    if (m[1]) out += `<span class="tc">${esc(m[1])}</span>`;
    else if (m[2] || m[3]) out += `<span class="ts">${esc(m[0])}</span>`;
    else if (m[4]) out += `<span class="tn">${esc(m[0])}</span>`;
    else {
      const w = m[5];
      out += KW.has(w) ? `<span class="tk">${w}</span>` : TYPES.has(w) ? `<span class="tt">${w}</span>` : w;
    }
  }
  return out + esc(line.slice(i));
}
function hlXml(line) {
  const s = esc(line);
  if (/^\s*&lt;!--/.test(s)) return `<span class="tc">${s}</span>`;
  return s.replace(/(&lt;\/?)([\w.]+)/g, '$1<span class="tk">$2</span>');
}
const hl = (line, lang) => lang === 'xml' ? hlXml(line) : hlCs(line);

function cleanSrc(name) {
  const f = FILES[name];
  const isC = f.lang === 'xml' ? l => /^\s*<!--.*-->\s*$/.test(l) : l => /^\s*\/\/.*$/.test(l);
  const out = [];
  for (const l of f.src.split('\n').filter(l => !isC(l))) {
    if (l.trim() === '' && (out.length === 0 || out[out.length - 1].trim() === '')) continue;
    out.push(l);
  }
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return out.join('\n') + '\n';
}
const textOf = (name, mode) => mode === 'limpio' ? cleanSrc(name) : FILES[name].src;
function lineOf(name, snippet) {
  const i = FILES[name].src.split('\n').findIndex(l => l.includes(snippet));
  return i < 0 ? 0 : i + 1;
}

/* ===== visor de código ===== */
const viewers = [];
let globalMode = store.get('mode', 'comentado');
function makeViewer(names) {
  let cur = names[0];
  const tabs = h('div', { class: 'v-tabs', role: 'tablist' });
  const info = h('div', { class: 'v-info' });
  const pre = h('pre');
  const body = h('div', { class: 'v-body', tabindex: '0' }, pre);
  const bC = h('button', { 'aria-pressed': 'true', onclick: () => setMode('comentado') }, 'Comentado');
  const bL = h('button', { 'aria-pressed': 'false', onclick: () => setMode('limpio') }, 'Limpio');
  const copy = h('button', { class: 'v-copy', onclick: doCopy }, 'Copiar');
  const root = h('div', { class: 'viewer' },
    h('div', { class: 'v-bar' }, tabs, h('div', { class: 'v-actions' }, h('div', { class: 'seg', role: 'group', 'aria-label': 'Versión del código' }, bC, bL), copy)),
    info, body);
  function renderTabs() {
    tabs.replaceChildren(...names.map(n => h('button', { role: 'tab', 'aria-selected': String(n === cur), onclick: () => { cur = n; render(); } }, n)));
  }
  function render() {
    renderTabs();
    bC.setAttribute('aria-pressed', String(globalMode === 'comentado'));
    bL.setAttribute('aria-pressed', String(globalMode === 'limpio'));
    const f = FILES[cur], text = textOf(cur, globalMode).replace(/\n$/, '');
    const lines = text.split('\n');
    pre.innerHTML = lines.map((l, i) => `<div class="ln" data-n="${i + 1}"><span class="no">${i + 1}</span><span class="tx">${hl(l, f.lang) || '&#8203;'}</span></div>`).join('');
    const nc = f.src.split('\n').filter(l => f.lang === 'xml' ? /^\s*<!--/.test(l) : /^\s*\/\//.test(l)).length;
    info.textContent = globalMode === 'comentado'
      ? `${lines.length} líneas, ${nc} de ellas son comentarios que explican el código. Los comentarios no se ejecutan.`
      : `${lines.length} líneas de código sin comentarios, listas para pegar en Visual Studio.`;
  }
  function setMode(m) { globalMode = m; store.set('mode', m); viewers.forEach(v => v.render()); }
  function doCopy() {
    const text = textOf(cur, globalMode);
    const done = ok => { copy.textContent = ok ? 'Copiado' : 'Seleccione y copie (Ctrl+C)'; setTimeout(() => copy.textContent = 'Copiar', 1800); };
    const fallback = () => {
      try { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done(false); } catch (e) { done(false); }
    };
    try { navigator.clipboard.writeText(text).then(() => done(true), fallback); } catch (e) { fallback(); }
  }
  const api = {
    root, render,
    reveal(file, snippet) {
      if (!names.includes(file)) names.push(file);
      cur = file; globalMode = 'comentado'; viewers.forEach(v => v.render());
      const n = lineOf(file, snippet);
      const el = $(`.ln[data-n="${n}"]`, pre);
      if (!el) return;
      $$('.ln.flash', pre).forEach(x => x.classList.remove('flash'));
      el.classList.add('flash');
      body.scrollTop = Math.max(0, el.offsetTop - body.clientHeight / 3);
      root.scrollIntoView({ block: 'nearest', behavior: RM() ? 'auto' : 'smooth' });
      setTimeout(() => el.classList.remove('flash'), 4000);
    }
  };
  viewers.push(api); render();
  return api;
}

/* ===== registro de eventos (para los simuladores) ===== */
function makeLog(viewer, file, opts = {}) {
  const box = h('div', { class: 'logbox', 'aria-live': 'polite' }, h('div', { class: 'empty' }, 'Aquí aparecerán los eventos que se disparen.'));
  let first = true;
  return {
    box,
    clear() { box.replaceChildren(h('div', { class: 'empty' }, 'Aquí aparecerán los eventos que se disparen.')); first = true; },
    push(ev, text, snippet, fileOverride) {
      if (first) { box.replaceChildren(); first = false; }
      const f = fileOverride || file;
      const n = snippet ? lineOf(f, snippet) : 0;
      const it = h('div', { class: 'it' }, h('span', { class: 'ev' }, ev), h('span', null, text),
        n && viewer ? h('button', { onclick: () => viewer.reveal(f, snippet), title: 'Ver esta línea en el código' }, `${f.split('/').pop()} · línea ${n}`) : null);
      box.prepend(it);
      while (box.children.length > 40) box.lastChild.remove();
    }
  };
}

/* ===== extensiones compartidas ===== */
const csvQ = s => '"' + s.replace(/"/g, '""') + '"';
const COL = 'display:flex;flex-direction:column;gap:10px;min-width:0';
function copyText(text, btn) {
  const t = btn.textContent;
  const done = ok => { btn.textContent = ok ? 'Copiado' : 'Seleccione y copie (Ctrl+C)'; setTimeout(() => btn.textContent = t, 1800); };
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch (e) { done(false); }
}
// Inicializa un simulador solo cuando se acerca al área visible.
function lazy(host, init) {
  const go = () => { host.style.minHeight = ''; init(); };
  if (!('IntersectionObserver' in window)) return go();
  host.style.minHeight = '80px';
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '400px 0px' });
  io.observe(host);
}
const winBar = (t, onX) => h('div', { class: 'win-t' }, h('span', { class: 'ic' }), h('span', { class: 'tt2' }, t),
  h('div', { class: 'wb' }, h('span', null, '—'), h('span', null, '▢'), onX ? h('button', { class: 'x', 'aria-label': 'Cerrar la ventana', onclick: onX }, '✕') : h('span', null, '✕')));
function msgDialog({ text, caption, icon = 'i', buttons = ['Aceptar'], def = 0, cb }, close) {
  const col = { i: '#0078D7', q: '#0078D7', x: '#E81123', '!': 'var(--w-icon-warn)' }[icon];
  const ch = { i: 'i', q: '?', x: '✕', '!': '!' }[icon];
  const btns = buttons.map((b, i) => h('button', { class: 'w-btn' + (i === def ? ' def' : ''), onclick: () => { close(); cb && cb(b); } }, b));
  const dlg = h('div', { class: 'w-dlg', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': caption },
    h('div', { class: 'win-t' }, h('span', { class: 'ic' }), h('span', { class: 'tt2' }, caption)),
    h('div', { class: 'w-msg' }, h('span', { class: 'mi', style: `background:${col}` }, ch), h('div', { style: 'white-space:pre-line' }, text)),
    h('div', { class: 'w-foot' }, btns));
  dlg.addEventListener('keydown', e => { if (e.key === 'Escape' && buttons.includes('No')) { close(); cb && cb('No'); } });
  return { dlg, focus: () => btns[def].focus() };
}
// MessageBox modal dentro de una ventana simulada; `body` queda inerte mientras está abierto.
function winMsg(win, body, o) {
  const ov = h('div', { class: 'w-ov' });
  const m = msgDialog(o, () => { ov.remove(); body.inert = false; });
  ov.append(m.dlg); body.inert = true; win.append(ov); setTimeout(m.focus, 30);
}

/* ================= Diálogo FrmProducto simulado (se usa en los pasos 5 y 7) ================= */
function productDialog({ producto, onClose, log, container, fc }) {
  const p = producto;
  const id = 'dlg' + Math.random().toString(36).slice(2, 7);
  const cod = h('input', { class: 'w-in', id: id + 'c', maxlength: 15, value: p.Codigo, autocomplete: 'off', autocapitalize: 'off' });
  const nom = h('input', { class: 'w-in', id: id + 'n', maxlength: 60, value: p.Nombre });
  const cat = h('select', { class: 'w-in', id: id + 'k' }, h('option', { value: '' }, ''), ['Fertilizantes', 'Semillas', 'Herbicidas', 'Herramientas'].map(o => h('option', { selected: p.Categoria === o }, o)));
  const pre = h('input', { class: 'w-in', id: id + 'p', type: 'number', min: 0, max: 100000, step: '0.01', value: p.Precio ? String(p.Precio) : '0', inputmode: 'decimal' });
  const exi = h('input', { class: 'w-in', id: id + 'e', type: 'number', min: 0, max: 100000, step: '1', value: String(p.Existencia || 0), inputmode: 'numeric' });
  const vch = h('input', { type: 'checkbox', id: id + 'vc', checked: !!p.Vencimiento, 'aria-label': 'Producto con fecha de vencimiento' });
  const ven = h('input', { class: 'w-in', id: id + 'v', type: 'date', value: p.Vencimiento ? fmtIso(p.Vencimiento) : '2026-10-09', disabled: !p.Vencimiento });
  vch.addEventListener('change', () => { ven.disabled = !vch.checked; });
  const errs = {};
  const slot = k => (errs[k] = h('span', { style: 'display:contents' }));
  function setErr(k, msg) { errs[k].replaceChildren(msg ? h('span', { class: 'w-err', title: msg, role: 'img', 'aria-label': 'Error: ' + msg }, '!') : ''); }
  const field = (l, ctl, k, fid) => h('div', { class: 'w-field' }, h('label', { for: fid }, l), h('div', { class: 'w-cell' }, ctl, slot(k)));

  // KeyPress: filtro y mayúsculas (beforeinput permite descartar o cambiar la tecla antes de que llegue al cuadro)
  cod.addEventListener('beforeinput', e => {
    if (e.inputType !== 'insertText' || !e.data) return;
    for (const ch of e.data) {
      const ok = /[\p{L}\p{N}]/u.test(ch) || ch === '-';
      if (!ok) { e.preventDefault(); log && log.push('KeyPress', `tecla «${ch}»: e.Handled = true (se descarta, nunca llega al cuadro)`, 'e.Handled = true;'); return; }
    }
    const up = e.data.toUpperCase();
    if (up !== e.data) {
      e.preventDefault();
      cod.setRangeText(up, cod.selectionStart, cod.selectionEnd, 'end');
      log && log.push('KeyPress', `tecla «${e.data}»: e.KeyChar = char.ToUpperInvariant → «${up}»`, 'e.KeyChar = char.ToUpperInvariant');
    } else log && log.push('KeyPress', `tecla «${e.data}»: válida, pasa sin cambios`, 'if (char.IsControl(e.KeyChar)) return;');
  });
  cod.addEventListener('paste', () => log && log.push('Aviso', 'Pegar (Ctrl+V) no dispara KeyPress: por eso Guardar vuelve a validar', 'private void BtnGuardar_Click'));

  function guardar() {
    log && (fc ? log.push('FormClosing', 'btnGuardar tiene DialogResult = OK: el formulario intenta cerrarse y se dispara FormClosing', '') : log.push('Click', 'btnGuardar → BtnGuardar_Click(): errores.Clear() y validación', 'private void BtnGuardar_Click'));
    Object.keys(errs).forEach(k => setErr(k, ''));
    let ok = true;
    const rule = (cond, k, msg, snip) => { if (cond) { setErr(k, msg); ok = false; log && log.push('ErrorProvider', `SetError(${k}): «${msg}»`, snip); } };
    rule(cod.value.trim().length < 3, 'txtCodigo', 'Escriba al menos 3 caracteres.', 'errores.SetError(txtCodigo');
    rule(nom.value.trim().length < 3, 'txtNombre', 'Escriba al menos 3 caracteres.', 'errores.SetError(txtNombre');
    rule(cat.selectedIndex <= 0, 'cboCategoria', 'Elija una categoría.', 'errores.SetError(cboCategoria');
    rule(!(parseFloat(pre.value) > 0), 'nudPrecio', 'El precio debe ser mayor que cero.', 'errores.SetError(nudPrecio');
    if (!ok) { log && (fc ? log.push('FormClosing', 'La validación falló → e.Cancel = true: el cierre se cancela, DialogResult vuelve a None y el diálogo sigue abierto', '') : log.push('Resultado', 'return: el diálogo sigue abierto para corregir', 'if (!valido) return;')); return; }
    p.Codigo = cod.value.trim(); p.Nombre = nom.value.trim(); p.Categoria = cat.value;
    p.Precio = Math.round(parseFloat(pre.value) * 100) / 100; p.Existencia = Math.trunc(parseFloat(exi.value) || 0);
    p.Vencimiento = vch.checked && ven.value ? new Date(ven.value + 'T00:00:00') : null;
    log && log.push('Resultado', 'Producto actualizado → DialogResult = DialogResult.OK (el diálogo se cierra)', 'DialogResult = DialogResult.OK;');
    onClose('OK');
  }
  function cancelar() { log && log.push('Click', 'btnCancelar: DialogResult = Cancel (se cierra solo, sin escribir código)', 'btnCancelar.DialogResult = DialogResult.Cancel;', 'Forms/FrmProducto.Designer.cs'); onClose('Cancel'); }

  const btnG = h('button', { class: 'w-btn def', onclick: guardar }, h('u', null, 'G'), 'uardar');
  const btnC = h('button', { class: 'w-btn', onclick: cancelar }, 'Cancelar');
  const root = h('div', { class: 'w-dlg', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.Codigo ? 'Editar producto' : 'Nuevo producto' },
    h('div', { class: 'win-t' }, h('span', { class: 'ic' }), h('span', { class: 'tt2' }, p.Codigo ? 'Editar producto' : 'Nuevo producto'), h('div', { class: 'wb' }, h('button', { class: 'x', 'aria-label': 'Cerrar (Cancelar)', onclick: cancelar }, '✕'))),
    h('div', { class: 'w-body' },
      field('Código:', cod, 'txtCodigo', id + 'c'), field('Nombre:', nom, 'txtNombre', id + 'n'), field('Categoría:', cat, 'cboCategoria', id + 'k'),
      field('Precio (C$):', pre, 'nudPrecio', id + 'p'), field('Existencia:', exi, 'nudExistencia', id + 'e'),
      h('div', { class: 'w-field' }, h('label', { for: id + 'v' }, 'Vencimiento:'), h('div', { class: 'w-cell', style: 'gap:6px' }, vch, ven))),
    h('div', { class: 'w-foot' }, btnG, btnC));
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); log && log.push('AcceptButton', 'Enter equivale a pulsar Guardar', 'AcceptButton = btnGuardar;', 'Forms/FrmProducto.Designer.cs'); guardar(); }
    else if (e.key === 'Escape') { e.preventDefault(); log && log.push('CancelButton', 'Esc equivale a pulsar Cancelar', 'CancelButton = btnCancelar;', 'Forms/FrmProducto.Designer.cs'); cancelar(); }
  });
  setTimeout(() => cod.focus(), 30);
  root.fill = v => { cod.value = v.Codigo; nom.value = v.Nombre; cat.value = v.Categoria; pre.value = String(v.Precio); };
  root.pressSave = () => btnG.click();
  return root;
}
/* ===== sitio: navegación, pie, sonido, insignias ===== */
const SITE = { classroom: 'https://classroom.google.com/c/ODcwMTMyNDI1NDI1?cjc=r3escxkv', code: 'r3escxkv' };
const NAV = [
  ['guia-instalacion.html', '📘', 'Instalación', 'instalacion'], ['encuentro-01.html', '📗', 'Encuentro 1', 'e1'],
  ['guia-agrostock.html', '📙', 'Guía AgroStock', 'guia'], ['boa-01.html', '📊', 'BOA corte 1', 'boa'], ['juegos.html', '🎮', 'Juegos', 'juegos']];
const STEP_LABEL = { crear: 'Crear proyecto', entrada: 'Entrada', modelo: 'Modelo', 'diseno-dialogo': 'Diseño del diálogo', 'logica-dialogo': 'Lógica del diálogo', 'diseno-principal': 'Diseño principal', 'logica-principal': 'Lógica principal', probar: 'Probar', ejercitacion: 'Ejercitación' };
const stepHref = id => `guia-agrostock.html#${id === 'ejercitacion' ? id : 'paso-' + id}`;

const SND = {};
const isMuted = () => store.get('mute', false);
function sndOf(n) { return SND[n] || (SND[n] = new Audio(`assets/audio/${n}.mp3`)); }
function sfx(n) {
  if (isMuted()) return;
  try { const a = sndOf(n); a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
}
// iOS/Android exigen un gesto previo: se precargan los sonidos en el primer toque.
addEventListener('pointerdown', () => { try { ['acierto', 'error', 'nivel', 'completado', 'click'].forEach(n => sndOf(n).load()); } catch (e) { } }, { once: true });

function muteBtn(withText) {
  const b = h('button', { class: withText ? 'sbtn ghost' : 'ibtn', 'data-mute': '', onclick: () => { store.set('mute', !isMuted()); $$('[data-mute]').forEach(paint); if (!isMuted()) sfx('click'); } });
  function paint(x) {
    const m = isMuted(); x.textContent = (m ? '🔇' : '🔊') + (x.classList.contains('sbtn') ? (m ? ' Activar sonidos' : ' Silenciar sonidos') : '');
    x.setAttribute('aria-pressed', String(m)); x.setAttribute('aria-label', m ? 'Activar sonidos' : 'Silenciar sonidos'); x.title = m ? 'Activar sonidos' : 'Silenciar sonidos';
  }
  paint(b); return b;
}
function applyTheme() { const t = store.get('theme', ''); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme();

function siteChrome(active, sticky = true) {
  const box = h('div', { class: 'snav' });
  const menu = h('button', { class: 'ibtn menu-btn', 'aria-expanded': 'false', 'aria-controls': 'slinks', 'aria-label': 'Abrir menú', onclick: e => { const o = box.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(o)); } }, '☰');
  const theme = h('button', { class: 'ibtn', title: 'Cambiar tema', 'aria-label': 'Cambiar entre tema automático, claro y oscuro', onclick: () => { const c = store.get('theme', ''); store.set('theme', c === '' ? 'light' : c === 'light' ? 'dark' : ''); applyTheme(); } }, '🌓');
  box.append(h('a', { class: 'brand', href: 'index.html' }, '🌾 AgroStock', h('small', null, 'Programación de Aplicaciones de Escritorio')),
    h('nav', { class: 'slinks', id: 'slinks', 'aria-label': 'Secciones del sitio' }, NAV.map(([href, ic, txt, id]) => h('a', { href, 'aria-current': id === active ? 'page' : false }, `${ic} ${txt}`))),
    h('div', { class: 'tools' }, muteBtn(false), theme, menu));
  const hd = h('header', { class: 'top snavbar' + (sticky ? '' : ' static') }, box);
  document.body.prepend(hd);
}
function siteFooter() {
  const f = $('#foot'); if (!f) return;
  f.replaceChildren(h('p', { style: 'max-width:none' }, 'UNAN-Managua, CUR Matagalpa · Programación de Aplicaciones de Escritorio · Encuentro 1: 11 de octubre de 2026'),
    h('p', { style: 'max-width:none' }, 'Aula virtual: ', h('a', { href: SITE.classroom, target: '_blank', rel: 'noopener' }, 'Ir a Classroom'), ' · Código de invitación: ', h('code', null, SITE.code)),
    f.dataset.extra ? h('p', { style: 'max-width:none' }, f.dataset.extra) : null);
}
// Resalta los bloques <pre class="codebox" data-lang="cs|xml"> escritos a mano.
function highlightAll() {
  $$('pre.codebox[data-lang]').forEach(p => { const lang = p.dataset.lang; p.innerHTML = p.textContent.replace(/^\n|\n$/g, '').split('\n').map(l => hl(l, lang)).join('\n'); });
}

/* ===== motivación: confeti, insignias y puntajes ===== */
function confetti(n = 70) {
  if (RM()) return;
  const cols = ['#1A6B45', '#E8AB5E', '#9DC8E8', '#CDA9EA', '#E5484D', '#5CC68E'], box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < n; i++) box.append(h('i', { style: `left:${Math.random() * 100}%;background:${cols[i % 6]};animation-delay:${(Math.random() * .5).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.4).toFixed(2)}s;--dx:${Math.round(Math.random() * 160 - 80)}px` }));
  document.body.append(box); setTimeout(() => box.remove(), 3800);
}
const MOODS = ['😴', '🙂', '😃', '🤩', '🏆'];
const moodFor = pct => pct <= 0 ? MOODS[0] : pct < 40 ? MOODS[1] : pct < 70 ? MOODS[2] : pct < 100 ? MOODS[3] : MOODS[4];
const BADGES = { drag: ['🧩', 'Arrastra el control correcto'], eventos: ['🎯', 'Detective de eventos'], proyecto: ['🏗️', 'Arma el proyecto'], bug: ['🐛', 'Caza el bug'], quiz: ['🧠', 'Quiz de autoevaluación E1'] };
function awardBadge(id) { if (store.get('badge:' + id)) return false; store.set('badge:' + id, { fecha: fmtIso(new Date()) }); return true; }
function saveScore(id, score, total, pass = .6) {
  const k = 'quiz:' + id, d = store.get(k, {});
  d.best = Math.max(d.best || 0, score); d.total = total; d.last = score; d.intentos = (d.intentos || 0) + 1; d.passed = !!d.passed || score / total >= pass;
  store.set(k, d); return d;
}

{
  const pg = document.body.dataset.page;
  if (pg) { siteChrome(pg, document.body.dataset.sticky !== '0'); siteFooter(); highlightAll(); }
}
