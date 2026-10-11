/* Programación de Aplicaciones de Escritorio – interacciones del sitio (sin dependencias) */
(function () {
  "use strict";
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  window.PAE_LS = LS;

  /* ---------- tema claro/oscuro ---------- */
  var root = document.documentElement;
  var guardado = LS.get("pae-tema", null);
  if (guardado) root.setAttribute("data-theme", guardado);
  function temaActual() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll(".btn-theme").forEach(function (b) {
    var pintar = function () { b.textContent = temaActual() === "dark" ? "☀️ Claro" : "🌙 Oscuro"; };
    pintar();
    b.addEventListener("click", function () {
      var n = temaActual() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", n); LS.set("pae-tema", n); pintar();
    });
  });

  /* ---------- resaltado simple de código ---------- */
  var KW = {
    csharp: "abstract as async await base bool break case catch class const continue decimal default delegate do double else enum event false finally for foreach get if in int interface internal is lock long namespace new null object out override private protected public readonly record ref return sealed set static string struct switch this throw true try typeof using var void when while yield",
    sql: "select from where and or not insert into values update set delete create table primary key foreign references unique null default check join on group by order asc desc as count sum drop if exists index pragma integer text real autoincrement like limit"
  };
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function resaltar(txt, lang) {
    if (!KW[lang]) return esc(txt);
    var kws = KW[lang].split(" ");
    var re = lang === "sql"
      ? /(--[^\n]*)|('(?:[^'])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]+\b)/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(\$?@?"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(\b\d+(?:\.\d+)?m?\b)|(\b[A-Za-z_]+\b)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(txt)) !== null) {
      out += esc(txt.slice(last, m.index));
      if (m[1]) out += '<span class="tok-com">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-str">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-num">' + esc(m[3]) + "</span>";
      else {
        var w = m[4], k = lang === "sql" ? w.toLowerCase() : w;
        out += kws.indexOf(k) >= 0 ? '<span class="tok-kw">' + esc(w) + "</span>" : esc(w);
      }
      last = re.lastIndex;
    }
    return out + esc(txt.slice(last));
  }
  document.querySelectorAll(".code pre code").forEach(function (c) {
    var lang = c.getAttribute("data-lang") || "";
    c.innerHTML = resaltar(c.textContent, lang);
  });
  document.querySelectorAll(".code .copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.parentNode.querySelector("code").textContent;
      var hecho = function () { b.textContent = "¡Copiado!"; setTimeout(function () { b.textContent = "Copiar"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, function () { b.textContent = "Seleccione y copie"; });
      else { var t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); hecho(); } catch (e) {} t.remove(); }
    });
  });

  /* ---------- quiz ---------- */
  document.querySelectorAll(".quiz").forEach(function (q) {
    var datos = JSON.parse(q.querySelector("script[type='application/json']").textContent);
    var btn = q.querySelector(".calificar"), res = q.querySelector(".resultado"), reiniciar = q.querySelector(".reiniciar");
    btn.addEventListener("click", function () {
      var buenas = 0;
      datos.forEach(function (d, i) {
        var sel = q.querySelector("input[name='q" + i + "']:checked");
        var fb = q.querySelector("#fb" + q.id + "-" + i);
        if (!sel) { fb.innerHTML = '<span class="bad">Sin responder.</span>'; return; }
        var ok = parseInt(sel.value, 10) === d.c;
        if (ok) buenas++;
        fb.innerHTML = (ok ? '<span class="ok">✔ Correcto.</span> ' : '<span class="bad">✖ Incorrecto.</span> ') + d.e;
      });
      res.textContent = "Resultado: " + buenas + " de " + datos.length + (buenas === datos.length ? " – ¡excelente!" : "");
      LS.set("pae-quiz-" + q.id, { buenas: buenas, total: datos.length });
    });
    reiniciar.addEventListener("click", function () {
      q.querySelectorAll("input").forEach(function (i) { i.checked = false; });
      q.querySelectorAll(".fb").forEach(function (f) { f.innerHTML = ""; });
      res.textContent = "";
    });
  });

  /* ---------- checklist persistente ---------- */
  document.querySelectorAll(".check[data-clave]").forEach(function (ul) {
    var clave = "pae-check-" + ul.getAttribute("data-clave");
    var estado = LS.get(clave, {});
    var bar = document.querySelector("#barra-" + ul.getAttribute("data-clave"));
    var pintar = function () {
      var cajas = ul.querySelectorAll("input"), n = 0;
      cajas.forEach(function (c) { if (c.checked) n++; });
      if (bar) { bar.style.width = Math.round(100 * n / cajas.length) + "%"; bar.parentNode.setAttribute("aria-valuenow", Math.round(100 * n / cajas.length)); }
    };
    ul.querySelectorAll("input").forEach(function (c, i) {
      c.checked = !!estado[i];
      c.addEventListener("change", function () { estado[i] = c.checked; LS.set(clave, estado); pintar(); });
    });
    pintar();
  });

  /* ---------- avance en el portal ---------- */
  document.querySelectorAll("[data-avance]").forEach(function (el) {
    var k = el.getAttribute("data-avance"), total = parseInt(el.getAttribute("data-total"), 10);
    var est = LS.get("pae-check-" + k, {}), n = 0;
    Object.keys(est).forEach(function (i) { if (est[i]) n++; });
    var pct = total ? Math.round(100 * n / total) : 0;
    el.querySelector(".progress > div").style.width = pct + "%";
    el.querySelector(".pct").textContent = pct + " % (" + n + "/" + total + ")";
  });

  /* ================= SIMULADORES ================= */
  function logger(el) {
    return function (msg) {
      var h = new Date().toTimeString().slice(0, 8);
      el.textContent += "[" + h + "] " + msg + "\n"; el.scrollTop = el.scrollHeight;
    };
  }

  /* E1 – simulador de eventos */
  var simE = document.getElementById("sim-eventos");
  if (simE) {
    var log = logger(simE.querySelector(".log"));
    var cod = simE.querySelector("#txtCodigo"), nom = simE.querySelector("#txtNombre"), cat = simE.querySelector("#cboCategoria"), g = simE.querySelector("#btnGuardar");
    var err = simE.querySelector("#errores");
    log("Form.Load → formulario listo");
    cod.addEventListener("focus", function () { log("txtCodigo.Enter"); });
    cod.addEventListener("keypress", function (e) {
      var ch = e.key;
      if (ch.length !== 1) return;
      if (!/[A-Za-z0-9-]/.test(ch)) { e.preventDefault(); log("txtCodigo.KeyPress '" + ch + "' → e.Handled = true (descartada)"); return; }
      log("txtCodigo.KeyPress '" + ch + "'");
    });
    cod.addEventListener("input", function () {
      var p = cod.selectionStart; cod.value = cod.value.toUpperCase(); cod.setSelectionRange(p, p);
      log("txtCodigo.TextChanged → Text = \"" + cod.value + "\"");
    });
    cod.addEventListener("blur", function () { log("txtCodigo.Leave / Validating"); });
    nom.addEventListener("input", function () { log("txtNombre.TextChanged → \"" + nom.value + "\""); });
    cat.addEventListener("change", function () { log("cboCategoria.SelectedIndexChanged → " + (cat.value || "(ninguna)")); });
    g.addEventListener("click", function () {
      log("btnGuardar.Click");
      var msgs = [];
      if (!cod.value.trim()) msgs.push("Código: obligatorio");
      if (nom.value.trim().length < 3) msgs.push("Nombre: mínimo 3 caracteres");
      if (!cat.value) msgs.push("Categoría: seleccione una");
      if (msgs.length) { err.textContent = "⚠ " + msgs.join(" · "); log("ErrorProvider.SetError × " + msgs.length + " → el diálogo sigue abierto"); }
      else { err.textContent = "✔ DialogResult = OK"; log("DialogResult = OK → el diálogo se cierra"); }
    });
    simE.querySelector("#btnCancelar").addEventListener("click", function () { log("btnCancelar.Click → DialogResult = Cancel"); });
    simE.querySelector("#limpiarLog").addEventListener("click", function () { simE.querySelector(".log").textContent = ""; });
  }

  /* E2 – CRUD con SQL generado */
  var simS = document.getElementById("sim-sql");
  if (simS) {
    var datos = [
      { id: 1, codigo: "FER-001", nombre: "Urea 46 % (quintal)", precio: 1450, existencia: 35 },
      { id: 2, codigo: "FER-002", nombre: "Fórmula 18-46-0 (quintal)", precio: 1680, existencia: 8 },
      { id: 3, codigo: "SEM-010", nombre: "Semilla de frijol INTA Rojo (lb)", precio: 45, existencia: 120 }
    ];
    var sig = 4, sqlOut = simS.querySelector("#sqlOut"), tb = simS.querySelector("tbody");
    var f = { codigo: simS.querySelector("#sCodigo"), nombre: simS.querySelector("#sNombre"), precio: simS.querySelector("#sPrecio"), existencia: simS.querySelector("#sExist") };
    var q = function (s) { return "'" + String(s).replace(/'/g, "''") + "'"; };
    function pintar(filtro) {
      tb.innerHTML = "";
      datos.filter(function (d) { return !filtro || (d.nombre + d.codigo).toLowerCase().indexOf(filtro.toLowerCase()) >= 0; })
        .forEach(function (d) {
          var tr = document.createElement("tr");
          tr.innerHTML = "<td>" + d.id + "</td><td>" + d.codigo + "</td><td>" + d.nombre + "</td><td>" + d.precio.toFixed(2) + "</td><td>" + d.existencia + "</td>";
          tr.tabIndex = 0; tr.style.cursor = "pointer";
          var cargar = function () { f.codigo.value = d.codigo; f.nombre.value = d.nombre; f.precio.value = d.precio; f.existencia.value = d.existencia; simS.dataset.sel = d.id; sqlOut.textContent = "-- fila seleccionada: id = " + d.id; };
          tr.addEventListener("click", cargar); tr.addEventListener("keydown", function (e) { if (e.key === "Enter") cargar(); });
          tb.appendChild(tr);
        });
    }
    function leer() { return { codigo: f.codigo.value.trim().toUpperCase(), nombre: f.nombre.value.trim(), precio: parseFloat(f.precio.value), existencia: parseInt(f.existencia.value || "0", 10) }; }
    simS.querySelector("#bInsert").addEventListener("click", function () {
      var v = leer();
      if (!v.codigo || !v.nombre || !(v.precio > 0)) { sqlOut.textContent = "-- Error: complete código, nombre y precio > 0 (CHECK constraint)"; return; }
      if (datos.some(function (d) { return d.codigo === v.codigo; })) { sqlOut.textContent = "-- SqliteException 19: UNIQUE constraint failed: productos.codigo"; return; }
      v.id = sig++; datos.push(v);
      sqlOut.textContent = "INSERT INTO productos (codigo, nombre, categoria_id, precio, existencia)\nVALUES ($codigo, $nombre, $cat, $precio, $existencia);\n-- $codigo=" + q(v.codigo) + ", $nombre=" + q(v.nombre) + ", $precio=" + v.precio + ", $existencia=" + v.existencia + "\n-- last_insert_rowid() = " + v.id;
      pintar();
    });
    simS.querySelector("#bSelect").addEventListener("click", function () {
      var t = simS.querySelector("#sBuscar").value;
      sqlOut.textContent = "SELECT id, codigo, nombre, precio, existencia FROM productos\nWHERE nombre LIKE $f OR codigo LIKE $f ORDER BY nombre;\n-- $f = " + q("%" + t + "%");
      pintar(t);
    });
    simS.querySelector("#bUpdate").addEventListener("click", function () {
      var id = parseInt(simS.dataset.sel || "0", 10), d = datos.filter(function (x) { return x.id === id; })[0];
      if (!d) { sqlOut.textContent = "-- Seleccione una fila de la tabla primero"; return; }
      var v = leer(); d.codigo = v.codigo; d.nombre = v.nombre; d.precio = v.precio; d.existencia = v.existencia;
      sqlOut.textContent = "UPDATE productos SET codigo = $codigo, nombre = $nombre, precio = $precio, existencia = $existencia\nWHERE id = $id;   -- $id = " + id + "  → 1 fila afectada";
      pintar();
    });
    simS.querySelector("#bDelete").addEventListener("click", function () {
      var id = parseInt(simS.dataset.sel || "0", 10);
      if (!id) { sqlOut.textContent = "-- Seleccione una fila de la tabla primero"; return; }
      datos = datos.filter(function (x) { return x.id !== id; }); simS.dataset.sel = "";
      sqlOut.textContent = "DELETE FROM productos WHERE id = $id;   -- $id = " + id + "  → 1 fila afectada";
      pintar();
    });
    simS.querySelector("#bInyeccion").addEventListener("click", function () {
      var t = "' OR 1=1 --";
      simS.querySelector("#sBuscar").value = t;
      sqlOut.textContent = "-- ❌ Concatenando texto del usuario:\nSELECT * FROM productos WHERE nombre = '" + t + "';\n--   → la condición OR 1=1 devuelve TODAS las filas y -- comenta el resto\n\n-- ✅ Con parámetro:\nSELECT * FROM productos WHERE nombre = $n;   -- $n = " + q(t) + "  → 0 filas";
    });
    pintar();
  }

  /* E2 – hilo de UI vs segundo plano */
  var simH = document.getElementById("sim-hilos");
  if (simH) {
    var reloj = simH.querySelector("#reloj"), barra = simH.querySelector("#barraH"), est = simH.querySelector("#estadoH");
    var bB = simH.querySelector("#hBloq"), bS = simH.querySelector("#hSeg"), bC = simH.querySelector("#hCancel");
    setInterval(function () { reloj.textContent = new Date().toTimeString().slice(0, 8) + "." + String(new Date().getMilliseconds()).slice(0, 1); }, 100);
    bB.addEventListener("click", function () {
      est.textContent = "Trabajando en el hilo de la UI… (la página no responde)";
      setTimeout(function () {
        var fin = Date.now() + 3000; while (Date.now() < fin) { /* ocupado: bloquea el único hilo de la página */ }
        barra.style.width = "100%"; est.textContent = "Terminó. ¿Viste que el reloj y los botones se congelaron 3 s?";
      }, 30);
    });
    var cancelado = false, corriendo = false;
    bS.addEventListener("click", function () {
      if (corriendo) return;
      corriendo = true; cancelado = false; bC.disabled = false; bS.disabled = true; var i = 0; barra.style.width = "0%";
      est.textContent = "Importando en segundo plano… (la UI sigue viva)";
      (function paso() {
        if (cancelado) { est.textContent = "Cancelado con CancellationToken → Rollback (0 filas guardadas)"; barra.style.width = "0%"; corriendo = false; bC.disabled = true; bS.disabled = false; return; }
        i += 2; barra.style.width = i + "%";
        if (i >= 100) { est.textContent = "Listo: 500 productos importados (Commit)"; corriendo = false; bC.disabled = true; bS.disabled = false; return; }
        setTimeout(paso, 60);
      })();
    });
    bC.addEventListener("click", function () { cancelado = true; });
  }

  /* E2 – condición de carrera (simulación paso a paso) */
  var simR = document.getElementById("sim-carrera");
  if (simR) {
    var out = simR.querySelector(".log");
    simR.querySelector("#rSin").addEventListener("click", function () {
      out.textContent = "contador = 5\nHilo A: lee contador (5)\nHilo B: lee contador (5)\nHilo A: suma 1 → escribe 6\nHilo B: suma 1 → escribe 6\nResultado: 6  ✖ (se esperaba 7: se perdió un incremento)";
    });
    simR.querySelector("#rCon").addEventListener("click", function () {
      out.textContent = "contador = 5\nHilo A: entra a lock(candado)\nHilo B: intenta entrar → espera (WaitSleepJoin)\nHilo A: lee 5, escribe 6, sale del lock\nHilo B: entra, lee 6, escribe 7, sale\nResultado: 7  ✔";
    });
  }

  /* E3 – probador de API */
  var simA = document.getElementById("sim-api");
  if (simA) {
    var pre = simA.querySelector("#apiOut"), st = simA.querySelector("#apiEstado"), val = simA.querySelector("#apiValor");
    var respaldo = { result: "success", provider: "Respaldo local del curso (sin conexión)", base_code: "USD", time_last_update_utc: "Valor de ejemplo", rates: { USD: 1, NIO: 36.62, CRC: 505.0, HNL: 26.0, EUR: 0.92 } };
    var inventario = 1450 * 35 + 1680 * 8 + 45 * 120 + 310 * 6 + 2350 * 3 + 420 * 11;
    function mostrar(d, fuente, ms, codigo) {
      st.textContent = codigo + " · " + ms + " ms · fuente: " + fuente;
      pre.textContent = JSON.stringify({ result: d.result, base_code: d.base_code, time_last_update_utc: d.time_last_update_utc, rates: { NIO: d.rates.NIO, USD: d.rates.USD, EUR: d.rates.EUR } }, null, 2);
      var nio = d.rates.NIO;
      val.textContent = "Inventario de ejemplo: C$ " + inventario.toLocaleString("es-NI", { minimumFractionDigits: 2 }) + " ≈ USD " + (inventario / nio).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (1 USD = C$ " + nio + ")";
    }
    simA.querySelector("#apiVivo").addEventListener("click", function () {
      var t0 = performance.now(); st.textContent = "GET " + simA.querySelector("#apiUrl").value + " …";
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
      fetch(simA.querySelector("#apiUrl").value, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().then(function (j) { return { j: j, s: r.status }; }); })
        .then(function (x) { clearTimeout(to); if (!x.j.rates || !x.j.rates.NIO) throw new Error("Respuesta sin NIO"); mostrar(x.j, "servicio en línea", Math.round(performance.now() - t0), x.s + " OK"); })
        .catch(function (e) { clearTimeout(to); mostrar(respaldo, "respaldo local (" + e.name + ": " + e.message + ")", Math.round(performance.now() - t0), "Sin conexión"); });
    });
    simA.querySelector("#apiLocal").addEventListener("click", function () { mostrar(respaldo, "respaldo local (simulado)", 0, "Modo sin conexión"); });
  }

  /* E3 – LINQ ↔ SQL */
  var simL = document.getElementById("sim-linq");
  if (simL) {
    var sel = simL.querySelector("select"), a = simL.querySelector("#linq"), b = simL.querySelector("#sqlg");
    var casos = {
      leer: ["db.Productos\n  .Where(p => p.Existencia < 10)\n  .OrderBy(p => p.Nombre)\n  .ToList();", "SELECT p.Id, p.Codigo, p.Nombre, p.Precio, p.Existencia\nFROM Productos AS p\nWHERE p.Existencia < 10\nORDER BY p.Nombre;"],
      join: ["db.Productos\n  .Select(p => new { p.Nombre, Cat = p.Categoria!.Nombre })\n  .ToList();", "SELECT p.Nombre, c.Nombre AS Cat\nFROM Productos AS p\nINNER JOIN Categorias AS c ON p.CategoriaId = c.Id;"],
      crear: ["db.Productos.Add(new Producto { Codigo = \"FER-004\", ... });\ndb.SaveChanges();", "INSERT INTO Productos (Codigo, Nombre, CategoriaId, Precio, Existencia)\nVALUES (@p0, @p1, @p2, @p3, @p4)\nRETURNING Id;"],
      editar: ["var p = db.Productos.Find(1);\np.Precio = 1500m;\ndb.SaveChanges();", "SELECT ... FROM Productos WHERE Id = @id LIMIT 1;\nUPDATE Productos SET Precio = @p0 WHERE Id = @p1;"],
      borrar: ["var p = db.Productos.Find(5);\ndb.Productos.Remove(p);\ndb.SaveChanges();", "DELETE FROM Productos WHERE Id = @p0;"],
      contar: ["db.Productos.Count(p => p.Existencia < 10);", "SELECT COUNT(*) FROM Productos AS p WHERE p.Existencia < 10;"]
    };
    var pintarL = function () { var c = casos[sel.value]; a.textContent = c[0]; b.textContent = c[1]; };
    sel.addEventListener("change", pintarL); pintarL();
  }
})();
