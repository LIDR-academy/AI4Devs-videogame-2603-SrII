Desarrolla un juego completo tipo Tetris que funcione en el navegador usando HTML, CSS y JavaScript.

Estructura del proyecto:
- Todo el código debe estar dentro de la carpeta tetris-XVB.
- Separa los archivos en:
  tetris-XVB/
  ├── index.html
  ├── css/
  │   └── styles.css
  └── js/
      └── game.js

Si necesitas imágenes, sonidos u otros recursos, colócalos dentro de la carpeta assets/ en subcarpetas organizadas.

Requisitos del juego:
- Implementa un Tetris clásico con un tablero de 10 columnas por 20 filas.
- Incluye las 7 piezas estándar: I, O, T, S, Z, J y L.
- Cada pieza debe tener un color diferente.
- Las piezas caen automáticamente desde la parte superior.
- El jugador puede moverlas, rotarlas, hacer caída suave y caída rápida.
- Las líneas completas deben eliminarse.
- Muestra puntuación, nivel y líneas completadas.
- La velocidad del juego debe aumentar con el nivel.
- El juego termina cuando no se puede colocar una nueva pieza.

Controles:
- Flecha izquierda: mover a la izquierda
- Flecha derecha: mover a la derecha
- Flecha abajo: caída suave
- Flecha arriba: rotar
- Espacio: caída rápida
- P: pausar/reanudar
- Enter: iniciar/reiniciar

Requisitos técnicos:
- Usa JavaScript puro (sin librerías externas).
- Renderiza el juego usando un canvas de HTML5.
- Mantén el código separado en los archivos indicados.
- El juego debe funcionar abriendo index.html en el navegador.
- Compatible con Chrome, Firefox, Safari y Edge.

Interfaz:
- Muestra el tablero principal.
- Muestra la siguiente pieza.
- Muestra puntuación, nivel y líneas.
- Incluye botón de iniciar/reiniciar.
- Muestra mensajes de "Pausa" y "Game Over".
- Añade una pequeña guía de controles en pantalla.

Lógica del juego:
- Detecta colisiones con bordes, suelo y piezas bloqueadas.
- Bloquea piezas cuando no puedan bajar más.
- Genera nuevas piezas correctamente.
- Detecta y elimina líneas completas.
- Sistema de puntuación:
  - 1 línea: 100 × nivel
  - 2 líneas: 300 × nivel
  - 3 líneas: 500 × nivel
  - 4 líneas: 800 × nivel
- Subir nivel cada 10 líneas.
- Aumentar velocidad con el nivel.
- Implementar una rotación con ajuste básico (wall-kick).

Calidad del código:
- Usa funciones claras y nombres descriptivos.
- Añade comentarios en las partes importantes.
- Evita complejidad innecesaria.
- Código fácil de entender y modificar.

Entrega:
Un proyecto completo dentro de la carpeta tetris-XVB listo para ejecutarse en navegador.