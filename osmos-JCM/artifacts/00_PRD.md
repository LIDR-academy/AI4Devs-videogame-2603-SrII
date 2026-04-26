# **Product Requirements Document (PRD): Juego "Osmos Web Clone"**

## **1\. Visión y Objetivo**

Crear un juego web 2D de supervivencia y absorción de masas basado estrictamente en las leyes de la física (conservación del momento lineal). El jugador debe convertirse en la masa dominante absorbiendo a cuerpos más pequeños y evitando a los más grandes. Todo el código del juego (HTML, CSS, JS, y la carga de Phaser) se ejecutará al abrir un único archivo .html en el navegador.

## **2\. Reglas Físicas y Matemáticas del Entorno**

* **Dimensión y Masa:** El juego es 2D. Se renderiza el área del cuerpo, la cual es directamente proporcional a su masa ($A \propto m$). Por tanto, el radio de las esferas (círculos) es $r = \sqrt{m / \pi} \times k$ (donde $k$ es una constante de escala visual).  
* **Fricción:** Cero ($\mu = 0$). Los cuerpos en movimiento mantienen su inercia indefinidamente a menos que colisionen o expulsen masa.  
* **Colisiones y Absorción (Choque Inelástico):** * Si $m_1$ colisiona con $m_2$ y $m_1 > m_2$, $m_1$ absorbe a $m_2$.  
  * Nueva masa: $m_f = m_1 + m_2$  
  * Nuevo momento lineal: $\vec{P}_f = \vec{p}_1 + \vec{p}_2 \Rightarrow \vec{v}_f = \frac{m_1 \vec{v}_1 + m_2 \vec{v}_2}{m_1 + m_2}$  
* **Propulsión (Eyección de Masa):**  
  * Al hacer click, el jugador eyecta masa ($m_e$) en dirección opuesta al vector formado por el centro del jugador y el puntero del mouse.  
  * Por conservación de momento: $m_i \vec{v}_i = (m_i - m_e) \vec{v}_{nueva} + m_e \vec{v}_{eyectada}$  
* **Límites:** Caja de colisión cerrada. Choques perfectamente elásticos contra las paredes (la velocidad invierte su signo en el eje de colisión).

## **3\. Mecánicas de Jugabilidad**

* **Jugador:** Color azul. Inicia siempre con 100 unidades de masa.  
* **Eyección:** \* 1 Click \= Expulsa 2 unidades de masa.  
  * Doble Click \= Expulsa 4 unidades de masa.  
* **NPCs (Masas del entorno):** \* Movimiento inercial inicial aleatorio (sin IA, no se auto-propulsan).  
  * Color discreto según tamaño relativo al jugador: Rojizas si son más grandes (peligro), Verdosas si son más pequeñas (presas). No hay mezcla ni interpolación de color.  
* **Condición de Victoria:** Absorber absolutamente todas las masas presentes en el nivel.  
* **Condiciones de Derrota:**  
  1. Ser absorbido por una masa mayor.  
  2. Intentar eyectar masa y no tener suficiente (masa actual $<$ masa a eyectar).

## **4\. Fases Secuenciales de Desarrollo**

1. **Setup Físico (15 min):** Configurar canvas, motor de físicas (Arcade o Matter.js sin gravedad/fricción) y renderizado base en el archivo .html.  
2. **Propulsión y Controles (15 min):** Lógica de mouse, cálculo de vectores, instanciación de masa eyectada y aplicación de impulsos conservando el momento lineal.  
3. **Colisiones y Absorción (15 min):** Lógica de superposición, sumatoria de masas, cálculo de velocidad resultante y actualización visual de colores y radios.  
4. **Game Loop y Niveles (15 min):** Condiciones de victoria/derrota, generador paramétrico de los 10 niveles progresivos.

## **5\. Non-Goals (Límites del Proyecto)**

* NO habrá fricción ni desaceleración de ningún tipo.  
* NO habrá IA persiguiendo o huyendo del jugador.  
* NO habrá múltiples archivos (solo un .html con su \<style\> y \<script\>).  
* NO habrá multijugador ni persistencia de datos.

## **6\. Métricas y KPIs (Definition of Done)**

* **Performance:** Mantener 60 FPS consistentes con múltiples colisiones simultáneas.  
* **Precisión Física:** El área sumada de todas las entidades en pantalla debe mantenerse exactamente constante desde el inicio del nivel hasta el final, demostrando que la masa se conserva.
