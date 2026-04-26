import {
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_FIRE_COOLDOWN_MS,
  PLAYER_MAX_HP,
  PLAYER_HIT_IFRAMES_MS,
  PLAYER_HIT_BLINK_INTERVAL_MS,
} from '../config.js';
import {
  playShootPlaceholder,
  playPlayerHurtPlaceholder,
  playPlayerDeathPlaceholder,
} from '../audio.js';

const FIRE_OFFSET_X = 30;
const FIRE_OFFSET_Y = -10;

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'soldier-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
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
    this.hurting = false;
    this.dead = false;
    this.hp = PLAYER_MAX_HP;
    this.invulnerableUntil = 0;
    this.blinkTween = null;

    this.on('animationcomplete-soldier-attack', () => {
      this.attacking = false;
    });

    this.on('animationcomplete-soldier-hurt', () => {
      this.hurting = false;
    });

    this.on('animationcomplete-soldier-death', () => {
      this.scene.scene.start('GameOverScene', { reason: 'killed', score: this.scene.score ?? 0 });
    });

    this.play('soldier-idle');
  }

  update() {
    if (this.dead) {
      this.setVelocityX(0);
      return;
    }

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

    if (!this.attacking && !this.hurting) {
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

  takeDamage(amount = 1) {
    if (this.dead) return;
    const time = this.scene.time.now;
    if (time < this.invulnerableUntil) return;

    this.hp = Math.max(0, this.hp - amount);
    this.scene.events.emit('player-hp-changed', this.hp);

    if (this.hp > 0) {
      this.invulnerableUntil = time + PLAYER_HIT_IFRAMES_MS;
      this.attacking = false;
      this.hurting = true;
      this.play('soldier-hurt');
      playPlayerHurtPlaceholder();
      this.startBlink();
      return;
    }

    this.dead = true;
    this.invulnerableUntil = Number.POSITIVE_INFINITY;
    this.setVelocity(0, 0);
    this.attacking = false;
    this.hurting = false;
    this.stopBlink();
    this.setAlpha(1);
    this.play('soldier-death');
    playPlayerDeathPlaceholder();
  }

  startBlink() {
    this.stopBlink();
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: PLAYER_HIT_BLINK_INTERVAL_MS,
    });
    this.scene.time.delayedCall(PLAYER_HIT_IFRAMES_MS, () => {
      this.stopBlink();
      this.setAlpha(1);
    });
  }

  stopBlink() {
    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }
  }
}
