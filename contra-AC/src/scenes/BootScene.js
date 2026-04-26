import {
  ANIM_FRAMERATE_IDLE,
  ANIM_FRAMERATE_WALK,
  ANIM_FRAMERATE_ATTACK,
} from '../config.js';

const RES = 'resources/Characters(100x100)/Soldier/Soldier';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Soldier-Idle.png: 600x100 → 6 frames at 100x100.
    this.load.spritesheet('soldier-idle', `${RES}/Soldier-Idle.png`, {
      frameWidth: 100,
      frameHeight: 100,
    });
    // Soldier-Walk.png: 800x100 → 8 frames at 100x100.
    this.load.spritesheet('soldier-walk', `${RES}/Soldier-Walk.png`, {
      frameWidth: 100,
      frameHeight: 100,
    });
    // Soldier-Attack01.png: 600x100 → 6 frames at 100x100.
    this.load.spritesheet('soldier-attack', `${RES}/Soldier-Attack01.png`, {
      frameWidth: 100,
      frameHeight: 100,
    });
    // grass tileset.png: 384x128. Loaded as a single image; the ground tiles the whole bitmap horizontally.
    this.load.image('grass-tileset', 'resources/grass tileset.png');
    // Arrow01(32x32).png: single 32x32 frame; horizontal arrow pointing right.
    this.load.image('arrow', 'resources/Arrow(Projectile)/Arrow01(32x32).png');
  }

  create() {
    this.anims.create({
      key: 'soldier-idle',
      frames: this.anims.generateFrameNumbers('soldier-idle', { start: 0, end: 5 }),
      frameRate: ANIM_FRAMERATE_IDLE,
      repeat: -1,
    });

    this.anims.create({
      key: 'soldier-walk',
      frames: this.anims.generateFrameNumbers('soldier-walk', { start: 0, end: 7 }),
      frameRate: ANIM_FRAMERATE_WALK,
      repeat: -1,
    });

    this.anims.create({
      key: 'soldier-attack',
      frames: this.anims.generateFrameNumbers('soldier-attack', { start: 0, end: 5 }),
      frameRate: ANIM_FRAMERATE_ATTACK,
      repeat: 0,
    });

    this.scene.start('TitleScene');
  }
}
