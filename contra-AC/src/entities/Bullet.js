import {
  BULLET_SPEED,
  BULLET_LIFETIME_MS,
  BULLET_POOL_MAX_SIZE,
  BULLET_SCALE,
  BULLET_OFFSCREEN_MARGIN,
} from '../config.js';

const TINT_FRIENDLY = 0xffffff;
const TINT_ENEMY = 0xff5555;

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'arrow');
  }

  fire(x, y, dirX, friendly = true) {
    this.setActive(true);
    this.setVisible(true);
    this.body.reset(x, y);
    this.body.allowGravity = false;
    this.body.setVelocity(dirX * BULLET_SPEED, 0);
    this.setScale(BULLET_SCALE);
    this.setFlipX(dirX < 0);
    this.friendly = friendly;
    this.setTint(friendly ? TINT_FRIENDLY : TINT_ENEMY);
    this.spawnedAt = this.scene.time.now;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    if (time - this.spawnedAt > BULLET_LIFETIME_MS) {
      this.disableBody(true, true);
      return;
    }

    const cam = this.scene.cameras.main;
    const left = cam.worldView.x - BULLET_OFFSCREEN_MARGIN;
    const right = cam.worldView.x + cam.worldView.width + BULLET_OFFSCREEN_MARGIN;
    if (this.x < left || this.x > right) {
      this.disableBody(true, true);
    }
  }
}

export function createBulletPool(scene) {
  return scene.physics.add.group({
    classType: Bullet,
    maxSize: BULLET_POOL_MAX_SIZE,
    runChildUpdate: false, // Bullet uses preUpdate (auto-called by Phaser).
  });
}
