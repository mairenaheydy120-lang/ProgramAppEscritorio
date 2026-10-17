# Programación de Aplicaciones de Escritorio · Encuentro 1

Sitio 100 % estático (HTML + CSS + JS, sin backend ni *build step*) para **UNAN-Managua, CUR Matagalpa**.
Encuentro 1 — *Aplicaciones de interfaz gráfica* · 11 de octubre de 2026.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Portada del curso: elegir Encuentro 1 o 2 y aula virtual |
| `hub-encuentro-01.html` / `hub-encuentro-02.html` | Menú de recursos de cada encuentro (con botón «Volver a la portada») |
| `encuentro-02.html`, `juegos-02.html`, `encuentro-02/` | Folleto, juegos, guía AgroStock v2 y PDF (BOA 2, folleto) del Encuentro 2 |
| `recursos/` | `agrostock.sql`, `consultas.sql` y `productos_importar.csv` |
| `guia-instalacion.html` | Visual Studio 2026 + DB Browser for SQLite (con PDF para ver/descargar) |
| `encuentro-01.html` | Folleto completo del Encuentro 1 |
| `guia-agrostock.html` | Guía paso a paso AgroStock v1 (8 pasos, 7 simuladores, ejercitación) |
| `boa-01.html` | BOA del corte 1: tareas, rúbrica y calculadora de autoevaluación |
| `juegos.html` | 4 juegos + quiz de 10 preguntas, insignias y panel «Mi progreso» |
| `assets/css/site.css` | Tokens (claro/oscuro) y componentes compartidos |
| `assets/js/site.js` | Utilidades compartidas (`store`, `h`, `$`, `hlCs`, `makeViewer`, `makeLog`, `msgDialog`, `productDialog`…), navegación, pie, sonido, confeti |
| `assets/js/quiz.js` | Motor de rondas/quizzes y banco de preguntas |
| `assets/js/games.js` | Lógica de los juegos y panel de progreso |
| `assets/audio/` | Sonidos cortos `.mp3` (< 10 KB c/u) |
| `assets/img/`, `assets/pdf/` | Imágenes de la guía de instalación, logos UNAN y PDF originales |

## Probar en local

Basta con abrir `index.html` en el navegador. Si prefiere un servidor local:

```bash
python -m http.server 8000   # y abrir http://localhost:8000
```

## Publicar en GitHub Pages

1. Cree un repositorio en GitHub y suba **el contenido de esta carpeta** (que `index.html` quede en la raíz del repositorio).
2. En el repositorio: **Settings → Pages → Build and deployment**.
3. En *Source* elija **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarde.
4. En 1–2 minutos el sitio queda en `https://<usuario>.github.io/<repositorio>/`.
5. El archivo `.nojekyll` (ya incluido) evita que GitHub procese el sitio con Jekyll.

Si deja el sitio dentro de `docs/`, elija la carpeta `/docs` en el paso 3.

## Notas

- El progreso (insignias, puntajes, autoevaluación, listas de verificación) se guarda en `localStorage` con el prefijo `agrostock-e1:`; es propio de cada navegador y no se comparte entre dispositivos.
- Los sonidos se pueden silenciar con el botón 🔊 de la barra superior; los efectos visuales respetan `prefers-reduced-motion`.
- El Encuentro 2 ya está en la navegación (`encuentro-02.html`). Los Encuentros 3 se activarán al publicarse.
