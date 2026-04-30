# Memory — Encuentra las Parejas
**Autora:** Salma Siqueiros Morales (SSM)  
**Herramienta usada:** Claude (claude.ai)

---

## Descripción del juego

Juego de memoria clásico con 16 cartas (8 parejas de animales emoji). El jugador voltea dos cartas por turno buscando encontrar todas las parejas. El juego registra el número de intentos y el tiempo transcurrido.

**Cómo se juega:**
- Haz clic en cualquier carta para voltearla
- Voltea una segunda carta intentando encontrar su pareja
- Si coinciden, permanecen descubiertas y brillan en rojo
- Si no coinciden, se vuelven a ocultar después de un segundo
- El objetivo es encontrar las 8 parejas en el menor número de intentos y tiempo posible

---

## Prompts utilizados

### Prompt 1 — Concepto y diseño visual

```
Quiero crear un juego de Memory (concentración, parejas de cartas) en HTML, CSS y JavaScript puro, sin librerías externas.

El juego debe tener:
- 16 cartas (8 parejas) con emojis de animales
- Animación flip 3D al voltear las cartas
- Diseño oscuro y elegante, lo más vistoso posible
- Contador de intentos y cronómetro
- Efecto visual especial cuando se encuentra una pareja
- Modal de victoria con confetti al completar el juego
- Botón de reinicio

Genera los tres archivos por separado: index.html, style.css y game.js.
El CSS debe usar variables CSS, fuentes de Google Fonts y animaciones fluidas.
```

### Prompt 2 — Corrección de lógica

```
En el juego de Memory hay un problema: cuando hago clic rápidamente en 
una tercera carta antes de que las dos anteriores se voltéen de vuelta, 
el juego se rompe. 

Necesito que mientras el sistema está evaluando si dos cartas son pareja 
(el segundo entre el segundo click y la animación de volteo), no se 
puedan voltear más cartas. Implementa un mecanismo de bloqueo (isLocked) 
que resuelva esto.
```

### Prompt 3 — Mejora visual del modal de victoria

```
El modal de victoria necesita mejorar. Quiero que:
1. Aparezca con una animación de escala (scale 0.85 → 1) además del fade
2. El trofeo tenga una animación de flotación suave y continua
3. Se muestren los stats finales (intentos y tiempo) con tipografía grande y dorada
4. El botón "Jugar de nuevo" tenga un hover llamativo con sombra en rojo
Modifica solo el CSS y el JS relacionado con el modal.
```

### Prompt 4 — Confetti

```
Añade un efecto de confetti al ganar. Debe:
- Generar ~120 piezas de confetti con colores variados
- Incluir tres formas: círculo, cuadrado y triángulo
- Caer desde arriba con duraciones y delays aleatorios para que se vea natural
- Limpiar el confetti al reiniciar el juego
Implementalo sin librerías externas, solo CSS y JS puro.
```

---

## Desafíos encontrados

**Doble click rápido:** El principal problema fue que al hacer clic rápidamente en una tercera carta antes de que termine la animación, la lógica de comparación se rompía. Se resolvió con la variable `isLocked` que bloquea toda interacción mientras el sistema procesa la comparación.

**Backface visibility:** En algunos navegadores el dorso de la carta se veía a través del frente durante la animación flip. Se resolvió aplicando `-webkit-backface-visibility: hidden` además de la propiedad estándar.

**Timer y reinicio:** Al reiniciar era importante limpiar el `setInterval` anterior antes de crear uno nuevo, para evitar que dos timers corrieran en paralelo acelerando el contador.
