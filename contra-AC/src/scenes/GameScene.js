import { GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, LEVEL_WIDTH_SCREENS } from '../config.js';
import { Player } from '../entities/Player.js';
import { createBulletPool } from '../entities/Bullet.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const levelWidth = GAME_WIDTH * LEVEL_WIDTH_SCREENS;

    this.cameras.main.setBackgroundColor('#7ec0ee');

    // Ground visual: tile the full grass tileset image horizontally; the visible top GROUND_HEIGHT pixels show.
    this.add
      .tileSprite(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT, 'grass-tileset')
      .setOrigin(0, 0);

    // Invisible static body for collision, sized to match the visual ground strip.
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

    this.cameras.main.startFollow(this.player, true, 0.1, 0);
  }

  update() {
    this.player.update();
  }
}
