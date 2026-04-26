import {
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_FIRE_COOLDOWN_MS,
} from '../config.js';
import { playShootPlaceholder } from '../audio.js';

const FIRE_OFFSET_X = 30;
const FIRE_OFFSET_Y = -10;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'soldier-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Character occupies roughly the middle 30x30 of each 100x100 frame.
    this.body.setSize(30, 30).setOffset(35, 35);

    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      x: Phaser.Input.Keyboard.KeyCodes.X,
    });

    this.lastFiredAt = 0;
    this.attacking = false;

    this.on('animationcomplete-soldier-attack', () => {
      this.attacking = false;
    });

    this.play('soldier-idle');
  }

  update() {
    const leftDown = this.keys.left.isDown || this.keys.a.isDown;
    const rightDown = this.keys.right.isDown || this.keys.d.isDown;

    if (leftDown && !rightDown) {
      this.setVelocityX(-PLAYER_RUN_SPEED);
      this.setFlipX(true);
    } else if (rightDown && !leftDown) {
      this.setVelocityX(PLAYER_RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.body.blocked.down) {
      this.setVelocityY(-PLAYER_JUMP_VELOCITY);
    }

    this.tryFire();

    if (!this.attacking) {
      const want = this.body.velocity.x !== 0 ? 'soldier-walk' : 'soldier-idle';
      if (this.anims.currentAnim?.key !== want) this.play(want);
    }
  }

  tryFire() {
    const time = this.scene.time.now;
    if (time - this.lastFiredAt < PLAYER_FIRE_COOLDOWN_MS) return;

    const pointer = this.scene.input.activePointer;
    const fireRequested =
      this.keys.z.isDown || this.keys.x.isDown || (pointer && pointer.leftButtonDown());
    if (!fireRequested) return;

    const bullet = this.scene.bullets?.get();
    if (!bullet) return;

    const dirX = this.flipX ? -1 : 1;
    bullet.fire(this.x + dirX * FIRE_OFFSET_X, this.y + FIRE_OFFSET_Y, dirX, true);

    this.lastFiredAt = time;
    this.attacking = true;
    this.play('soldier-attack', true);
    playShootPlaceholder();
  }
}
