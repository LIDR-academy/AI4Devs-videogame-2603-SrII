import { ENEMY_VARIANTS } from '../config.js';

const ENEMY_FIRE_OFFSET_X = 30;
const ENEMY_FIRE_OFFSET_Y = -8;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, variantKey) {
    super(scene, x, y, 'orc-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const cfg = ENEMY_VARIANTS[variantKey];
    this.variantKey = variantKey;
    this.cfg = cfg;
    this.hp = cfg.hp;

    this.setTint(cfg.tint);
    this.setScale(cfg.scale);
    this.setCollideWorldBounds(true);
    this.body.setSize(cfg.hitbox.width, cfg.hitbox.height).setOffset(cfg.hitbox.offsetX, cfg.hitbox.offsetY);

    this.nextFireAt = 0;
    this.nextJumpAt = 0;
    this.dead = false;

    this.play('orc-idle');

    this.on('animationcomplete-orc-death', () => {
      this.scene?.events?.emit('enemy-killed', { variant: this.variantKey });
      this.destroy();
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active || this.dead) return;

    const player = this.scene.player;
    if (!player) return;

    switch (this.cfg.behaviorId) {
      case 'walkToward':
        this.behaviorWalk(player);
        break;
      case 'standAndShoot':
        this.behaviorStandShoot(player, time);
        break;
      case 'hopToward':
        this.behaviorHop(player, time);
        break;
    }
  }

  behaviorWalk(player) {
    const dir = player.x < this.x ? -1 : 1;
    this.setVelocityX(dir * this.cfg.speed);
    this.setFlipX(dir < 0);
    this.playMovementAnim();
  }

  behaviorStandShoot(player, time) {
    this.setVelocityX(0);
    const dir = player.x < this.x ? -1 : 1;
    this.setFlipX(dir < 0);

    const cam = this.scene.cameras.main;
    const onScreen = this.x >= cam.worldView.x && this.x <= cam.worldView.x + cam.worldView.width;
    if (!onScreen) {
      this.playMovementAnim();
      return;
    }

    if (time >= this.nextFireAt) {
      const bullet = this.scene.bullets?.get();
      if (bullet) {
        bullet.fire(this.x + dir * ENEMY_FIRE_OFFSET_X, this.y + ENEMY_FIRE_OFFSET_Y, dir, false);
      }
      this.nextFireAt = time + this.cfg.fireIntervalMs;
      this.play('orc-attack', true);
    } else if (this.anims.currentAnim?.key !== 'orc-attack' || !this.anims.isPlaying) {
      this.playMovementAnim();
    }
  }

  behaviorHop(player, time) {
    const dir = player.x < this.x ? -1 : 1;
    this.setVelocityX(dir * this.cfg.speed);
    this.setFlipX(dir < 0);

    if (this.body.blocked.down && time >= this.nextJumpAt) {
      this.setVelocityY(-this.cfg.jumpVelocity);
      this.nextJumpAt = time + this.cfg.jumpIntervalMs;
    }
    this.playMovementAnim();
  }

  playMovementAnim() {
    if (this.anims.currentAnim?.key === 'orc-hurt' && this.anims.isPlaying) return;
    if (this.anims.currentAnim?.key === 'orc-attack' && this.anims.isPlaying) return;
    const want = this.body.velocity.x !== 0 ? 'orc-walk' : 'orc-idle';
    if (this.anims.currentAnim?.key !== want) this.play(want);
  }

  takeDamage(amount = 1) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.hp > 0) {
      this.play('orc-hurt');
      return;
    }
    this.dead = true;
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.play('orc-death');
  }
}
