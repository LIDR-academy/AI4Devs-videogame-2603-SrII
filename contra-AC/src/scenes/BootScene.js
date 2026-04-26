import {
  ANIM_FRAMERATE_IDLE,
  ANIM_FRAMERATE_WALK,
  ANIM_FRAMERATE_ATTACK,
  ANIM_FRAMERATE_HURT,
  ANIM_FRAMERATE_DEATH,
  ANIM_FRAMERATE_ENEMY_IDLE,
  ANIM_FRAMERATE_ENEMY_WALK,
  ANIM_FRAMERATE_ENEMY_ATTACK,
  ANIM_FRAMERATE_ENEMY_HURT,
  ANIM_FRAMERATE_ENEMY_DEATH,
  TILE_SIZE,
} from '../config.js';

const SOLDIER = 'resources/Characters(100x100)/Soldier/Soldier';
const ORC = 'resources/Characters(100x100)/Orc/Orc';
const AUDIO = 'resources/audio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.spritesheet('soldier-idle', `${SOLDIER}/Soldier-Idle.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('soldier-walk', `${SOLDIER}/Soldier-Walk.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('soldier-attack', `${SOLDIER}/Soldier-Attack01.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('soldier-hurt', `${SOLDIER}/Soldier-Hurt.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('soldier-death', `${SOLDIER}/Soldier-Death.png`, { frameWidth: 100, frameHeight: 100 });

    this.load.spritesheet('orc-idle', `${ORC}/Orc-Idle.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('orc-walk', `${ORC}/Orc-Walk.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('orc-attack', `${ORC}/Orc-Attack01.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('orc-hurt', `${ORC}/Orc-Hurt.png`, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('orc-death', `${ORC}/Orc-Death.png`, { frameWidth: 100, frameHeight: 100 });

    // 384x128 atlas — 24 cols × 8 rows of TILE_SIZE-wide cells. We render the ground from
    // specific frames in GameScene rather than tiling the whole bitmap.
    this.load.spritesheet('grass-tileset', 'resources/grass tileset.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    this.load.image('arrow', 'resources/Arrow(Projectile)/Arrow01(32x32).png');

    // Audio
    this.load.audio('shoot', `${AUDIO}/shoot.wav`);
    this.load.audio('enemy_hit', `${AUDIO}/enemy_hit.wav`);
    this.load.audio('enemy_death', `${AUDIO}/enemy_death.wav`);
    this.load.audio('player_hit', `${AUDIO}/player_hit.wav`);
    this.load.audio('player_death', `${AUDIO}/player_death.wav`);
    this.load.audio('victory', `${AUDIO}/victory.wav`);
  }

  create() {
    this.anims.create({ key: 'soldier-idle', frames: this.anims.generateFrameNumbers('soldier-idle', { start: 0, end: 5 }), frameRate: ANIM_FRAMERATE_IDLE, repeat: -1 });
    this.anims.create({ key: 'soldier-walk', frames: this.anims.generateFrameNumbers('soldier-walk', { start: 0, end: 7 }), frameRate: ANIM_FRAMERATE_WALK, repeat: -1 });
    this.anims.create({ key: 'soldier-attack', frames: this.anims.generateFrameNumbers('soldier-attack', { start: 0, end: 5 }), frameRate: ANIM_FRAMERATE_ATTACK, repeat: 0 });
    this.anims.create({ key: 'soldier-hurt', frames: this.anims.generateFrameNumbers('soldier-hurt', { start: 0, end: 3 }), frameRate: ANIM_FRAMERATE_HURT, repeat: 0 });
    this.anims.create({ key: 'soldier-death', frames: this.anims.generateFrameNumbers('soldier-death', { start: 0, end: 3 }), frameRate: ANIM_FRAMERATE_DEATH, repeat: 0 });

    this.anims.create({ key: 'orc-idle', frames: this.anims.generateFrameNumbers('orc-idle', { start: 0, end: 5 }), frameRate: ANIM_FRAMERATE_ENEMY_IDLE, repeat: -1 });
    this.anims.create({ key: 'orc-walk', frames: this.anims.generateFrameNumbers('orc-walk', { start: 0, end: 7 }), frameRate: ANIM_FRAMERATE_ENEMY_WALK, repeat: -1 });
    this.anims.create({ key: 'orc-attack', frames: this.anims.generateFrameNumbers('orc-attack', { start: 0, end: 5 }), frameRate: ANIM_FRAMERATE_ENEMY_ATTACK, repeat: 0 });
    this.anims.create({ key: 'orc-hurt', frames: this.anims.generateFrameNumbers('orc-hurt', { start: 0, end: 3 }), frameRate: ANIM_FRAMERATE_ENEMY_HURT, repeat: 0 });
    this.anims.create({ key: 'orc-death', frames: this.anims.generateFrameNumbers('orc-death', { start: 0, end: 3 }), frameRate: ANIM_FRAMERATE_ENEMY_DEATH, repeat: 0 });

    this.scene.start('TitleScene');
  }
}
