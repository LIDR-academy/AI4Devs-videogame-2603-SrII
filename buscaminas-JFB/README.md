# Buscaminas — Dark Glassmorphism

Un Buscaminas moderno construido con HTML5, CSS3 y JavaScript Vanilla. Sin
dependencias, sin build step: abrí `index.html` y a jugar.

## Arquitectura

```
.
├── index.html   # Estructura semántica (HUD, controles, tablero, modal)
├── styles.css   # Tema "Dark Glassmorphism" + animaciones
└── script.js    # Lógica del juego (estado, generación segura, flood-fill)
```

## Ejecución

Hacé doble clic en `index.html`, o serví la carpeta con cualquier servidor
estático:

```bash
# Opción 1 — Python
python3 -m http.server 8000

# Opción 2 — Node
npx serve .
```

Después abrí <http://localhost:8000>.

## Características

- **Tema Dark Glassmorphism**: fondo con gradientes y "blobs" difuminados,
  paneles translúcidos con `backdrop-filter`, sombras suaves.
- **Dificultades**: Principiante (9×9 / 10 minas) e Intermedio (16×16 / 40 minas).
- **Primer clic seguro**: las minas se siembran *después* del primer clic,
  excluyendo siempre la casilla pulsada y sus 8 vecinas — así garantizamos
  que el primer movimiento dispare un flood-fill amplio.
- **Flood Fill iterativo (BFS)**: revela en cascada las casillas vacías y sus
  bordes numerados. Iterativo en vez de recursivo para evitar overflow en
  tableros grandes.
- **Banderas con clic derecho**: se cancela el menú contextual del navegador.
- **HUD reactivo**: contador de minas (total − banderas) y cronómetro que
  arranca con el primer clic y se detiene al ganar/perder.
- **Game Over inmersivo**: la mina detonada hace *shake* + brillo neón rojo,
  se muestran todas las minas restantes y se marcan las banderas equivocadas.
- **Victoria**: detectada cuando `casillasReveladas === total − minas`. Se
  auto-banderan las minas restantes y se muestra un modal con el tiempo.
- **Atajos**: `R` reinicia, `Esc` cierra el modal.

## Notas de implementación

- **Estado centralizado**: el objeto `state` mantiene `board`, `cellEls`,
  contadores, flags de fin de juego y cronómetro.
- **Doble matriz**: una matriz para los datos del tablero y otra paralela
  (`cellEls`) con los nodos del DOM, para evitar `querySelector` en caliente.
- **Accesibilidad**: roles ARIA en grid/gridcell, `aria-live` en el HUD,
  respeto a `prefers-reduced-motion`.
