# Prompt 1

Vamos a desarrollar el juego Threes! en javascript para que funcione en nuestro navegador

Conoces el juego Threes!?

Caracteristicas de este juego:

- al mover con la flecha hacia alguna dirección las piezas se mueven todas en esa dirección solo si hay un espacio vacio en esa dirección, si esta la pared no se pueden mover. 
-si hay otra pieza, si esa se puede mover, puedes ocupar su puesto
-las piezas tienen numeros, 1, 2, 3, 6, 12, 24, 48, etc
- si una pieza 1 va a moverse hacia 2, estas dos se convierten en 3, a partir de 3, la piezas solo se convierten si tienen el mismo numero, es decir 3 con 3, 6 con 6, 12 con 12, etc. y se convierten en la suma de las piezas

- La idea del juego es tratar de convertir las piezas en numeros cada vez mas altos.

- La dificultad del juego es que si no logras convertir o fundir las piezas, llega un momento que no hay espacio para añadir nuevas piezas hasta el punto que no se puede mover nada

- el juego termina cuando no hay posibilidad de mover, fundir ni añadir nuevas piezas


- las piezas que se añaden aleatoriamente son 1 o 2

- las piezas 1 seran magenta con el numero en blanco y las 2 cyan con el numero en blanco, el resto son blancas con el numero en negro


Quiero que hagas un Readme en la carpeta Threes-JVF donde vamos a hacer el juego, en este Readme vamos a crear un PRD sencillo, donde escribiremos como es el juego, en que consiste y algunas historias de usuarios, tecnologias y consideraciónes para el juego

# Prompt 2

Ok, 

Para el diseño utiliza una estetica brutalista.

Vamos a añadir cosas.

queremos un boton que muestro un ranking de los 10 mejores puntuaciones. Cuando la persona termina el juego, si su puntuacion puede estar en el ranking se le pide un nombre que no supere de 5 caracteres. En la lista se muestra, puntuación, nombre y fecha (hora dia y año)

tambien me gustaria innovar con la posibilidad de esocger un tablero 3x3, 4x4, 5x5, y 6x6. Siempre al abrir la web aparece 4x4 por defecto

Tambien me gustaría hacer buenas practicas SOLID para escrbir el codigo

Redefine el Readme con lo que hemos añadido y crea un archivo task.md con las tareas atomicas necesarias para hacer este desarrollo
