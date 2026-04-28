--- 
user
---

Necesito las reglas del juego buscaminas.

Explicacion de los algoritmos que se utilizan en el juego.

Condiciones de ganar / perder.


---
Gemini, modelo PRO 3.1
---

Aquí tienes una guía completa sobre el clásico juego Buscaminas, detallando sus reglas, condiciones de victoria y derrota, y los algoritmos que lo hacen funcionar.

## Reglas del Juego

El objetivo principal del Buscaminas es despejar un campo de minas (un tablero cuadriculado) sin detonar ninguna de ellas. 

* **Tablero inicial:** El juego comienza con una cuadrícula de casillas cubiertas. Debajo de algunas de estas casillas se ocultan minas.
* **Revelar casillas:** Al hacer clic izquierdo sobre una casilla, esta se descubre.
* **Los números:** Si la casilla descubierta no contiene una mina, mostrará un número del 1 al 8. Este número indica exactamente cuántas minas hay en las casillas adyacentes (incluyendo las diagonales).
* **Casillas vacías:** Si descubres una casilla que no tiene minas adyacentes (equivalente a un "0"), se revelará como un espacio en blanco y, automáticamente, descubrirá todas las casillas vecinas.
* **Colocar banderas:** Si deduces que una casilla oculta una mina, puedes hacer clic derecho sobre ella para colocar una bandera y evitar hacer clic accidentalmente en el futuro.
* **Información deductiva:** El jugador debe usar la lógica matemática básica basada en los números revelados para deducir qué casillas son seguras para descubrir y cuáles deben ser marcadas con banderas.

---

## Condiciones de Ganar y Perder

La lógica de finalización del juego es estricta y se basa en dos únicos escenarios posibles:

**Condición de Derrota (Perder)**
* Haces clic izquierdo sobre una casilla que contiene una mina. 
* La mina detona, el juego termina inmediatamente y el tablero revela la ubicación de todas las minas restantes (así como las banderas que se colocaron incorrectamente).

**Condición de Victoria (Ganar)**
* Descubres con éxito **todas** las casillas del tablero que NO contienen minas.
* Nota importante: No es estrictamente necesario colocar banderas en todas las minas para ganar. La victoria se activa al revelar el último espacio seguro disponible.

---

## Algoritmos Utilizados en el Juego

Detrás de la interfaz sencilla del Buscaminas, hay varios algoritmos de ciencias de la computación operando para generar el tablero y procesar las jugadas.

### 1. Algoritmo de Generación y Distribución de Minas
Para colocar las minas aleatoriamente en la cuadrícula, se suele utilizar una variación del algoritmo de barajado **Fisher-Yates** o una selección aleatoria simple.
* En las versiones modernas y justas del juego, las minas no se colocan hasta que el jugador hace su primer clic. 
* El algoritmo registra las coordenadas del primer clic, asegura que esa casilla (y a menudo sus 8 vecinas) estén libres de minas, y luego distribuye aleatoriamente las minas en el resto de la matriz. Esto garantiza que nunca pierdas en el primer movimiento.

### 2. Algoritmo de Cálculo de Adyacencia
Una vez colocadas las minas, el juego debe calcular qué número mostrará cada casilla segura.
* El algoritmo recorre la matriz bidimensional.
* Por cada mina encontrada en el tablero, el algoritmo suma `+1` al valor de todas las casillas adyacentes válidas (arriba, abajo, izquierda, derecha y las cuatro diagonales), verificando que no se salga de los límites del tablero.

### 3. Algoritmo "Flood Fill" (Relleno por Difusión)
Este es el algoritmo más interesante del juego, responsable del efecto de "cascada" cuando haces clic en una casilla vacía (un "0" sin minas adyacentes). Utiliza la teoría de grafos, comúnmente implementada a través de **Búsqueda en Profundidad (DFS)** o **Búsqueda en Anchura (BFS)**.
* Cuando el jugador revela una casilla con valor 0, el algoritmo se activa.
* Examina las 8 casillas vecinas. Si están cubiertas, las revela.
* Si alguna de esas casillas vecinas también resulta ser un 0, el algoritmo se llama a sí mismo (recursividad) para revisar los vecinos de ese nuevo 0.
* El proceso de expansión se detiene naturalmente cuando el "frente" de la cascada choca con casillas que contienen números mayores a cero, creando los bordes revelados que el jugador utiliza para continuar jugando.



--- 
user
---

bien, ahora podrias generarme un master prompt para generar el juego en una version que corra en un browser, puede ser utilizando alguna libreria de videojuegos o bien html css y javascript. Lo que consideres mas razonable para este caso.

Explica porque esa eleccion.



Necesito que generes un prompt, con estructura adecuada que se ajuste tanto para modelos de cursor como de Claude.



La interfaz web, debe ser agradable. Sorprendeme con esas instrucciones.


---
Gemini, modelo PRO 3.1
---

Para este caso, la elección tecnológica ideal es **HTML, CSS y JavaScript puro (Vanilla JS) utilizando el DOM y CSS Grid**. 

### ¿Por qué esta elección?
1. **Naturaleza del juego:** El Buscaminas no requiere físicas complejas, colisiones en tiempo real, ni un bucle de renderizado a 60 FPS continuo. Es un juego de estados discretos basados en una cuadrícula. 
2. **Eficiencia y Simplicidad:** Usar una librería de videojuegos como Phaser.js o Unity para WebGL sería "matar una mosca a cañonazos". Añadiría peso innecesario y una curva de aprendizaje o configuración de entorno que no aporta valor real aquí.
3. **Poder del CSS Moderno:** Con CSS Grid, crear y mantener la alineación del tablero es trivial. Además, el CSS moderno nos permite aplicar animaciones, transiciones, sombras y efectos visuales (como *glassmorphism* o neón) con muy pocas líneas de código, logrando esa interfaz "agradable y sorprendente" sin usar la etiqueta `<canvas>`.
4. **Manejo de Eventos:** El DOM de HTML maneja nativamente los eventos de clic izquierdo (`click`) y derecho (`contextmenu`), que son el núcleo de la interacción del juego.

A continuación, tienes el "Master Prompt". Está estructurado utilizando las mejores prácticas de ingeniería de prompts (contexto, tarea, restricciones, estilo visual y lógica), optimizado para que modelos avanzados como Claude 3.5 Sonnet o GPT-4o (usados en Cursor) generen un código modular y funcional a la primera.

---

### Master Prompt (Copia y pega desde aquí)

```text
Actúa como un Desarrollador Frontend Senior experto en UI/UX y lógica de juegos en el navegador. Tu tarea es generar el código completo para un juego de Buscaminas funcional, utilizando HTML5, CSS3 moderno y JavaScript Vanilla. 

El juego debe estar contenido preferiblemente en un solo archivo HTML (con estilos y scripts integrados) para facilitar su ejecución inmediata, o claramente dividido si lo consideras mejor para la arquitectura.

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
* Usa variables y funciones descriptivas (en inglés o español, pero consistente).
* Maneja el estado del juego (ej. `isGameOver`, `board`, `minesLeft`) en un objeto de estado o variables globales limpias.
* Comenta los bloques clave, especialmente la lógica del "Flood Fill" y la inicialización segura del primer clic.

Genera el código ahora.
```