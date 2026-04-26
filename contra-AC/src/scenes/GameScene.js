import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_HEIGHT,
  LEVEL_WIDTH_SCREENS,
  LEVEL_DURATION_SECONDS,
  GOAL_MARKER_WIDTH,
  GOAL_MARKER_COLOR,
  ENEMY_VARIANTS,
} from '../config.js';
import { Player } from '../entities/Player.js';
import { createBulletPool } from '../entities/Bullet.js';
import { EnemySpawner } from '../entities/EnemySpawner.js';
import { HUD } from '../ui/HUD.js';
import { playVictoryPlaceholder } from '../audio.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const levelWidth = GAME_WIDTH * LEVEL_WIDTH_SCREENS;

    this.cameras.main.setBackgroundColor('#7ec0ee');

    this.add
      .tileSprite(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT, 'grass-tileset')
      .setOrigin(0, 0);

    this.groundBody = this.add
      .rectangle(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT)
      .setOrigin(0, 0)
      .setVisible(false);
    this.physics.add.existing(this.groundBody, true);

    this.physics.world.setBounds(0, 0, levelWidth, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, levelWidth, GAME_HEIGHT);

    this.bullets = createBulletPool(this);
    this.physics.add.collider(this.bullets, this.groundBody, (bullet) => {
      bullet.disableBody(true, true);
    });

    this.player = new Player(this, 80, GAME_HEIGHT - GROUND_HEIGHT - 100);
    this.physics.add.collider(this.player, this.groundBody);

    this.enemies = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.groundBody);
    this.physics.add.collider(this.player, this.enemies);

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      if (!bullet.friendly) return;
      bullet.disableBody(true, true);
      enemy.takeDamage(1);
    });

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!enemy.active || enemy.dead) return;
      player.takeDamage(1);
    });

    this.physics.add.overlap(this.player, this.bullets, (player, bullet) => {
      if (bullet.friendly) return;
      bullet.disableBody(true, true);
      player.takeDamage(1);
    });

    this.spawner = new EnemySpawner(this, this.enemies);

    // Goal marker at the right edge of the level.
    const goalX = levelWidth - GOAL_MARKER_WIDTH;
    this.add
      .rectangle(goalX, 0, GOAL_MARKER_WIDTH, GAME_HEIGHT, GOAL_MARKER_COLOR)
      .setOrigin(0, 0);
    this.goal = this.add
      .rectangle(goalX, 0, GOAL_MARKER_WIDTH, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setVisible(false);
    this.physics.add.existing(this.goal, true);
    this.victoryFired = false;
    this.physics.add.overlap(this.player, this.goal, () => this.onVictory());

    this.cameras.main.startFollow(this.player, true, 0.1, 0);

    this.hud = new HUD(this);
    this.events.emit('player-hp-changed', this.player.hp);

    // Score
    this.score = 0;
    this.events.emit('score-changed', this.score);
    this.events.on('enemy-killed', ({ variant }) => {
      this.score += ENEMY_VARIANTS[variant].scoreValue;
      this.events.emit('score-changed', this.score);
    });

    // Countdown timer
    this.timeLeftSec = LEVEL_DURATION_SECONDS;
    this.events.emit('timer-changed', this.timeLeftSec);
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tickTimer(),
    });

    // Pause input — read via JustDown in update() to avoid the keydown-listener double-fire
    // that can happen when PauseScene resumes GameScene on the same key event.
    this.pauseKeys = this.input.keyboard.addKeys({
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });
  }

  openPause() {
    if (this.scene.isActive('PauseScene')) return;
    if (this.player.dead) return;
    this.scene.launch('PauseScene');
    this.scene.pause();
  }

  tickTimer() {
    this.timeLeftSec = Math.max(0, this.timeLeftSec - 1);
    this.events.emit('timer-changed', this.timeLeftSec);
    if (this.timeLeftSec <= 0) {
      this.timerEvent.remove(false);
      this.scene.start('GameOverScene', { reason: 'time_up', score: this.score });
    }
  }

  onVictory() {
    if (this.victoryFired) return;
    if (this.player.dead) return;
    this.victoryFired = true;
    this.timerEvent.remove(false);
    playVictoryPlaceholder();
    this.scene.start('VictoryScene', { score: this.score });
  }

  update() {
    if (
      Phaser.Input.Keyboard.JustDown(this.pauseKeys.p) ||
      Phaser.Input.Keyboard.JustDown(this.pauseKeys.esc)
    ) {
      this.openPause();
      return;
    }
    this.player.update();
  }
}
