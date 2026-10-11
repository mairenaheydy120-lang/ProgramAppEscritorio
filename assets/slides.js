/* Navegación de diapositivas: ← → Espacio Inicio Fin, P = imprimir/PDF, F = pantalla completa */
(function () {
  "use strict";
  var s = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var i = 0, barra = document.querySelector(".barra-deck"), cont = document.querySelector("#contador");
  var ini = parseInt((location.hash || "#1").slice(1), 10);
  if (ini >= 1 && ini <= s.length) i = ini - 1;
  function ir(n) {
    i = Math.max(0, Math.min(s.length - 1, n));
    s.forEach(function (el, k) { el.classList.toggle("on", k === i); el.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    if (barra) barra.style.width = (100 * (i + 1) / s.length) + "%";
    if (cont) cont.textContent = (i + 1) + " / " + s.length;
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
  }
  document.addEventListener("keydown", function (e) {
    if (["ArrowRight", "PageDown", " "].indexOf(e.key) >= 0) { e.preventDefault(); ir(i + 1); }
    else if (["ArrowLeft", "PageUp"].indexOf(e.key) >= 0) { e.preventDefault(); ir(i - 1); }
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(s.length - 1);
    else if (e.key === "p" || e.key === "P") window.print();
    else if (e.key === "f" || e.key === "F") { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
  });
  var x0 = null;
  document.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1)); x0 = null; });
  document.querySelector("#prev").addEventListener("click", function () { ir(i - 1); });
  document.querySelector("#next").addEventListener("click", function () { ir(i + 1); });
  document.querySelector("#imprimir").addEventListener("click", function () { window.print(); });
  ir(i);
})();
