# Threes-JVF - Tareas atomicas de desarrollo

## 0. Preparacion de estructura
- [x] Crear estructura base: `index.html`, `styles.css`, `src/`.
- [x] Definir carpetas por responsabilidad: `src/core`, `src/ui`, `src/services`, `src/utils`.
- [x] Anadir punto de entrada `src/main.js`.

## 1. Modelo de dominio del juego (SOLID)
- [x] Crear `GameConfig` con tamanos permitidos `[3, 4, 5, 6]` y default `4`.
- [x] Crear entidad `Board` (matriz NxN y utilidades de acceso).
- [x] Crear `TileMergePolicy` con reglas `1+2` y `n+n` para `n>=3`.
- [x] Crear `MoveResolver` para calcular desplazamiento/fusion por direccion.
- [x] Garantizar que cada ficha fusiona solo una vez por jugada.
- [x] Crear `GameState` (tablero, puntuacion, estado de partida).
- [x] Crear `GameEngine` para orquestar turnos y aplicar reglas.
- [x] Crear funcion de deteccion de movimientos posibles (game over).

## 2. Flujo de partida
- [x] Inicializar tablero vacio y sembrar fichas iniciales.
- [x] Implementar insercion aleatoria de nuevas fichas (`1` o `2`) tras jugada valida.
- [x] Evitar insercion si no hubo cambio de tablero.
- [x] Bloquear input cuando el juego termina.
- [x] Implementar reinicio de partida conservando tamano elegido.

## 3. Selector de tamano de tablero
- [x] Crear control UI para seleccionar `3x3`, `4x4`, `5x5`, `6x6`.
- [x] Configurar valor por defecto `4x4` al cargar pagina.
- [x] Re-renderizar tablero al cambiar tamano y reiniciar estado.
- [x] Ajustar dimensiones CSS del grid segun `N`.

## 4. Input de usuario
- [x] Implementar controlador de teclado para flechas.
- [x] Mapear flechas a direcciones de `GameEngine`.
- [x] Prevenir comportamiento de scroll del navegador en flechas.
- [x] Ignorar input cuando no aplique (game over o animacion futura).

## 5. UI brutalista
- [x] Definir tokens de estilo (colores, bordes, sombras, espaciado, tipografia).
- [x] Maquetar layout principal: header, score, tablero, controles.
- [x] Estilizar fichas por valor:
  - [x] `1` magenta + texto blanco.
  - [x] `2` cyan + texto blanco.
  - [x] `>=3` fondo blanco + texto negro.
- [x] Disenar botones brutalistas (reiniciar, ver ranking, selector).
- [x] Asegurar legibilidad y contraste en escritorio.

## 6. Ranking Top 10
- [x] Definir modelo `RankingEntry` (`name`, `score`, `timestamp`).
- [x] Crear `RankingService` con reglas:
  - [x] insertar score si entra en Top 10,
  - [x] ordenar descendente por score,
  - [x] recortar a 10 entradas.
- [x] Implementar `StoragePort` (abstraccion) y `LocalStorageAdapter`.
- [x] Crear boton "Ranking" para abrir panel/modal.
- [x] Mostrar listado con columnas: puntuacion, nombre, fecha/hora.
- [x] Formatear fecha a formato local legible (`HH:mm dd/mm/yyyy`).

## 7. Captura de nombre post-partida
- [x] Al game over, evaluar si score actual entra al Top 10.
- [x] Si entra, abrir prompt/modal de nombre.
- [x] Validar maximo 5 caracteres.
- [x] Limpiar espacios iniciales/finales.
- [x] Gestionar nombre vacio con fallback (`ANON`).
- [x] Confirmar guardado y refrescar ranking visible.

## 8. Integracion de capas (SOLID)
- [x] Inyectar dependencias en `GameEngine` (ranking, storage, renderer).
- [x] Evitar acceso directo a DOM desde logica de dominio.
- [x] Evitar acceso directo a `localStorage` desde dominio.
- [x] Mantener interfaces pequeñas por modulo.
