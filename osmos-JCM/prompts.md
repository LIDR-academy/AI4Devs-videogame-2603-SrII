# Prompts utilizados

## Prompt 1

Quiero creear una juego web, utilizando sólo un archivo html, css y javascript. El juego debe ser como el Osmos. Te explico brevemente el juego:

- Reglas generales
  - El juego se desarrolla en un espacio 2D.

- Regla general de las masas:
  - El jugador controla una masa esférica (representación circular porque es un juejo en 2D) que se mueve por el espacio.
  - Si el jugador toca una masa más pequeña que él, la masa pequeña pasa a ser parte de él, aumentando su masa.
  - Si el jugador toca una masa más grande que él, el jugador pierde ,porque es absorbido por la masa más grande.
  - El tamaño (volumen) del jugador es proporcional a su masa (ojo que se representa su área en el dibujo).
  - El jugador es de color azul. Las mases más pequeñas son verdozas. Las mases más grandes son rojizas. Los colores rojizo y verdozo se obtienen de mezclar azul con rojo y verde.

- Reglas de movimiento:
  - Para moverse, el jugador desde desprender partes pequeñas de su masa. La masa desprendida se aleja del jugador.
  - Rige el principio de reacción y conservación del momento lineal.
  - La dirección donde sale disparada la masa se define por la posición del puntero del mouse respecto al jugador.
  - La masa desprendida también es una esfera de masa que si toca a otro cuerpo es absorbida por él.
  - Si el usuario hace un click desprende una cantidad de masa definida. Si hacer doble click desprende el doble de masa.

- Reglas de jugabilidad:
  - Al inicial el juego el jugador tiene una masa de 100 unidades.
  - Habrán masas más pequelas y masas más grandes distribuidas por el espacio.
  - Cada nivel tiene que asegurar que exista posibilidad de ganar.
  - La dificultad debe ir aumentando progresivamente.
  - El juego tendrá 10 niveles.

- Stack
  - HTML
  - CSS
  - JavaScript
  - Librería Phaser

Primero, antes de escribir una sola línea de código, quiero que me hagas preguntas para que definamos todas los aspectos que no te quedan claros.
Vamos a hacer un plan de implementación siguiendo los pasos que menos aprendido en el curso (ver información de referencia), crear un PRD, historias de usuario, etc.
Con tus capaciades de creación de imágenes, quiero que me ayudes a crear las imágenes que se necesitan para el juego. Por ejemplo, el jugador, las masas, fondo, etc.

Vamos!

## Prompt 2

Respuestas a las preguntas:

1. Condición de victoria: cuando el usuario come todas las masos del nivel.
2. Límites de espacio: el espacio es limitado y las masas rebotan en los límites.
3. Friccion: No hay fricción. Las masas se mueven indefinidamente si no hay fuerzas actuando sobre ellas. Eventualmente las masas expulsadas terminararán siendo absorvidas por otras más grandes.
4. Comportamiento del entorno (IA):Las otras masas no tienen inteligencia, es decir, no expulsan masa para moverse, pero comienzan con una trayectoria y velocidad aleatoria.
5. Masa eyectada: la masa eyectada es una cantidad fija. 2 unidades por cada click. 4 unidades por cada doble click.

Observación adicional sobre masas:

- Todas las masas en el espacio, deben ser de mayor volumen que los montos de masa expulsados. El jugador no podrá expulsar más masa si su masa no le alcanza una una expulsiión. Esta es otra condición de derrota.

¿Tienes más preguntas? Si no, podemos continuar a crear el PRD.

## Prompt 3

comentarios al PRD:

1. Visión y objetivo

- No existe un ejecutable, el juego se corre al abrir el .html

3. NPCs

  Mezcla de color: sólo quiero dos colores, masas más grandes, rojizas, masas más pequeñas, verdozas. El color no depende del tamaño de la masa.

4. 

- Ojo, sólo puede haber un .css, un .html y un .js


## Prompt 4

Continua con las historias de usuario

## Prompt 5

Continua con los tickets de trabajo. Necesito todos los tickets, no sólo los de las historias principales porque necesito el juego funcional en la primera release.

## Prompt 6

Continua con los assets

## Prompt 7

Me gusta, tengo algunos comentarios.

- Cuando dices difuminado, no quiero que el borde sea dificil de distinguir. El clave que el usuario ve cuando toca otra masa.

- Para el fondo me gusta el color azul oscuro, pero debe ser muy oscuro.

- También me gusta la idea de las estrellas de fondo.

## Prompt 8

Oh, el resultados es bueno, pero:

- La masa sale en la dirección contraria a la que espero. Lo que quiero es que la masa delga hacia el punto del click no al revés.

- Las masas, todas, tiene un color plano. Digiste que harías una efecto 3D.

## Prompt 9

Quedó genial.

Vamos por los niveles. De hecho ya tengo observaciones:

- En nivel que me presentaste es muy dificil: espacio es muy grande, las masas rojas se mueven muy rápido, hay muchas masas rojas. Yo diría que eso ya sería un nivel 6 o 7 de los 10.

## Prompt 10

El espacio sigue siendo muy grande, redúcelo a 1/4 para el primer nivel. En el nivel que tenga el espacio que tiene ahora.

además, al menos debe haber una masa más grande.

## Prompt 11

Sólo una cosa más:

- Quiero un botón que diga "ver instrucciones". Al clickarlo, se pausa el juego, se abre un cuadro de diálogo con las instrucciones. Al cerrar el cuadro de dialogo se reanuda el juego.

Luego, quiero que dividas el juego en 3 archivos: html, css y js.
