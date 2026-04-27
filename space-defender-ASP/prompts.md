# Prompts utilizados - Space Defender (Cursor)

Este archivo documenta los prompts base y el resultado esperado: un minijuego arcade hecho con **HTML, CSS y JavaScript puro**, renderizado en `canvas`, interactivo y listo para ejecutarse en el navegador.

Se usa Markdown estándar (encabezados, negritas, tablas, listas y código entre comillas invertidas) y codificación **UTF-8**. En GitHub se visualiza bien; se evitan símbolos extraños de edición (por ejemplo comillas curvas) y caracteres de control.

## Prompt 1

Necesito crear un videojuego simple usando HTML, CSS y JavaScript para una tarea final de introducción a programación web. El juego debe ser interactivo y funcionar en navegador.

## Prompt 2

Propón un concepto de juego que sea fácil de implementar, visualmente atractivo y que use HTML, CSS y JavaScript puro, sin frameworks.

## Prompt 3

Crea la estructura de archivos para el juego con una carpeta llamada `Cursor-space-defender-ASP`, incluyendo `index.html`, `styles.css`, `script.js` y `prompts.md`.

## Prompt 4

Genera el código HTML para un juego tipo arcade donde el jugador controla una nave, dispara y evita enemigos.

## Prompt 5

Genera el CSS para que el juego tenga apariencia moderna, fondo espacial, canvas centrado, HUD con puntaje, vidas y nivel. El canvas debe ser **responsive**: ajustarse al ancho disponible y también al alto visible para evitar scroll vertical, manteniendo proporción (por ejemplo usando `aspect-ratio` y un `max-height` basado en `100vh`).

## Prompt 6

Genera el JavaScript del juego usando canvas. Debe permitir mover la nave con las flechas, disparar con espacio, generar enemigos, detectar colisiones, sumar puntaje, subir nivel y terminar el juego cuando se acaben las vidas.

## Prompt 7

Revisa el código y mejora la experiencia de juego agregando pantalla inicial, botón para iniciar, reinicio con Enter y estrellas animadas de fondo.

## Prompt 8

Agrega al juego: sonido, enemigos con distintos colores y power-ups.

## Prompt 9

Agrega botón para silenciar o activar sonido.

---

## Estado actual del proyecto (requerimientos cubiertos)

| Área | Detalle |
|------|---------|
| Base | HTML, CSS, JS sin frameworks; canvas 720x960 responsive |
| Controles | Flechas o A/D para mover; espacio para disparar; Enter para iniciar o reiniciar |
| Jugador | Nave con motor; período de invulnerabilidad tras daño |
| Enemigos | Varias paletas de color; algunos requieren más de un impacto (mayor tamaño) |
| Disparos | Colisión circular con enemigos; disparo triple temporal con power-up |
| Progresión | Puntaje, vidas, nivel según puntaje, dificultad creciente |
| Audio | Web Audio API (sonidos sintéticos); botón silenciar o activar y preferencia en `localStorage` |
| Power-ups | Ráfaga (cadencia rápida), disparo triple, escudo orbital (absorbe impactos), vida extra; aparición periódica y ocasional al destruir enemigos |
| HUD | Puntaje, vidas, nivel, resumen de power-ups activos |
| UI | Pantalla inicial / game over, toast, botón "Cómo jugar", overlay |

---

## Descripción del juego

Space Defender es un arcade desarrollado con HTML, CSS y JavaScript en canvas.

El jugador controla una nave y debe destruir enemigos antes de que crucen la parte inferior de la pantalla o colisionen con la nave. Hay efectos de partículas, sonidos opcionales y objetos de bonificación que caen en forma de rombos de distintos colores.

---

## Cómo jugar

- Flecha izquierda o tecla A: mover a la izquierda.
- Flecha derecha o tecla D: mover a la derecha.
- Barra espaciadora: disparar.
- Enter: iniciar partida o reiniciar tras game over (también botón Iniciar).
- Botón de altavoz en la barra superior: silenciar o activar el audio (la preferencia se guarda en el navegador).

---

## Archivos principales

- `index.html` - Estructura, HUD, overlay, botón de sonido.
- `styles.css` - Estilos responsive y apariencia del juego.
- `script.js` - Lógica del juego, audio y persistencia del silencio.

---

## Pruebas realizadas

- Abrir `index.html` en el navegador (archivo local o servidor estático).
- Verificar movimiento (flechas y A/D), disparos, puntaje, vidas, nivel.
- Verificar pantalla inicial, reinicio con Enter y botón Iniciar.
- Verificar power-ups (recoger rombos), HUD de buffs y escudo al chocar.
- Verificar sonidos al disparar, destruir enemigos y demás eventos.
- Verificar botón de silenciar: sin audio al activarlo y audio al desactivarlo tras iniciar partida.
