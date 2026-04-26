// Configuración constante de escala visual: r = sqrt(m / PI) * k
const VISUAL_SCALE_K = 4;

// Colores base
const COLOR_PLAYER = 0x0088ff; // Azul
const COLOR_ENEMY_BIG = 0xff4444; // Rojo (Peligro)
const COLOR_ENEMY_SMALL = 0x44ff44; // Verde (Presa)
const COLOR_EJECT = 0x88ccff; // Celeston para masa eyectada

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.isGameOver = false;
        this.isLevelTransition = false;
        this.lastClickTime = 0;
        this.nivelActual = 1;
    }

    create() {
        // 1. Generación Procedimental de Assets (Efecto 3D con bordes nítidos)
        let canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        let ctx = canvas.getContext('2d');
        
        // Gradiente radial: centro desplazado para simular luz desde arriba a la izquierda
        let grd = ctx.createRadialGradient(70, 70, 10, 100, 100, 100);
        grd.addColorStop(0, "#ffffff"); // Brillo especular
        grd.addColorStop(1, "#333333"); // Sombra oscura en el borde
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(100, 100, 100, 0, 2 * Math.PI);
        ctx.fill();
        
        this.textures.addCanvas('circulo', canvas);

        // 2. Fondo Espacial y Estrellas
        this.cameras.main.setBackgroundColor('#020208');
        for(let i = 0; i < 200; i++) {
            let r = Phaser.Math.FloatBetween(0.5, 2);
            let star = this.add.circle(
                Phaser.Math.Between(0, this.sys.canvas.width),
                Phaser.Math.Between(0, this.sys.canvas.height),
                r, 0xffffff
            );
            star.setAlpha(Phaser.Math.FloatBetween(0.1, 0.8));
        }

        // 3. Grupos Físicos (Sin gravedad, sin fricción)
        this.masas = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 1,
            bounceY: 1,
            dragX: 0,
            dragY: 0,
            frictionX: 0,
            frictionY: 0
        });

        this.eyectadas = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 1,
            bounceY: 1
        });

        // Gráfico para dibujar los límites del mundo en cada nivel
        this.worldBorder = this.add.graphics();

        // UI Listeners
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.avanzarNivel();
        });

        document.getElementById('btn-instructions').addEventListener('click', () => {
            if (this.isGameOver || this.isLevelTransition) return;
            this.scene.pause(); // Pausa el motor de físicas y el update
            document.getElementById('instructions-modal').classList.remove('hidden');
        });

        document.getElementById('btn-close-instructions').addEventListener('click', () => {
            document.getElementById('instructions-modal').classList.add('hidden');
            if (!this.isGameOver && !this.isLevelTransition) {
                this.scene.resume(); // Reanuda la simulación
            }
        });

        // Iniciar la generación paramétrica del primer nivel
        this.iniciarNivel();

        // 6. Controles (Click y Doble Click)
        this.input.on('pointerdown', (pointer) => {
            if(this.isGameOver || this.isLevelTransition) return;
            
            // Previene el disparo si el modal de instrucciones está abierto o si clickeaste un botón UI
            if(!document.getElementById('instructions-modal').classList.contains('hidden')) return;
            if(pointer.event.target.tagName === 'BUTTON') return; 
            
            let currentTime = this.time.now;
            let isDoubleClick = (currentTime - this.lastClickTime < 300);
            this.lastClickTime = currentTime;

            let masaEyectada = isDoubleClick ? 4 : 2;
            this.eyectarMasa(pointer.x, pointer.y, masaEyectada);
        });

        // 7. Colisiones (Overlap para Choque Inelástico)
        // Chequeo entre todas las masas principales (Jugador y NPCs)
        this.physics.add.overlap(this.masas, this.masas, this.resolverChoqueInelastico, null, this);
        // Chequeo entre masas eyectadas y masas principales
        this.physics.add.overlap(this.masas, this.eyectadas, this.resolverChoqueInelastico, null, this);
    }

    obtenerConfiguracionNivel(nivel) {
        // Factor de escala lineal: 0 (nivel 1) a 1 (nivel 10)
        let f = (nivel - 1) / 9;
        return {
            numNpcs: 4 + Math.floor(nivel * 1.5), // Nivel 1: 5 masas. Nivel 10: 19 masas.
            masaMin: 15,
            masaMax: 60 + (nivel * 25), 
            velMax: 5 + (nivel * 6),
            worldScale: 0.5 + (0.5 * f) // Ancho y alto al 50% = 1/4 del área en Nivel 1
        };
    }

    iniciarNivel() {
        this.isLevelTransition = false;
        document.getElementById('level-complete').classList.add('hidden');
        document.getElementById('current-level').innerText = this.nivelActual;
        
        // Limpiar entidades físicas del nivel anterior
        this.masas.clear(true, true);
        this.eyectadas.clear(true, true);

        let config = this.obtenerConfiguracionNivel(this.nivelActual);

        // 1. Ajustar el espacio de simulación (físicas) centrado
        let w = this.sys.canvas.width * config.worldScale;
        let h = this.sys.canvas.height * config.worldScale;
        let offsetX = (this.sys.canvas.width - w) / 2;
        let offsetY = (this.sys.canvas.height - h) / 2;

        this.physics.world.setBounds(offsetX, offsetY, w, h);

        // 2. Dibujar el marco visual del nivel actual
        this.worldBorder.clear();
        this.worldBorder.lineStyle(2, 0x444466, 0.8);
        this.worldBorder.strokeRect(offsetX, offsetY, w, h);

        // Instanciar Jugador en el centro matemático del nuevo mundo
        this.player = this.crearMasa(offsetX + w / 2, offsetY + h / 2, 100, true);
        
        // Nuevo: Movimiento aleatorio inicial para el jugador
        this.player.body.setVelocity(
            Phaser.Math.Between(-config.velMax, config.velMax),
            Phaser.Math.Between(-config.velMax, config.velMax)
        );

        // Instanciar NPCs paramétricos
        for(let i = 0; i < config.numNpcs; i++) {
            let x, y, dist;
            // Bucle para asegurar que spawnean lejos del jugador
            do {
                x = Phaser.Math.Between(offsetX + 50, offsetX + w - 50);
                y = Phaser.Math.Between(offsetY + 50, offsetY + h - 50);
                dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
            } while (dist < 200 * config.worldScale);
            
            // Condición para garantizar AL MENOS una masa mayor (Depredador)
            let masaNpc;
            if (i === 0) {
                masaNpc = Phaser.Math.Between(110, 150 + (this.nivelActual * 10)); // Siempre mayor a 100
            } else {
                masaNpc = Phaser.Math.Between(config.masaMin, config.masaMax);
            }

            let npc = this.crearMasa(x, y, masaNpc, false);
            
            npc.body.setVelocity(
                Phaser.Math.Between(-config.velMax, config.velMax),
                Phaser.Math.Between(-config.velMax, config.velMax)
            );
        }
        
        this.physics.resume();
    }

    avanzarNivel() {
        this.nivelActual++;
        if (this.nivelActual > 10) {
            this.triggerGameOver("¡HAS GANADO EL JUEGO! Has demostrado la conservación del momento con maestría.");
            document.getElementById('go-title').innerText = "¡VICTORIA SUPREMA!";
            document.getElementById('game-over').style.borderColor = "#44ff44";
            return;
        }
        this.iniciarNivel();
    }

    update() {
        if(this.isGameOver || this.isLevelTransition) return;

        let enemigosVivos = 0;

        // Lógica de Colores Relativos y recuento de activos
        this.masas.getChildren().forEach(npc => {
            if(npc === this.player || !npc.active) return;
            
            enemigosVivos++;
            
            if(npc.massValue > this.player.massValue) {
                npc.setTint(COLOR_ENEMY_BIG);
            } else {
                npc.setTint(COLOR_ENEMY_SMALL);
            }
        });

        // UI Update
        document.getElementById('player-mass').innerText = Math.round(this.player.massValue);

        // Condición de victoria del nivel
        if (enemigosVivos === 0) {
            this.triggerLevelComplete();
            return;
        }

        // Nuevo: Chequeo matemático de condición de derrota por límite teórico
        let masasDisponibles = [];
        this.masas.getChildren().forEach(m => {
            if (m !== this.player && m.active) masasDisponibles.push(m.massValue);
        });
        this.eyectadas.getChildren().forEach(p => {
            if (p.active) masasDisponibles.push(p.massValue);
        });
        
        // Ordenamos de menor a mayor para evaluar el escenario óptimo de absorción
        masasDisponibles.sort((a, b) => a - b);
        
        let masaMaximaTeorica = this.player.massValue;
        let derrotaInminente = false;
        
        for (let masa of masasDisponibles) {
            if (masaMaximaTeorica > masa) {
                masaMaximaTeorica += masa;
            } else {
                // Nos hemos encontrado con una masa que no podemos absorber ni siquiera en el escenario óptimo
                derrotaInminente = true;
                break;
            }
        }

        if (derrotaInminente) {
            this.triggerGameOver("Tu masa y las disponibles para absorber son insuficientes para ganar.");
        }
    }

    triggerLevelComplete() {
        this.isLevelTransition = true;
        this.physics.pause();
        document.getElementById('level-complete').classList.remove('hidden');
    }

    // --- LÓGICA FÍSICA ESTRICTA ---

    crearMasa(x, y, masa, isPlayer) {
        let sprite = isPlayer ? this.masas.create(x, y, 'circulo') : this.masas.create(x, y, 'circulo');
        sprite.setTint(isPlayer ? COLOR_PLAYER : 0xffffff);
        
        // Configurar cuerpo físico circular exacto
        sprite.body.setCircle(100); 
        this.actualizarEscalaMasa(sprite, masa);
        
        return sprite;
    }

    actualizarEscalaMasa(sprite, masa) {
        sprite.massValue = masa;
        // Cálculo del radio basado en el área
        let radio = Math.sqrt(masa / Math.PI) * VISUAL_SCALE_K;
        // Como la textura original tiene diámetro 200 (radio 100), la escala es radio/100
        sprite.setScale(radio / 100);
    }

    eyectarMasa(targetX, targetY, masaEyectada) {
        if(this.player.massValue <= masaEyectada) {
            this.triggerGameOver("Masa insuficiente para propulsión.");
            return;
        }

        // Conservación de momento: m_i * v_i = (m_i - m_e) * v_f + m_e * v_e
        let mi = this.player.massValue;
        let vi_x = this.player.body.velocity.x;
        let vi_y = this.player.body.velocity.y;
        let me = masaEyectada;

        // Vector dirección hacia el puntero
        let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
        
        // La masa eyectada sale HACIA el puntero (sumamos el coseno/seno en lugar de restar)
        let velocidadEyeccionEscalar = 350; 
        let ve_x = vi_x + Math.cos(angle) * velocidadEyeccionEscalar;
        let ve_y = vi_y + Math.sin(angle) * velocidadEyeccionEscalar;

        // Calculamos nueva velocidad del jugador aislando v_f
        let mf = mi - me;
        let vf_x = (mi * vi_x - me * ve_x) / mf;
        let vf_y = (mi * vi_y - me * ve_y) / mf;

        // Aplicar
        this.actualizarEscalaMasa(this.player, mf);
        this.player.body.setVelocity(vf_x, vf_y);

        // Crear partícula eyectada en el borde del jugador HACIA el puntero
        let radioJugador = Math.sqrt(this.player.massValue / Math.PI) * VISUAL_SCALE_K;
        let spawnX = this.player.x + Math.cos(angle) * (radioJugador + 2); 
        let spawnY = this.player.y + Math.sin(angle) * (radioJugador + 2);
        
        let particula = this.eyectadas.create(spawnX, spawnY, 'circulo');
        particula.setTint(COLOR_EJECT);
        particula.body.setCircle(100);
        this.actualizarEscalaMasa(particula, me);
        particula.body.setVelocity(ve_x, ve_y);
    }

    resolverChoqueInelastico(cuerpo1, cuerpo2) {
        // Prevenir múltiples llamadas en el mismo frame para cuerpos ya destruidos
        if(!cuerpo1.active || !cuerpo2.active) return;

        // Chequeo matemático estricto de overlap mediante distancia
        let radio1 = Math.sqrt(cuerpo1.massValue / Math.PI) * VISUAL_SCALE_K;
        let radio2 = Math.sqrt(cuerpo2.massValue / Math.PI) * VISUAL_SCALE_K;
        let dist = Phaser.Math.Distance.Between(cuerpo1.x, cuerpo1.y, cuerpo2.x, cuerpo2.y);
        
        if (dist > (radio1 + radio2) * 0.95) return; // Multiplicador para dar margen visual

        let winner = cuerpo1.massValue > cuerpo2.massValue ? cuerpo1 : cuerpo2;
        let loser = cuerpo1.massValue > cuerpo2.massValue ? cuerpo2 : cuerpo1;

        // Si son exactamente iguales, destruimos ambos para evitar bucles (edge case físico)
        if(cuerpo1.massValue === cuerpo2.massValue) {
             if(cuerpo1 === this.player || cuerpo2 === this.player) this.triggerGameOver("Colisión con masa idéntica.");
             cuerpo1.destroy();
             cuerpo2.destroy();
             return;
        }

        // Cálculo inelástico: v_f = (m1*v1 + m2*v2) / (m1+m2)
        let m1 = winner.massValue;
        let m2 = loser.massValue;
        let v1x = winner.body.velocity.x;
        let v1y = winner.body.velocity.y;
        let v2x = loser.body.velocity.x;
        let v2y = loser.body.velocity.y;

        let vf_x = (m1 * v1x + m2 * v2x) / (m1 + m2);
        let vf_y = (m1 * v1y + m2 * v2y) / (m1 + m2);

        winner.body.setVelocity(vf_x, vf_y);
        this.actualizarEscalaMasa(winner, m1 + m2);

        if(loser === this.player) {
            this.triggerGameOver("Has sido absorbido por una masa mayor.");
        }

        loser.destroy(); // La masa menor desaparece
    }

    triggerGameOver(razon) {
        if(this.isGameOver) return;
        this.isGameOver = true;
        
        // Pausar físicas
        this.physics.pause();
        this.player.setTint(0x555555); // Jugador grisáceo (muerto)

        // Mostrar UI
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('go-reason').innerText = razon;
    }
}

const phaserConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: { debug: false } // Cambiar a true para ver bounding boxes
    },
    scene: MainScene
};

const game = new Phaser.Game(phaserConfig);

// Responsive handling
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
