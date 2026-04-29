# Threes-JVF - PRD (Producto Minimo Viable)

## 1) Vision del producto
Construir una version web de **Threes!** en JavaScript, jugable en navegador con teclado, con una identidad visual **brutalista** y foco en rendimiento y claridad de reglas.

La experiencia debe ser simple de entender, dificil de dominar y mantener una progresion basada en fusionar piezas para alcanzar valores altos.

## 2) Descripcion del juego
Threes! se juega sobre un tablero configurable. Por defecto, al abrir la web debe iniciar en **4x4**.

En cada turno, la persona jugadora mueve todas las piezas con una flecha (arriba, abajo, izquierda, derecha).

### Reglas clave
- Las piezas se desplazan en la direccion elegida solo si hay avance posible (espacio vacio o casilla que quedara libre por el mismo movimiento).
- Si una pieza tiene pared inmediata y no existe desplazamiento posible, permanece en su sitio.
- Fusion especial inicial: `1 + 2 -> 3` (y `2 + 1 -> 3`).
- Desde `3`, solo fusionan piezas iguales: `3+3`, `6+6`, `12+12`, etc.
- El resultado de fusion es la suma de ambas piezas.
- Tras un movimiento valido, se anade una nueva pieza aleatoria (`1` o `2`) en una posicion libre.
- El juego termina cuando no hay movimientos ni fusiones posibles.

## 3) Objetivo del jugador
Maximizar la puntuacion creando fichas de valor cada vez mayor y evitando el bloqueo total del tablero.

## 4) Alcance del MVP actualizado
- Tablero jugable en navegador.
- Selector de tamano de tablero: `3x3`, `4x4`, `5x5`, `6x6`.
- Valor por defecto al cargar: `4x4`.
- Movimiento por flechas con logica completa de desplazamiento/fusion.
- Insercion de nuevas piezas `1` o `2` tras jugada valida.
- Deteccion de fin de partida.
- Puntuacion visible en tiempo real.
- Ranking Top 10 persistente en cliente.
- Boton para ver ranking.
- Captura de nombre al finalizar (si entra en Top 10), maximo 5 caracteres.
- Registro en ranking con: **puntuacion, nombre y fecha/hora (dia, mes, ano y hora)**.
- Reinicio de partida.
- Interfaz brutalista.

## 5) Requisitos funcionales
1. El sistema debe permitir elegir tamano de tablero (`3x3`, `4x4`, `5x5`, `6x6`) antes de iniciar o reiniciar.
2. El sistema debe cargar por defecto en `4x4`.
3. El sistema debe permitir mover piezas con las cuatro flechas.
4. El sistema debe aplicar fusiones segun:
   - `1` con `2` (en cualquier orden) crea `3`.
   - `n` con `n` para `n >= 3` crea `2n`.
5. El sistema no debe generar nueva pieza si el movimiento no altera el tablero.
6. El sistema debe generar nueva pieza (`1` o `2`) cuando el movimiento sea valido.
7. El sistema debe detectar game over y bloquear movimientos adicionales.
8. Al finalizar, si la puntuacion entra en Top 10, el sistema debe solicitar nombre de hasta 5 caracteres.
9. El sistema debe validar y truncar/rechazar entradas que superen 5 caracteres.
10. El sistema debe guardar ranking con 10 entradas maximas, ordenadas por puntuacion descendente.
11. Cada entrada del ranking debe incluir: nombre, puntuacion y timestamp legible.
12. El sistema debe ofrecer boton/modal/panel para consultar ranking en cualquier momento.

## 6) Requisitos visuales
### Fichas
- Ficha `1`: fondo **magenta**, numero en **blanco**.
- Ficha `2`: fondo **cyan**, numero en **blanco**.
- Fichas `>= 3`: fondo **blanco**, numero en **negro**.

### Estetica brutalista
- Alto contraste, bloques solidos, bordes marcados y jerarquia visual directa.
- Tipografia sans-serif fuerte (sin ornamentos).
- Botones y paneles con formas robustas y estados claros.
- Diseno funcional por encima de decoracion.

## 7) Historias de usuario
- Como jugador, quiero elegir entre tableros `3x3`, `4x4`, `5x5` y `6x6` para ajustar dificultad.
- Como jugador, quiero empezar siempre en `4x4` al abrir la web para tener una experiencia estandar.
- Como jugador, quiero mover todas las piezas con flechas para planificar jugadas rapidas.
- Como jugador, quiero fusionar `1` y `2` para construir cadenas de crecimiento.
- Como jugador, quiero fusionar piezas iguales desde `3` para alcanzar valores altos.
- Como jugador, quiero consultar un ranking Top 10 para comparar rendimiento.
- Como jugador, quiero guardar mi nombre (maximo 5 caracteres) cuando logro una puntuacion destacada.
- Como jugador, quiero que se guarde la fecha y hora de mi record para saber cuando lo consegui.

## 8) Tecnologias propuestas
- **HTML5**: estructura de UI y paneles.
- **CSS3**: estilo brutalista, layout responsive y componentes visuales.
- **JavaScript (ES6+)**: logica de juego, flujo de UI, ranking y persistencia.
- **localStorage**: persistencia de Top 10 en cliente.

## 9) Arquitectura y buenas practicas (SOLID)
Se propone separar responsabilidades en modulos para mantener el codigo escalable:

- **Single Responsibility (S)**: clases/modulos separados para motor de juego, renderizado, input, ranking y almacenamiento.
- **Open/Closed (O)**: reglas extensibles (por ejemplo, nuevos tamanos o variantes) sin modificar nucleo.
- **Liskov Substitution (L)**: contratos claros para servicios de almacenamiento o render alternativo.
- **Interface Segregation (I)**: interfaces pequenas y especificas (input, storage, score service, board service).
- **Dependency Inversion (D)**: logica principal depende de abstracciones (por ejemplo, `StoragePort`) y no de `localStorage` directo.

## 10) Consideraciones tecnicas
- Evitar dobles fusiones de una misma pieza en un solo turno.
- Separar estado puro del tablero y capa de DOM.
- Formatear fecha/hora en formato local legible (`HH:mm dd/mm/yyyy` o equivalente definido).
- Validar nombre de ranking:
  - maximo 5 caracteres,
  - limpiar espacios extremos,
  - fallback de nombre por defecto (ej. `ANON`) si se confirma vacio.
- Mantener comportamiento consistente en todos los tamanos de tablero.

## 11) Criterios de aceptacion
- Se puede jugar partida completa en los cuatro tamanos de tablero.
- Al abrir la web, el tamano seleccionado es `4x4`.
- Las reglas de fusion se cumplen exactamente.
- La UI respeta paleta y estilo brutalista.
- El ranking Top 10 se abre desde un boton visible y muestra nombre, puntuacion y fecha/hora.
- Al finalizar partida, si aplica Top 10, se solicita nombre con limite de 5 caracteres.
- Los datos del ranking persisten tras recarga de pagina.
- Fluidez correcta en navegadores de escritorio modernos.

## 12) Fuera de alcance (por ahora)
- Cuenta de usuario y ranking online.
- Sincronizacion multi-dispositivo.
- Modo competitivo en tiempo real.
- App movil nativa.
