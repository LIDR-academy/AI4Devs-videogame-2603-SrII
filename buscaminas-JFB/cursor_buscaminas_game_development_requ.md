# Buscaminas game development requirements
_Exported on 4/24/2026 at 21:34:55 GMT-3 from Cursor (3.1.17) Opus 4.7 High_

---

**User**

Actúa como un Desarrollador Frontend Senior experto en UI/UX y lógica de juegos en el navegador. Tu tarea es generar el código completo para un juego de Buscaminas funcional, utilizando HTML5, CSS3 moderno y JavaScript Vanilla. 

La arquitectura debe ser razonable, y dividir archivos segun proposito, html, css y javascript. 

### 1. Requisitos de Interfaz y Experiencia de Usuario (UI/UX)
Quiero que la interfaz sea visualmente sorprendente, alejándose del clásico diseño gris de Windows 95. Aplica un tema "Dark Glassmorphism" (Efecto de cristal oscuro):
* **Fondo:** Un fondo oscuro con un gradiente sutil o formas geométricas difuminadas que le den profundidad.
* **Tablero:** Un contenedor translúcido (efecto cristal) con bordes suaves, sombra paralela (box-shadow) y un ligero desenfoque de fondo (backdrop-filter). Utiliza CSS Grid para las casillas.
* **Casillas:** * Cubiertas: Deben tener un ligero relieve táctil y reaccionar al pasar el ratón (hover) con una suave iluminación.
    * Descubiertas: Deben "hundirse" visualmente.
* **Colores de los Números:** Usa una paleta de colores vibrantes y modernos para los números del 1 al 8 (ej. 1: Azul cian, 2: Verde esmeralda, 3: Rojo coral, etc.).
* **Animaciones:** Añade una transición suave al revelar casillas. Si se descubre una mina, que haya un efecto de "vibración" o un brillo rojo (box-shadow neón) antes de mostrar el mensaje de Game Over.

### 2. Lógica y Reglas del Juego (JavaScript)
Implementa la lógica clásica con las siguientes especificaciones técnicas:
* **Estado Inicial:** Crea controles para que el usuario pueda seleccionar dificultad (Principiante: 9x9/10 minas, Intermedio: 16x16/40 minas).
* **Primer Clic Seguro:** CRÍTICO. El algoritmo de generación de minas NO debe ejecutarse hasta que el jugador haga su primer clic. Garantiza que la primera casilla clickeada (y preferiblemente sus 8 vecinas) siempre sea un "0" para asegurar una apertura justa.
* **Flood Fill (Cascada):** Implementa un algoritmo recursivo o iterativo eficiente para que, al descubrir una casilla vacía (0), se revelen automáticamente todas las casillas vacías adyacentes y sus bordes numerados.
* **Controles:** * Clic Izquierdo: Revelar casilla.
    * Clic Derecho: Colocar/Quitar bandera (previene el menú contextual del navegador por defecto).
* **HUD (Heads-Up Display):** Un panel superior que muestre un contador de "Minas Restantes" (total de minas menos banderas colocadas) y un cronómetro que inicie con el primer clic y se detenga al ganar o perder.

### 3. Condiciones de Victoria/Derrota
* **Derrota:** Al clickear una mina, revela la ubicación de todas las demás minas, resalta las banderas equivocadas y bloquea el tablero. Muestra un modal elegante o un mensaje integrado anunciando la derrota.
* **Victoria:** Se detecta cuando el número de casillas cubiertas es exactamente igual al número total de minas. Muestra un modal de felicitaciones con el tiempo logrado.
* Añade un botón de "Reiniciar Juego" prominente.

### 4. Calidad del Código
* Usa variables y funciones descriptivas (en inglés, y que sean consistentes).
* Maneja el estado del juego (ej. `isGameOver`, `board`, `minesLeft`) en un objeto de estado o variables globales limpias.
* Comenta los bloques clave, especialmente la lógica del "Flood Fill" y la inicialización segura del primer clic.

Genera el código ahora.

---

**Cursor**

Listo. Te armé el Buscaminas completo con tema Dark Glassmorphism, dividido por propósito y sin dependencias.

### Archivos generados

- `index.html` — estructura semántica con HUD, controles de dificultad, tablero y modal de fin de partida.
- `styles.css` — tema oscuro con `backdrop-filter`, blobs difuminados, animaciones (`reveal-pop`, `flag-plant`, `shake`, `mine-glow`) y paleta vibrante para los números 1–8.
- `script.js` — toda la lógica encapsulada en una IIFE, con un objeto `state` único y matrices paralelas `board` / `cellEls`.
- `README.md` — instrucciones de ejecución y notas de arquitectura.

### Decisiones clave

- **Primer clic seguro (crítico)**: las minas no se generan en `initGame`. Se siembran en `placeMines(safeRow, safeCol)` recién en el primer clic, excluyendo del pool la casilla clickeada **y sus 8 vecinas** vía un `Set` de coordenadas prohibidas. Si por tamaño no entran las minas, hace fallback a excluir solo la casilla central. Después usa Fisher–Yates para repartir.

```120:155:script.js
  function placeMines(safeRow, safeCol) {
    // Build a set of forbidden coordinates (the safe zone).
    const forbidden = new Set();
    forbidden.add(`${safeRow},${safeCol}`);
    eachNeighbor(safeRow, safeCol, (_cell, nr, nc) => {
      forbidden.add(`${nr},${nc}`);
    });
    ...
```

- **Flood Fill iterativo (BFS)**: usé cola en vez de recursión para que no explote la pila en tableros grandes. Las casillas numeradas entran en la cola pero no propagan más allá.

```176:198:script.js
  function floodReveal(startR, startC) {
    const queue = [[startR, startC]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const cell = state.board[r][c];

      if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

      cell.isRevealed = true;
      state.revealedCount++;
      paintRevealedCell(cell);
      ...
```

- **Click derecho con bandera**: `event.preventDefault()` cancela el menú contextual del navegador.
- **Detección de victoria**: `revealedCount === rows*cols − totalMines`. Al ganar auto-bandera las minas y muestra modal con tiempo.
- **Game Over con vibración + neón rojo**: la mina detonada recibe `is-exploded` que dispara `shake` (0.5 s) y luego `mine-glow` infinito; el resto de minas se revela y las banderas equivocadas quedan tachadas con una `✕` roja.
- **HUD**: contador `total − banderas` y cronómetro que arranca con el primer clic y se detiene al ganar o perder. Se incluye una "carita" estilo clásico (🙂 / 😮 / 😎 / 😵).

### Cómo correrlo

Doble clic a `index.html`, o desde la carpeta:

```bash
python3 -m http.server 8000
```

Y abrí `http://localhost:8000`. Atajos: `R` reinicia, `Esc` cierra el modal.

