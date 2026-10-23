/* Tarea 5 · Encuentro 3: formulario en línea y generación del informe en PDF (jsPDF). */
const IND = [
  ['Trabajo colaborativo equitativo', [
    'Participé en el diseño y la programación de AgroStock v3 en la misma medida que mi pareja.',
    'Cumplí a tiempo las partes que acordamos y avisé cuando tuve dificultades.',
    'Compartí lo que aprendí y pedí ayuda cuando la necesité.']],
  ['Respeto en la coevaluación', [
    'Escuché con respeto las observaciones de mi pareja y de otros equipos durante la presentación.',
    'Mis comentarios sobre otros proyectos fueron claros, respetuosos y útiles.']],
  ['Responsabilidad y honestidad académica', [
    'Indiqué en el README las fuentes, ejemplos o IA que usé y el código entregado es propio de la pareja.',
    'Protegí la clave de API de Mockaroo y no incluí datos personales reales de clientes en las bases de prueba.']]
];
const LEVELS = [[5, 'Alcanzado'], [4, 'En proceso avanzado'], [3, 'En proceso limitado'], [2, 'No alcanzado']];
const MIN_W = 150, MAX_W = 250, KEY = 'tarea5';
const TEXT_IDS = ['nombre', 'fecha', 'compromiso', 'reflexion', 'firma', 'ffirma'];
const FLAT = IND.flatMap(([g, items]) => items.map(t => [g, t]));

const words = s => (s.trim().match(/\S+/g) || []).length;
const roundHalfUp = n => Math.floor(n + 0.5);

// Construye los indicadores
{
  const box = $('#inds'); let i = 0;
  IND.forEach(([g, items]) => {
    box.append(h('div', { class: 'grp' }, g));
    items.forEach(t => {
      const n = i++;
      box.append(h('fieldset', { class: 'ind', id: 'ind' + n }, h('legend', null, t),
        h('div', { class: 'lv' }, LEVELS.map(([v, l]) => h('label', null, h('input', { type: 'radio', name: 'i' + n, value: v }), `${v} · ${l}`)))));
    });
  });
}

const val = id => $('#' + id).value.trim();
const level = n => { const r = $(`input[name=i${n}]:checked`); return r ? +r.value : 0; };
function globalLevel() {
  const v = FLAT.map((_, n) => level(n)); if (v.includes(0)) return 0;
  return roundHalfUp(v.reduce((a, b) => a + b, 0) / v.length);
}
function updateDerived() {
  const w = words($('#reflexion').value), c = $('#cnt');
  c.textContent = `${w} palabra${w === 1 ? '' : 's'} (entre ${MIN_W} y ${MAX_W})`;
  c.className = 'cnt ' + (w === 0 ? '' : w >= MIN_W && w <= MAX_W ? 'ok' : 'bad');
  const g = globalLevel(), done = FLAT.filter((_, n) => level(n)).length;
  $('#glob').textContent = g || '—';
  $('#globd').textContent = g ? '' : `Faltan ${FLAT.length - done} indicador(es) por marcar.`;
}

// Guardado local
function snapshot() {
  const d = {}; TEXT_IDS.forEach(id => d[id] = $('#' + id).value);
  d.lv = FLAT.map((_, n) => level(n)); return d;
}
function save() { store.set(KEY, snapshot()); }
function restore() {
  const d = store.get(KEY, null);
  if (d) {
    TEXT_IDS.forEach(id => { if (d[id] != null) $('#' + id).value = d[id]; });
    (d.lv || []).forEach((v, n) => { const r = $(`input[name=i${n}][value="${v}"]`); if (r) r.checked = true; });
  }
  if (!val('fecha')) $('#fecha').value = fmtIso(new Date());
  if (!val('ffirma')) $('#ffirma').value = fmtIso(new Date());
}
$('#frm').addEventListener('input', () => { updateDerived(); save(); });
restore(); updateDerived();

$('#clr').addEventListener('click', () => {
  if (!confirm('¿Borrar todo lo escrito en el formulario?')) return;
  $('#frm').reset(); store.set(KEY, null); $$('.err').forEach(e => e.classList.remove('err')); $$('.msg').forEach(m => m.textContent = '');
  $('#errsum').classList.remove('on'); restore(); updateDerived();
});

// Validación
function validate() {
  const errs = []; $$('.err').forEach(e => e.classList.remove('err')); $$('.msg').forEach(m => m.textContent = '');
  const need = (id, txt) => { if (!val(id)) { $('#' + id).closest('.fld').classList.add('err'); $('#m-' + id).textContent = txt; errs.push([id, txt]); } };
  need('nombre', 'Escriba sus nombres y apellidos.'); need('fecha', 'Indique la fecha de entrega.');
  FLAT.forEach((_, n) => { if (!level(n)) { $('#ind' + n).classList.add('err'); errs.push(['ind' + n, `Marque un nivel en el indicador ${n + 1}.`]); } });
  need('compromiso', 'Escriba un compromiso de mejora.');
  const w = words($('#reflexion').value);
  if (w < MIN_W || w > MAX_W) {
    const t = `La reflexión debe tener entre ${MIN_W} y ${MAX_W} palabras (tiene ${w}).`;
    $('#reflexion').closest('.fld').classList.add('err'); $('#m-reflexion').textContent = t; errs.push(['reflexion', t]);
  }
  need('firma', 'Escriba su nombre como firma.'); need('ffirma', 'Indique la fecha de la firma.');
  return errs;
}

function goTo(id) {
  const el = $('#' + id); el.scrollIntoView({ block: 'center' });
  const f = el.matches('input,textarea') ? el : el.querySelector('input'); if (f) f.focus();
}

$('#frm').addEventListener('submit', e => {
  e.preventDefault();
  const errs = validate(), box = $('#errsum');
  if (errs.length) {
    box.replaceChildren(h('b', null, `Revise ${errs.length} punto(s) antes de generar el PDF:`),
      h('ul', null, errs.map(([id, t]) => h('li', null, h('a', { href: '#' + id, onclick: ev => { ev.preventDefault(); goTo(id); } }, t)))));
    box.classList.add('on'); box.focus(); return;
  }
  box.classList.remove('on');
  if (!window.jspdf) { $('#status').textContent = 'No se pudo cargar jsPDF. Revise su conexión a Internet e intente de nuevo.'; return; }
  try {
    const name = buildPdf();
    $('#status').textContent = `✔ Descargado: ${name}. Súbalo a Classroom.`;
    confetti(40);
  } catch (err) { console.error(err); $('#status').textContent = 'Error al generar el PDF: ' + err.message; }
});

// ===== PDF =====
const fmtLong = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
function buildPdf() {
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = 612, H = 792, M = 56, CW = W - 2 * M, NAVY = [31, 56, 100], GREEN = [26, 107, 69];
  let y = 0;
  const font = (st = 'normal', sz = 10.5, col = [20, 20, 20]) => { doc.setFont('times', st); doc.setFontSize(sz); doc.setTextColor(...col); };
  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) { doc.setPage(p); font('normal', 9, [110, 110, 110]); doc.text(`Tarea 5 · Encuentro N°3 · ${val('nombre')} · Página ${p} de ${n}`, W / 2, H - 28, { align: 'center' }); }
  };
  const room = need => { if (y + need > H - 56) { doc.addPage(); y = M; } };
  const para = (t, sz = 11, st = 'normal', col, gap = 6, lh = 1.35) => {
    font(st, sz, col);
    doc.splitTextToSize(t, CW).forEach(l => { room(sz * lh); y += sz * lh; doc.text(l, M, y); });
    y += gap;
  };
  const head = t => {
    room(40); y += 8; font('bold', 13, NAVY); y += 13; doc.text(t, M, y); y += 5;
    doc.setDrawColor(...NAVY); doc.setLineWidth(.8); doc.line(M, y, M + CW, y); y += 8;
  };

  // Encabezado
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 8, 'F');
  y = 34; font('normal', 10.5);
  ['Universidad Nacional Autónoma de Nicaragua, Managua · Centro Universitario Regional de Matagalpa', 'Departamento de Ciencias, Tecnología y Salud'].forEach(t => { doc.text(t, W / 2, y, { align: 'center' }); y += 13; });
  font('italic', 10, [90, 90, 90]); doc.text('2026: Por una Educación al Servicio del Pueblo, ¡Viva Sandino!', W / 2, y, { align: 'center' }); y += 26;
  font('bold', 15, NAVY); doc.text('Formulario de la Tarea 5 — Autoevaluación actitudinal y reflexión', W / 2, y, { align: 'center' }); y += 16;
  font('italic', 10.5, [60, 60, 60]); doc.text('Encuentro N°3 · BOA 3 · Programación de Aplicaciones de Escritorio: AgroStock v3', W / 2, y, { align: 'center' }); y += 18;

  // Datos
  const rows = [['Nombres y apellidos', val('nombre')], ['Fecha de entrega', fmtLong(val('fecha'))]];
  doc.setFillColor(...NAVY); doc.rect(M, y, CW, 18, 'F'); font('bold', 10.5, [255, 255, 255]); doc.text('Dato', M + 6, y + 12.5); doc.text('Respuesta', M + 190, y + 12.5); y += 18;
  rows.forEach(([k, v]) => {
    font('normal', 10.5); const ls = doc.splitTextToSize(v, CW - 196), hh = Math.max(20, ls.length * 13 + 8);
    doc.setDrawColor(0); doc.setLineWidth(.5); doc.rect(M, y, 184, hh); doc.rect(M + 184, y, CW - 184, hh);
    font('bold', 10.5); doc.text(doc.splitTextToSize(k, 172), M + 6, y + 14); font('normal', 10.5); doc.text(ls, M + 190, y + 14); y += hh;
  });
  y += 6;

  // Parte 1
  head('Parte 1. Autoevaluación actitudinal');
  font('normal', 9.5, [80, 80, 80]); doc.text('5 Alcanzado · 4 En proceso avanzado · 3 En proceso limitado · 2 No alcanzado', M, y + 9); y += 18;
  const cx = [4, 3, 2, 1].map(k => M + CW - k * 36 + 18), tw = CW - 4 * 36 - 12;
  const thead = () => {
    doc.setFillColor(...NAVY); doc.rect(M, y, CW, 18, 'F'); font('bold', 10.5, [255, 255, 255]); doc.text('Indicador', M + 6, y + 12.5);
    [5, 4, 3, 2].forEach((v, i) => doc.text(String(v), cx[i], y + 12.5, { align: 'center' })); y += 18;
  };
  room(80); thead();
  let idx = 0;
  IND.forEach(([g, items]) => {
    room(60); doc.setDrawColor(0); doc.setLineWidth(.5); doc.setFillColor(238, 241, 247); doc.rect(M, y, CW, 18, 'FD'); font('bold', 10.5); doc.text(g, M + 6, y + 12.5); y += 18;
    items.forEach(t => {
      font('normal', 10); const ls = doc.splitTextToSize(t, tw), hh = Math.max(24, ls.length * 12.5 + 8); room(hh);
      doc.setDrawColor(0); doc.setLineWidth(.5); doc.rect(M, y, CW, hh); font('normal', 10); doc.text(ls, M + 6, y + 14);
      const lv = level(idx++);
      [5, 4, 3, 2].forEach((v, i) => {
        const bx = cx[i] - 5.5, by = y + hh / 2 - 5.5; doc.setDrawColor(0); doc.setLineWidth(.6); doc.rect(bx, by, 11, 11);
        if (v === lv) { doc.setLineWidth(1.6); doc.setDrawColor(...GREEN); doc.line(bx + 2, by + 2, bx + 9, by + 9); doc.line(bx + 9, by + 2, bx + 2, by + 9); }
      });
      y += hh;
    });
  });
  y += 14; room(50); font('bold', 11.5); const lbl = 'Nivel global (promedio redondeado): '; doc.text(lbl, M, y);
  font('bold', 13, GREEN); doc.text(String(globalLevel()), M + doc.getTextWidth(lbl) + 4, y); y += 4;
  y += 4; para('Un compromiso de mejora para mi próximo trabajo en equipo: ' + val('compromiso'), 11, 'normal', undefined, 4);

  // Parte 2
  head('Parte 2. Reflexión: AgroStock y el cuidado de la Madre Tierra');
  ['• ¿Cómo puede AgroStock reducir el uso de papel, las pérdidas de insumos vencidos y los viajes innecesarios de los productores? (al menos tres ideas)',
    '• ¿Qué cuidados debe tener una aplicación como AgroStock al manejar los datos de las personas y las claves de acceso a un servicio en Internet?',
    '• ¿Qué cambiaría o agregaría a AgroStock para que aporte más al uso sostenible de los recursos de su comunidad?'].forEach(q => para(q, 9.5, 'italic', [80, 80, 80], 2, 1.25));
  y += 4;
  $('#reflexion').value.trim().split(/\n+/).forEach(p => para(p, 11, 'normal', undefined, 5, 1.45));
  room(20); y += 10; font('italic', 9.5, [100, 100, 100]); doc.text(`(${words($('#reflexion').value)} palabras)`, M, y); y += 14;

  // Firma
  room(90); y += 30; doc.setDrawColor(0); doc.setLineWidth(.6);
  font('italic', 14, NAVY); doc.text(val('firma'), M + 4, y - 3);
  doc.line(M, y, M + 280, y); doc.line(M + 330, y, M + CW, y);
  font('bold', 10.5); doc.text('Firma del estudiante', M, y + 13); doc.text('Fecha', M + 330, y + 13);
  font('normal', 11); doc.text(fmtLong(val('ffirma')), M + 334, y - 3);

  footer();
  const ap = val('nombre').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const name = `Tarea5_E03_${ap}.pdf`; doc.save(name); return name;
}
