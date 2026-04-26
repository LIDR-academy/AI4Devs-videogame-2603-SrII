# **Product Backlog: Osmos Web Clone**

## **1\. Backlog Priorizado**

| ID | User Story | Impacto | Urgencia | Complejidad | Riesgo | Prioridad |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **US-01** | Como jugador, quiero ver las masas representadas como círculos cuya área sea proporcional a su masa, para identificar visualmente su tamaño real. | Alto | Alta | Baja | Bajo | **1** |
| **US-02** | Como jugador, quiero hacer click para eyectar una porción exacta de mi masa y propulsarme en dirección contraria (conservando el momento lineal), para poder navegar por el espacio. | Alto | Alta | Alta | Alto | **2** |
| **US-03** | Como jugador, quiero absorber las masas más pequeñas al colisionar con ellas mediante un choque inelástico, para aumentar mi masa y tamaño. | Alto | Alta | Media | Medio | **3** |
| **US-04** | Como jugador, quiero que el juego termine en derrota si colisiono con una masa mayor o si intento eyectar masa que no tengo, para tener un desafío claro. | Alto | Media | Baja | Bajo | **4** |
| **US-05** | Como jugador, quiero poder distinguir a simple vista las masas peligrosas (rojizas) de las presas (verdosas), para tomar decisiones de vuelo rápidas. | Medio | Media | Baja | Bajo | **5** |
| **US-06** | Como jugador, quiero que al absorber a todas las masas del nivel se me presente el siguiente nivel (hasta 10\) con mayor dificultad, para tener progresión. | Medio | Baja | Media | Medio | **6** |

## **2\. Refinamiento INVEST y BDD (Historias Críticas)**

### **US-02: Propulsión por Eyección de Masa**

* **Evaluación INVEST:** Independiente, Negociable, Valiosa, Estimable (5 pts), Pequeña y Testable mediante la comprobación matemática del momento.  
* **Criterios de Aceptación (BDD):**  
  * **Escenario 1 (Happy Path \- Click simple):** * **Dado que** el jugador tiene masa 100 y está en reposo ($\vec{v} = 0$),  
    * **cuando** hace un click izquierdo,  
    * **entonces** expulsa una masa de 2 unidades en dirección al puntero, el jugador pasa a tener masa 98, y adquiere una velocidad tal que el momento lineal total del sistema siga siendo 0\.  
  * **Escenario 2 (Edge Case \- Masa insuficiente):** \* **Dado que** el jugador tiene masa 2 (o menos),  
    * **cuando** hace click para intentar propulsarse,  
    * **entonces** el juego detiene la acción y declara el estado de Derrota.

### **US-03: Absorción Inelástica**

* **Evaluación INVEST:** Independiente, Negociable, Valiosa, Estimable (3 pts), Pequeña y Testable sumando el área total antes y después del choque.  
* **Criterios de Aceptación (BDD):**  
  * **Escenario 1 (Happy Path \- Absorción exitosa):** \* **Dado que** el jugador (masa 100\) y un NPC (masa 50\) colisionan,  
    * **cuando** sus radios se superponen,  
    * **entonces** el NPC es destruido, la masa del jugador pasa a ser 150, su área aumenta proporcionalmente, y su vector velocidad se recalcula con $\vec{v}_f = \frac{m_1 \vec{v}_1 + m_2 \vec{v}_2}{m_1 + m_2}$.
