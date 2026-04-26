# **Tablero de Tickets Técnicos: Osmos Web Clone**

## **TICK-01: Setup del Motor y Renderizado Base (Ref: US-01)**

* **Tipo:** Feature / Setup  
* **Descripción:** Configurar el esqueleto del archivo HTML único, inicializar Phaser 3 y crear la clase base CuerpoCeleste para manejar la relación Masa \-\> Área.  
* **AC Técnicos:**  
  * Importar Phaser vía CDN en el \<head\>.  
  * Configurar Phaser.Physics.Arcade sin gravedad ni fricción (drag \= 0, friction \= 0).  
  * Implementar el cálculo de radio: $r = \sqrt{m / \pi} \times k$ (definir $k$ constante visual).  
  * Activar el rebote elástico contra los límites del mundo (setBounce(1) y setCollideWorldBounds(true)).  
* **Estimación:** 3  
* **DoD:** Una masa de prueba se renderiza en pantalla con el tamaño correcto, se mueve a velocidad constante y rebota en los bordes sin perder energía.

## **TICK-02: Lógica de Colores Relativos (Ref: US-05)**

* **Tipo:** Feature  
* **Descripción:** Implementar la actualización dinámica del tint (color) de los NPCs evaluando su masa en relación al jugador.  
* **AC Técnicos:**  
  * En el método update() de las masas o en un evento de cambio de masa, evaluar: if (npc.masa \> jugador.masa) \-\> tint rojo (0xff0000).  
  * else if (npc.masa \< jugador.masa) \-\> tint verde (0x00ff00).  
  * El jugador siempre tiene tint azul (0x0000ff).  
* **Estimación:** 2  
* **DoD:** Al colocar masas de diferentes tamaños en el nivel de prueba, cambian de color correctamente según la masa actual del jugador.

## **TICK-03: Motor de Propulsión (Eyección) (Ref: US-02)**

* **Tipo:** Feature  
* **Descripción:** Capturar clicks del mouse, calcular el vector normalizado y aplicar el impulso conservando el momento lineal.  
* **AC Técnicos:**  
  * Detectar pointerdown (1 click \= $m_e = 2$) y doble click (o click rápido consecutivo, $m_e = 4$).  
  * Calcular vector normalizado $\vec{u}$ desde el centro del jugador hasta el puntero.  
  * Instanciar un nuevo sprite (la masa eyectada) en el borde del jugador con velocidad $\vec{v}_e$ en dirección $\vec{u}$.  
  * Actualizar la velocidad del jugador ($\vec{v}_f$) aplicando: $m_i \vec{v}_i = (m_i - m_e) \vec{v}_f + m_e \vec{v}_e$.  
  * Reducir la masa del jugador y actualizar su radio.  
* **Estimación:** 5  
* **DoD:** El jugador puede navegar por el espacio emitiendo partículas; la trayectoria resultante del sistema es predecible matemáticamente.

## **TICK-04: Colisiones Inelásticas y Absorción (Ref: US-03)**

* **Tipo:** Feature  
* **Descripción:** Implementar el overlap de Phaser para detectar cuando dos masas se tocan y ejecutar la absorción.  
* **AC Técnicos:**  
  * Desactivar la resolución de colisión sólida por defecto de Arcade; usar physics.add.overlap.  
  * Si overlap es true, calcular distancia entre centros; si distancia \< (radio1 \+ radio2), ocurre el choque.  
  * La masa mayor ($m_1$) absorbe a la menor ($m_2$). Destruir el GameObject de $m_2$.  
  * Nueva velocidad de $m_1$: $\vec{v}_f = \frac{m_1 \vec{v}_1 + m_2 \vec{v}_2}{m_1 + m_2}$.  
  * Sumar masas y recalcular el radio de $m_1$.  
* **Estimación:** 5  
* **DoD:** Cuando dos cuerpos se tocan, el menor desaparece y el mayor crece y altera su vector de velocidad sin violar la conservación del momento.

## **TICK-05: Condiciones de Fin de Juego (Ref: US-04)**

* **Tipo:** Feature  
* **Descripción:** Monitorear el estado del jugador para disparar la condición de Derrota.  
* **AC Técnicos:**  
  * Si en TICK-04 el jugador es la masa menor ($m_2$), disparar Game Over.  
  * Si en TICK-03 el jugador intenta hacer click y su masa \<= masa\_a\_eyectar, disparar Game Over (no hay suficiente masa).  
  * Mostrar UI básica superpuesta (texto HTML/CSS o en Phaser) indicando "Derrota \- Reiniciando...".  
* **Estimación:** 3  
* **DoD:** El juego se pausa/reinicia adecuadamente al perder y bloquea inputs adicionales.

## **TICK-06: Generación Paramétrica y Transición de Niveles (Ref: US-06)**

* **Tipo:** Feature  
* **Descripción:** Crear el sistema de niveles progresivos evaluando la condición de Victoria.  
* **AC Técnicos:**  
  * Estado global: nivelActual (1 al 10).  
  * Función generarNivel(n): Instancia al jugador (masa 100\) en el centro. Genera $N$ NPCs aleatorios alrededor (donde $N = 5 + n \times 2$).  
  * La masa máxima de un NPC generado inicialmente dependerá del nivel (ej: masas mucho más grandes en nivel 10).  
  * En el update(), verificar: Si enemigosVivos \=== 0, incrementar nivelActual y llamar a generarNivel(nivelActual).  
* **Estimación:** 5  
* **DoD:** El jugador transita del nivel 1 al 10 fluidamente al limpiar la pantalla, con un aumento claro de la densidad de masas enemigas.